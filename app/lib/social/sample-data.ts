// =============================================================================
// Social Media Sample Data — Used when Meta API is not configured
// =============================================================================

import type {
  SocialPost,
  SocialComment,
  PlatformAnalytics,
  DailyMetric,
  ScheduledPost,
} from "./types";

// ---------------------------------------------------------------------------
// Published Posts
// ---------------------------------------------------------------------------

export const samplePosts: SocialPost[] = [
  {
    id: "fb-001",
    platform: "facebook",
    message:
      "Exciting news! Our spring collection is now available. Visit our showroom in San Miguel de Allende to see these stunning pieces in person.",
    mediaUrl: "/images/products/copper-basin-1.jpg",
    mediaType: "IMAGE",
    permalink: "#",
    createdAt: "2026-03-28T14:00:00Z",
    status: "published",
    metrics: { likes: 89, comments: 12, shares: 23, reach: 2340, impressions: 4120, engagement: 5.3 },
  },
  {
    id: "ig-001",
    platform: "instagram",
    message:
      "Our hand-hammered copper basins bring warmth and character to any bathroom. Each piece tells a story of artisan craftsmanship from Santa Clara del Cobre. ✨ #CopperDesign #ArtisanCraft",
    mediaUrl: "/images/products/copper-basin-2.jpg",
    mediaType: "IMAGE",
    permalink: "#",
    createdAt: "2026-03-28T10:00:00Z",
    status: "published",
    metrics: { likes: 234, comments: 18, shares: 45, reach: 5670, impressions: 8900, saves: 67, engagement: 4.8 },
  },
  {
    id: "ig-002",
    platform: "instagram",
    message:
      "Behind the scenes at our artisan workshop. Watch master coppersmith Don Miguel shape a basin using techniques passed down through generations. 🔨🔥",
    mediaUrl: "/images/products/workshop.jpg",
    mediaType: "VIDEO",
    permalink: "#",
    createdAt: "2026-03-26T11:00:00Z",
    status: "published",
    metrics: { likes: 567, comments: 42, shares: 89, reach: 12400, impressions: 18700, saves: 134, engagement: 6.2 },
  },
  {
    id: "fb-002",
    platform: "facebook",
    message:
      "Thank you to our trade partners who joined us for the Spring Preview event this weekend. Your feedback on the new collection was invaluable!",
    createdAt: "2026-03-24T15:00:00Z",
    status: "published",
    metrics: { likes: 56, comments: 8, shares: 11, reach: 1890, impressions: 3200, engagement: 3.9 },
  },
  {
    id: "ig-003",
    platform: "instagram",
    message:
      "Kitchen renovation inspiration: copper farmhouse sinks paired with rustic wooden countertops. Save this for your next project! 📌 #KitchenDesign #InteriorInspo",
    mediaUrl: "/images/products/farmhouse-sink.jpg",
    mediaType: "IMAGE",
    permalink: "#",
    createdAt: "2026-03-22T09:00:00Z",
    status: "published",
    metrics: { likes: 412, comments: 5, shares: 187, reach: 9800, impressions: 14200, saves: 245, engagement: 7.1 },
  },
  {
    id: "fb-003",
    platform: "facebook",
    message:
      "Did you know? Each of our copper basins takes 3-5 days to complete by hand. The patina develops naturally over time, making every piece truly one-of-a-kind.",
    mediaUrl: "/images/products/patina-detail.jpg",
    mediaType: "IMAGE",
    permalink: "#",
    createdAt: "2026-03-20T13:00:00Z",
    status: "published",
    metrics: { likes: 124, comments: 15, shares: 34, reach: 3450, impressions: 5800, engagement: 5.0 },
  },
  {
    id: "ig-004",
    platform: "instagram",
    message:
      "New arrival: The Cascada vessel sink in aged copper. Hand-hammered with a waterfall edge that makes every wash feel like a ritual. Link in bio. 🏺",
    mediaUrl: "/images/products/cascada.jpg",
    mediaType: "IMAGE",
    permalink: "#",
    createdAt: "2026-03-18T10:30:00Z",
    status: "published",
    metrics: { likes: 345, comments: 28, shares: 56, reach: 7200, impressions: 11300, saves: 89, engagement: 5.9 },
  },
  {
    id: "fb-004",
    platform: "facebook",
    message:
      "We're hiring! Counter Cultures is looking for a showroom associate in San Miguel de Allende. Know someone who loves design and artisan craftsmanship? Tag them below! 👇",
    createdAt: "2026-03-16T09:00:00Z",
    status: "published",
    metrics: { likes: 67, comments: 23, shares: 45, reach: 4100, impressions: 6700, engagement: 3.3 },
  },
];

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const sampleComments: SocialComment[] = [
  {
    id: "c-001",
    postId: "ig-001",
    platform: "instagram",
    author: { name: "sarah_designs", avatarUrl: undefined },
    message: "Absolutely stunning work! Where can I order one of these for my bathroom remodel?",
    createdAt: "2026-03-28T12:30:00Z",
    likeCount: 4,
    isHidden: false,
    replies: [
      {
        id: "r-001",
        author: { name: "countercultures" },
        message: "Thank you Sarah! You can browse our full collection at countercultures.com or visit our SMA showroom. DM us for trade pricing! 🙌",
        createdAt: "2026-03-28T13:00:00Z",
        likeCount: 2,
      },
    ],
    postPreview: "Our hand-hammered copper basins bring warmth and character...",
  },
  {
    id: "c-002",
    postId: "ig-002",
    platform: "instagram",
    author: { name: "interiors_by_maria" },
    message: "Don Miguel is a true master! I'd love to feature his work in my next design project.",
    createdAt: "2026-03-26T14:15:00Z",
    likeCount: 8,
    isHidden: false,
    replies: [],
    postPreview: "Behind the scenes at our artisan workshop...",
  },
  {
    id: "c-003",
    postId: "fb-001",
    platform: "facebook",
    author: { name: "Michael Torres" },
    message: "Just visited the showroom last weekend — the quality is incredible. Already ordered a basin for our client's master bath.",
    createdAt: "2026-03-28T16:00:00Z",
    likeCount: 6,
    isHidden: false,
    replies: [
      {
        id: "r-002",
        author: { name: "Counter Cultures" },
        message: "So glad you visited Michael! Can't wait to see how it looks installed. Tag us in the reveal! 📸",
        createdAt: "2026-03-28T17:30:00Z",
        likeCount: 3,
      },
    ],
    postPreview: "Exciting news! Our spring collection is now available...",
  },
  {
    id: "c-004",
    postId: "ig-003",
    platform: "instagram",
    author: { name: "copper_lover_42" },
    message: "Saved! This is exactly the look I've been going for in our kitchen reno 😍",
    createdAt: "2026-03-22T11:45:00Z",
    likeCount: 3,
    isHidden: false,
    replies: [],
    postPreview: "Kitchen renovation inspiration: copper farmhouse sinks...",
  },
  {
    id: "c-005",
    postId: "fb-003",
    platform: "facebook",
    author: { name: "Ana Gutierrez" },
    message: "Love learning about the process! Do you offer workshop tours in Santa Clara del Cobre?",
    createdAt: "2026-03-20T15:20:00Z",
    likeCount: 5,
    isHidden: false,
    replies: [],
    postPreview: "Did you know? Each of our copper basins takes 3-5 days...",
  },
  {
    id: "c-006",
    postId: "ig-004",
    platform: "instagram",
    author: { name: "luxe_bath_studio" },
    message: "The Cascada is gorgeous! What are the dimensions? Trying to spec it for a project.",
    createdAt: "2026-03-18T14:00:00Z",
    likeCount: 2,
    isHidden: false,
    replies: [],
    postPreview: "New arrival: The Cascada vessel sink in aged copper...",
  },
  {
    id: "c-007",
    postId: "fb-004",
    platform: "facebook",
    author: { name: "Roberto Mendez" },
    message: "Just shared this with a friend who'd be perfect for the role. Great company to work for!",
    createdAt: "2026-03-16T10:30:00Z",
    likeCount: 7,
    isHidden: false,
    replies: [
      {
        id: "r-003",
        author: { name: "Counter Cultures" },
        message: "Thanks for spreading the word Roberto! We'd love to meet them. 🙏",
        createdAt: "2026-03-16T11:00:00Z",
        likeCount: 1,
      },
    ],
    postPreview: "We're hiring! Counter Cultures is looking for a showroom associate...",
  },
];

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function generateDailyMetrics(
  days: number,
  baseReach: number,
  baseImpressions: number,
  baseEngagement: number,
  baseFollowers: number
): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const now = new Date("2026-03-31");

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = 0.7 + Math.random() * 0.6; // 0.7–1.3x

    metrics.push({
      date: date.toISOString().split("T")[0],
      reach: Math.round(baseReach * variance),
      impressions: Math.round(baseImpressions * variance),
      engagement: Math.round(baseEngagement * variance * 10) / 10,
      followers: baseFollowers + Math.round((days - i) * 10 * (0.8 + Math.random() * 0.4)),
    });
  }

  return metrics;
}

