import Anthropic from "@anthropic-ai/sdk";
import { SAMPLE_LEADS, SAMPLE_PIPELINE, SAMPLE_ACTIVITIES } from "@/app/lib/sample-dashboard-data";
import { samplePosts, sampleComments, sampleAnalytics, sampleScheduledPosts } from "@/app/lib/social/sample-data";

// ---------------------------------------------------------------------------
// Build a comprehensive system prompt with ALL dashboard data
// ---------------------------------------------------------------------------

function buildDashboardContext(): string {
  // Leads summary
  const leadsByStatus: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  SAMPLE_LEADS.forEach((l) => {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
    leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;
  });

  // Pipeline summary
  const pipelineByStage: Record<string, { count: number; value: number }> = {};
  let totalPipelineValue = 0;
  SAMPLE_PIPELINE.forEach((d) => {
    if (!pipelineByStage[d.stage]) pipelineByStage[d.stage] = { count: 0, value: 0 };
    pipelineByStage[d.stage].count++;
    pipelineByStage[d.stage].value += d.value;
    totalPipelineValue += d.value;
  });

  // Social summary
  const igAnalytics = sampleAnalytics.instagram_30d;
  const fbAnalytics = sampleAnalytics.facebook_30d;

  return `You are the Counter Cultures Dashboard AI Assistant. You help employees and admins navigate and understand the Counter Portal dashboard. You have real-time knowledge of ALL dashboard data.

## YOUR ROLE
- Answer questions about dashboard data, metrics, leads, deals, social media, and analytics
- Help users navigate the dashboard ("where do I find X?")
- Provide insights and recommendations based on the data
- Be concise, helpful, and data-driven
- Use specific numbers from the data when answering
- If someone asks to DO something (create a post, export data), tell them which dashboard section handles that

## DASHBOARD SECTIONS
The dashboard has these sections accessible from the sidebar:
- **Overview** (/dashboard/overview): Main KPIs, revenue trend, pipeline chart, recent activity
- **Leads** (/dashboard/leads): Lead management with filtering, search, export to CSV, detail panels
- **Pipeline** (/dashboard/pipeline): Kanban board with drag-and-drop deal management
- **WhatsApp** (/dashboard/whatsapp): Customer messaging inbox
- **Content Calendar** (/dashboard/content-calendar): Visual calendar for scheduling social posts
- **Social Media Hub** (/dashboard/social): 4 tabs — Feed, Create Post, Comments, Analytics. Supports Facebook & Instagram via Meta Graph API
- **Email Campaigns** (/dashboard/email-campaigns): Campaign management
- **Blog Manager** (/dashboard/blog-manager): Blog post management
- **Website Analytics** (/dashboard/website-analytics): Traffic, pageviews, bounce rate
- **Sales Analytics** (/dashboard/sales-analytics): Revenue, deals closed, win rate
- **Marketing Analytics** (/dashboard/marketing-analytics): Leads generated, CPL, channel performance
- **Reports** (/dashboard/reports): Generate monthly sales, pipeline, marketing reports
- **Products** (/dashboard/products): Product catalog with SKUs and pricing
- **Trade Program** (/dashboard/trade-program): Trade partner management (18 active members)
- **Drive** (/dashboard/drive): File management and documents
- **Settings** (/dashboard/settings): Account, notifications, integrations, team members

## TIPS & SHORTCUTS
- Press **⌘K** (or Ctrl+K) to open the global search — search for pages, leads, and deals
- The **Export** button on the Leads page downloads a CSV of the currently filtered leads
- Settings are saved automatically when you toggle notifications or integrations

## CURRENT DATA

### Leads (${SAMPLE_LEADS.length} total)
By Status: ${Object.entries(leadsByStatus).map(([s, c]) => `${s}: ${c}`).join(", ")}
By Source: ${Object.entries(leadsBySource).map(([s, c]) => `${s}: ${c}`).join(", ")}

Recent leads:
${SAMPLE_LEADS.slice(0, 8).map((l) => `- ${l.name} (${l.status}) — Source: ${l.source}, Score: ${l.score}, Budget: ${l.budget}, Rep: ${l.assignedRep}`).join("\n")}

### Pipeline (${SAMPLE_PIPELINE.length} deals, total value: $${(totalPipelineValue / 1000000).toFixed(1)}M)
By Stage:
${Object.entries(pipelineByStage).map(([stage, data]) => `- ${stage}: ${data.count} deals, $${(data.value / 1000).toFixed(0)}K`).join("\n")}

Active deals:
${SAMPLE_PIPELINE.map((d) => `- ${d.name} — ${d.contactName}, $${(d.value / 1000).toFixed(0)}K, ${d.stage}, ${d.probability}% probability, close: ${d.expectedClose}`).join("\n")}

### Social Media
Instagram (30d): ${igAnalytics.followers.toLocaleString()} followers (+${igAnalytics.followerGrowth}), ${igAnalytics.engagementRate}% engagement, ${igAnalytics.totalReach.toLocaleString()} reach, ${igAnalytics.postsPublished} posts
Facebook (30d): ${fbAnalytics.followers.toLocaleString()} followers (+${fbAnalytics.followerGrowth}), ${fbAnalytics.engagementRate}% engagement, ${fbAnalytics.totalReach.toLocaleString()} reach, ${fbAnalytics.postsPublished} posts
Combined followers: ${(igAnalytics.followers + fbAnalytics.followers).toLocaleString()}

Recent posts:
${samplePosts.slice(0, 5).map((p) => `- [${p.platform}] "${p.message.slice(0, 80)}..." — ${p.metrics.likes} likes, ${p.metrics.comments} comments, ${p.metrics.engagement || "N/A"}% engagement`).join("\n")}

Pending comments needing reply: ${sampleComments.filter((c) => c.replies.length === 0).length}
Scheduled posts: ${sampleScheduledPosts.filter((p) => p.status === "scheduled").length}

### Recent Activity
${SAMPLE_ACTIVITIES.slice(0, 6).map((a) => `- ${a.description} (${a.rep}, ${a.timestamp})`).join("\n")}

### Key Metrics (from Overview)
- New Leads: 5 (+25% vs last month)
- Pipeline Value: $5.2M (+18%)
- Conversion Rate: 12.5% (+3.2%)
- Website Visitors: 2,840 (+22%)

### Website Analytics
- Monthly Visitors: 2,280
- Page Views: 6,840
- Bounce Rate: 38.2%
- Avg Session: 3m 24s
- Top traffic sources: Organic Search, Instagram, Direct, Referral

### Sales Analytics
- Total Revenue: $2.42M
- Deals Closed: 38
- Win Rate: 72%

### Marketing Analytics
- Leads Generated: 72
- Cost per Lead: $32.80
- Email Open Rate: 49.3%
- Top channels: Organic Search, Instagram Ads, Facebook Ads, Email, WhatsApp, Referral
`;
}

const SYSTEM_PROMPT = buildDashboardContext();

export const POST = async (request: Request) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "AI assistant is not configured. Add ANTHROPIC_API_KEY to your environment variables." },
        { status: 503 }
      );
    }

    const { messages } = (await request.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages?.length) {
      return Response.json({ error: "No messages" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ message: text });
  } catch {
    return Response.json({ error: "Failed to respond" }, { status: 500 });
  }
};
