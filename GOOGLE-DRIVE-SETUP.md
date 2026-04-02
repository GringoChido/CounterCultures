# Google Drive + Sheets Setup for Counter Cultures

This connects the CRM Google Drive folder to both the **dashboard** (file browser, read/write) and the **website** (products, leads, bookings via Sheets).

---

## Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with the **arisuccibusiness@gmail.com** account (the Drive owner)
3. Click **Select a project** → **New Project**
4. Name it `counter-cultures-crm` → Click **Create**

## Step 2: Enable APIs

1. In your new project, go to **APIs & Services** → **Library**
2. Search for and **Enable** these two APIs:
   - **Google Drive API**
   - **Google Sheets API**

## Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Name: `counter-cultures-website`
4. Click **Create and Continue** → Skip the optional roles → **Done**
5. Click on the new service account email (looks like `counter-cultures-website@counter-cultures-crm.iam.gserviceaccount.com`)
6. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**
7. A JSON file will download — **keep this safe, you need two values from it**

## Step 4: Share the Drive Folder with the Service Account

1. Open the [Counter Cultures Drive folder](https://drive.google.com/drive/folders/1-TER_FOffabcfkugHwr4FtMqLsAVKgs8)
2. Click **Share** (or the share icon)
3. Paste the service account email: `counter-cultures-website@counter-cultures-crm.iam.gserviceaccount.com`
4. Set permission to **Editor** (so it can upload files and write to sheets)
5. Uncheck "Notify people" → Click **Share**

## Step 5: Create the CRM Spreadsheet

1. In the Counter Cultures Drive folder, create a new Google Sheet
2. Name it: `Counter Cultures CRM`
3. Create these tabs (sheets) with these header rows:

### Tab: Products
| id | sku | brand | name | nameEn | category | subcategory | price | tradePrice | currency | finishes | images | artisanal | description | descriptionEn | availability | featured | slug |

### Tab: Leads
| id | name | email | phone | source | status | assignedRep | score | createdAt | updatedAt | message |

### Tab: Trade_Applications
| id | company | profession | license | status | createdAt | approvedAt | details |

### Tab: Newsletter
| email | subscribedAt | status |

### Tab: Bookings
| id | name | email | phone | date | time | status | notes |

### Tab: Pipeline
| id | contactId | name | stage | value | probability | expectedClose | assignedRep | createdAt | updatedAt | notes |

### Tab: Contacts
| id | name | email | phone | company | type | tags | createdAt | notes |

4. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**THIS_PART_HERE**`/edit`

## Step 6: Set Environment Variables

Open `.env.local` and fill in:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=counter-cultures-website@counter-cultures-crm.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...(paste from JSON key file)...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_ID=<the spreadsheet ID from step 5>
GOOGLE_DRIVE_FOLDER_ID=1-TER_FOffabcfkugHwr4FtMqLsAVKgs8
```

**For the private key:** Open the downloaded JSON file, find the `"private_key"` field, and paste the entire value (including the `-----BEGIN/END-----` parts). Keep the double quotes around it.

## Step 7: Add to Netlify

1. Go to your Netlify site → **Site configuration** → **Environment variables**
2. Add all four variables from Step 6
3. Trigger a new deploy

## What This Enables

| Feature | Where | What it does |
|---------|-------|-------------|
| **Drive file browser** | Dashboard → Drive | Browse, search, upload, create folders in the CRM Drive |
| **Products from Sheets** | Website catalog | Product listings pulled from the Products sheet |
| **Lead capture** | Website contact forms | Form submissions write to the Leads sheet |
| **Trade applications** | Website trade program | Applications write to Trade_Applications sheet |
| **Newsletter signups** | Website footer | Emails write to Newsletter sheet |
| **Showroom bookings** | Website booking page | Bookings write to Bookings sheet |
| **Pipeline tracking** | Dashboard | Sales pipeline data from Pipeline sheet |
| **Contact management** | Dashboard | Contacts stored and managed in Contacts sheet |

---

## Troubleshooting

**"Google Drive not configured" on the dashboard:**
→ One or more env vars are missing. Check all four are set.

**"Failed to fetch from Google Drive":**
→ The service account doesn't have access. Re-share the folder (Step 4).

**Products not showing on the website:**
→ Check that `GOOGLE_SHEETS_ID` points to the right spreadsheet and the `Products` tab exists with data.