export const sampleAnalytics: Record<string, PlatformAnalytics> = {
  instagram_30d: {
    platform: "instagram",
    period: "30d",
    followers: 8234,
    followerGrowth: 312,
    totalReach: 48200,
    totalImpressions: 72400,
    engagementRate: 4.8,
    postsPublished: 12,
    dailyMetrics: generateDailyMetrics(30, 1600, 2400, 4.8, 7922),
  },
  facebook_30d: {
    platform: "facebook",
    period: "30d",
    followers: 3156,
    followerGrowth: 87,
    totalReach: 18900,
    totalImpressions: 31200,
    engagementRate: 3.9,
    postsPublished: 8,
    dailyMetrics: generateDailyMetrics(30, 630, 1040, 3.9, 3069),
  },
  instagram_7d: {
    platform: "instagram",
    period: "7d",
    followers: 8234,
    followerGrowth: 78,
    totalReach: 12400,
    totalImpressions: 18700,
    engagementRate: 5.2,
    postsPublished: 3,
    dailyMetrics: generateDailyMetrics(7, 1770, 2670, 5.2, 8156),
  },
  facebook_7d: {
    platform: "facebook",
    period: "7d",
    followers: 3156,
    followerGrowth: 22,
    totalReach: 4890,
    totalImpressions: 8100,
    engagementRate: 4.1,
    postsPublished: 2,
    dailyMetrics: generateDailyMetrics(7, 700, 1160, 4.1, 3134),
  },
};

