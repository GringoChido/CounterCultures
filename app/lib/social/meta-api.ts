// =============================================================================
// Meta Graph API Client — Facebook + Instagram
// =============================================================================
// This module wraps the Meta Graph API for publishing, reading comments,
// and pulling insights. When env vars are missing, callers should fall back
// to the sample-data module so the dashboard still works in dev/demo mode.
// =============================================================================

import type {
  SocialPost,
  SocialComment,
  CreatePostPayload,
  PlatformAnalytics,
  ReplyToCommentPayload,
  ApiResponse,
} from "./types";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConfig() {
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const instagramAccountId = process.env.META_INSTAGRAM_ACCOUNT_ID;

  if (!pageAccessToken || !pageId || !instagramAccountId) {
    return null; // signals "use sample data"
  }

  return { pageAccessToken, pageId, instagramAccountId };
}

async function graphFetch<T>(
  endpoint: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${GRAPH_API_BASE}${endpoint}${separator}access_token=${token}`;

  const res = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error?.error?.message || `Graph API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Facebook Posts
// ---------------------------------------------------------------------------

export async function publishToFacebook(
  message: string,
  mediaUrl?: string
): Promise<ApiResponse<{ id: string }>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    if (mediaUrl) {
      const result = await graphFetch<{ id: string }>(
        `/${config.pageId}/photos`,
        config.pageAccessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, url: mediaUrl }),
        }
      );
      return { success: true, data: result };
    }

    const result = await graphFetch<{ id: string }>(
      `/${config.pageId}/feed`,
      config.pageAccessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      }
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Instagram Posts (Container → Publish flow)
// ---------------------------------------------------------------------------

export async function publishToInstagram(
  message: string,
  mediaUrl: string,
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL" = "IMAGE"
): Promise<ApiResponse<{ id: string }>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    // Step 1: Create media container
    const container = await graphFetch<{ id: string }>(
      `/${config.instagramAccountId}/media`,
      config.pageAccessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: message,
          image_url: mediaType === "IMAGE" ? mediaUrl : undefined,
          video_url: mediaType === "VIDEO" ? mediaUrl : undefined,
          media_type: mediaType,
        }),
      }
    );

    // Step 2: Publish container
    const result = await graphFetch<{ id: string }>(
      `/${config.instagramAccountId}/media_publish`,
      config.pageAccessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id }),
      }
    );

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Fetch Posts
// ---------------------------------------------------------------------------

export async function getFacebookPosts(
  limit = 25
): Promise<ApiResponse<SocialPost[]>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const result = await graphFetch<{
      data: Array<{
        id: string;
        message?: string;
        created_time: string;
        full_picture?: string;
        permalink_url?: string;
        likes?: { summary: { total_count: number } };
        comments?: { summary: { total_count: number } };
        shares?: { count: number };
      }>;
    }>(
      `/${config.pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}`,
      config.pageAccessToken
    );

    const posts: SocialPost[] = result.data.map((p) => ({
      id: p.id,
      platform: "facebook" as const,
      message: p.message || "",
      mediaUrl: p.full_picture,
      mediaType: p.full_picture ? ("IMAGE" as const) : undefined,
      permalink: p.permalink_url,
      createdAt: p.created_time,
      status: "published" as const,
      metrics: {
        likes: p.likes?.summary?.total_count || 0,
        comments: p.comments?.summary?.total_count || 0,
        shares: p.shares?.count || 0,
      },
    }));

    return { success: true, data: posts };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getInstagramPosts(
  limit = 25
): Promise<ApiResponse<SocialPost[]>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const result = await graphFetch<{
      data: Array<{
        id: string;
        caption?: string;
        timestamp: string;
        media_url?: string;
        media_type?: string;
        permalink?: string;
        like_count?: number;
        comments_count?: number;
      }>;
    }>(
      `/${config.instagramAccountId}/media?fields=id,caption,timestamp,media_url,media_type,permalink,like_count,comments_count&limit=${limit}`,
      config.pageAccessToken
    );

    const posts: SocialPost[] = result.data.map((p) => ({
      id: p.id,
      platform: "instagram" as const,
      message: p.caption || "",
      mediaUrl: p.media_url,
      mediaType: (p.media_type as "IMAGE" | "VIDEO" | "CAROUSEL") || undefined,
      permalink: p.permalink,
      createdAt: p.timestamp,
      status: "published" as const,
      metrics: {
        likes: p.like_count || 0,
        comments: p.comments_count || 0,
        shares: 0,
      },
    }));

    return { success: true, data: posts };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getPostComments(
  postId: string,
  platform: "facebook" | "instagram"
): Promise<ApiResponse<SocialComment[]>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const fields =
      platform === "facebook"
        ? "id,message,from,created_time,like_count,is_hidden,comments{id,message,from,created_time,like_count}"
        : "id,text,username,timestamp,like_count,replies{id,text,username,timestamp,like_count}";

    const result = await graphFetch<{
      data: Array<Record<string, unknown>>;
    }>(`/${postId}/comments?fields=${fields}`, config.pageAccessToken);

    const comments: SocialComment[] = result.data.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      postId,
      platform,
      author: {
        name:
          platform === "facebook"
            ? ((c.from as Record<string, string>)?.name || "Unknown")
            : (c.username as string || "Unknown"),
      },
      message: (platform === "facebook" ? c.message : c.text) as string,
      createdAt: (platform === "facebook" ? c.created_time : c.timestamp) as string,
      likeCount: (c.like_count as number) || 0,
      isHidden: (c.is_hidden as boolean) || false,
      replies: [],
    }));

    return { success: true, data: comments };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function replyToComment(
  payload: ReplyToCommentPayload
): Promise<ApiResponse<{ id: string }>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const result = await graphFetch<{ id: string }>(
      `/${payload.commentId}/replies`,
      config.pageAccessToken,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payload.message }),
      }
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Insights / Analytics
// ---------------------------------------------------------------------------

export async function getFacebookInsights(
  period: "day" | "week" | "days_28" = "days_28"
): Promise<ApiResponse<Record<string, unknown>>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const metrics = [
      "page_impressions",
      "page_engaged_users",
      "page_post_engagements",
      "page_fan_adds",
      "page_fans_locale",
    ].join(",");

    const result = await graphFetch<Record<string, unknown>>(
      `/${config.pageId}/insights?metric=${metrics}&period=${period}`,
      config.pageAccessToken
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function getInstagramInsights(
  period: "day" | "week" | "days_28" = "days_28"
): Promise<ApiResponse<Record<string, unknown>>> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const metrics = [
      "impressions",
      "reach",
      "follower_count",
      "profile_views",
    ].join(",");

    const result = await graphFetch<Record<string, unknown>>(
      `/${config.instagramAccountId}/insights?metric=${metrics}&period=${period}`,
      config.pageAccessToken
    );
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Connection Test
// ---------------------------------------------------------------------------

export async function testMetaConnection(): Promise<
  ApiResponse<{ facebook: boolean; instagram: boolean }>
> {
  const config = getConfig();
  if (!config) return { success: false, error: "Meta API not configured" };

  try {
    const fbResult = await graphFetch<{ id: string; name: string }>(
      `/${config.pageId}?fields=id,name`,
      config.pageAccessToken
    );

    const igResult = await graphFetch<{ id: string; username: string }>(
      `/${config.instagramAccountId}?fields=id,username`,
      config.pageAccessToken
    );

    return {
      success: true,
      data: { facebook: !!fbResult.id, instagram: !!igResult.id },
    };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
