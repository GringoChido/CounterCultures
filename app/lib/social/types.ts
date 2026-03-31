// =============================================================================
// Social Media Types — Meta Graph API (Facebook + Instagram)
// =============================================================================

export type SocialPlatform = "facebook" | "instagram";

// --- Auth & Config ---
export interface MetaConfig {
  appId: string;
  appSecret: string;
  pageAccessToken: string;
  pageId: string;
  instagramAccountId: string;
}

// --- Posts ---
export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  message: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL";
  permalink?: string;
  createdAt: string;
  scheduledAt?: string;
  status: "published" | "scheduled" | "draft";
  metrics: PostMetrics;
}

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach?: number;
  impressions?: number;
  saves?: number;
  engagement?: number;
}

export interface CreatePostPayload {
  platforms: SocialPlatform[];
  message: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL";
  scheduledAt?: string; // ISO string for scheduled posts
  publishNow?: boolean;
}

// --- Comments ---
export interface SocialComment {
  id: string;
  postId: string;
  platform: SocialPlatform;
  author: {
    name: string;
    avatarUrl?: string;
    profileUrl?: string;
  };
  message: string;
  createdAt: string;
  likeCount: number;
  isHidden: boolean;
  replies: SocialCommentReply[];
  postPreview?: string;
}

export interface SocialCommentReply {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  message: string;
  createdAt: string;
  likeCount: number;
}

export interface ReplyToCommentPayload {
  commentId: string;
  message: string;
}

// --- Analytics ---
export interface PlatformAnalytics {
  platform: SocialPlatform;
  period: "7d" | "30d" | "90d";
  followers: number;
  followerGrowth: number;
  totalReach: number;
  totalImpressions: number;
  engagementRate: number;
  postsPublished: number;
  topPost?: SocialPost;
  dailyMetrics: DailyMetric[];
}

export interface DailyMetric {
  date: string;
  reach: number;
  impressions: number;
  engagement: number;
  followers: number;
}

export interface AudienceDemographics {
  platform: SocialPlatform;
  ageGender: { label: string; male: number; female: number }[];
  topCities: { city: string; count: number }[];
  topCountries: { country: string; count: number }[];
}

// --- Scheduled Content ---
export interface ScheduledPost {
  id: string;
  platforms: SocialPlatform[];
  message: string;
  mediaUrl?: string;
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
  createdAt: string;
}

// --- API Response wrappers ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