// ---------------------------------------------------------------------------
// Scheduled Posts
// ---------------------------------------------------------------------------

export const sampleScheduledPosts: ScheduledPost[] = [
  {
    id: "sp-001",
    platforms: ["instagram", "facebook"],
    message: "Introducing our Summer Collection — where copper meets coastal design. Available June 1st. ☀️",
    mediaUrl: "/images/products/summer-preview.jpg",
    scheduledAt: "2026-04-02T10:00:00Z",
    status: "scheduled",
    createdAt: "2026-03-29T09:00:00Z",
  },
  {
    id: "sp-002",
    platforms: ["instagram"],
    message: "Transformation Tuesday: See how this raw copper sheet becomes a stunning vessel sink. Swipe to follow the journey → #TransformationTuesday",
    mediaUrl: "/images/products/transformation.jpg",
    scheduledAt: "2026-04-01T11:00:00Z",
    status: "scheduled",
    createdAt: "2026-03-28T14:00:00Z",
  },
  {
    id: "sp-003",
    platforms: ["facebook"],
    message: "Happy to announce we'll be exhibiting at BDNY 2026 in November! Come see our latest designs in person. Booth details coming soon.",
    scheduledAt: "2026-04-03T14:00:00Z",
    status: "scheduled",
    createdAt: "2026-03-30T10:00:00Z",
  },
  {
    id: "sp-004",
    platforms: ["instagram", "facebook"],
    message: "Customer spotlight: See how @hacienda_moderna incorporated our copper range hood into their stunning kitchen remodel. 🏠✨",
    mediaUrl: "/images/products/customer-spotlight.jpg",
    scheduledAt: "2026-04-05T09:30:00Z",
    status: "scheduled",
    createdAt: "2026-03-30T16:00:00Z",
  },
];
