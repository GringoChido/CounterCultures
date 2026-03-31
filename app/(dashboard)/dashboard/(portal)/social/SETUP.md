# Social Media Hub — Meta API Setup Guide

The Social Media Hub works in **Demo Mode** out of the box with sample data. To connect live Facebook and Instagram accounts, follow these steps.

---

## Prerequisites

1. A **Facebook Page** for Counter Cultures
2. An **Instagram Business Account** linked to that Facebook Page
3. A **Meta Developer Account** at [developers.facebook.com](https://developers.facebook.com)

## Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Click **Create App** → choose **Business** type
3. Name it "Counter Cultures Dashboard" (or similar)
4. Add these products to your app:
   - **Facebook Login for Business**
   - **Instagram Graph API**

## Step 2: Generate a Page Access Token

1. In your Meta App dashboard, go to **Tools** → **Graph API Explorer**
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Select these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `pages_read_user_content`
   - `pages_manage_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
5. Click **Generate Access Token** and authorize
6. **Important**: Exchange the short-lived token for a long-lived one:

```
GET https://graph.facebook.com/v21.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app-id}&
  client_secret={app-secret}&
  fb_exchange_token={short-lived-token}
```

## Step 3: Get Your Page ID and Instagram Account ID

**Page ID:**
```
GET https://graph.facebook.com/v21.0/me/accounts?access_token={token}
```
Look for your page in the response → copy the `id` field.

**Instagram Account ID:**
```
GET https://graph.facebook.com/v21.0/{page-id}?fields=instagram_business_account&access_token={token}
```
Copy the `instagram_business_account.id` field.

## Step 4: Add Environment Variables

Add these to your `.env.local` file:

```env
META_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token
META_PAGE_ID=your_facebook_page_id
META_INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id
```

## Step 5: Restart and Test

1. Restart your dev server: `npm run dev`
2. Navigate to the Social Media Hub in the dashboard
3. The "Demo Mode" banner should disappear, replaced by a "Connected" indicator
4. Your live posts, comments, and analytics will appear

## API Rate Limits

Meta Graph API has rate limits to be aware of:
- **200 calls/user/hour** for most endpoints
- **Publishing**: 25 posts/day per Page, 25 posts/day per Instagram account
- **Insights**: Cached for ~15 minutes

The dashboard uses `cache: "no-store"` for real-time data. For production, consider adding SWR caching or `revalidate` intervals.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Meta API not configured" | Check all 3 env vars are set |
| 401/403 errors | Token may have expired — regenerate |
| Instagram posts fail | Ensure Instagram Business account (not Personal) |
| No insights data | Insights need 100+ followers to activate |
| Comments not loading | Check `pages_read_user_content` permission |

## Going to Production

For production deployment:

1. Submit your Meta App for **App Review** to get permanent permissions
2. Set up a **System User** token instead of a personal token
3. Store tokens in your hosting provider's environment variables (not `.env.local`)
4. Consider adding a token refresh cron job for long-lived tokens (they expire in ~60 days)
