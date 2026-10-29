# ECO Mobility – Business Partner Survey

A mobile survey for ECO Mobility vehicle partners and chauffeurs in 12 languages: English, Hindi, Marathi, Gujarati, Punjabi, Bengali, Assamese, Odia, Tamil, Telugu, Kannada and Malayalam. Each response is saved as a row in a Google Sheet.

- `index.html`: the survey page (language picker, details, 7 questions, suggestion)
- `api/submit.js`: Vercel function that checks each response and forwards it to the sheet
- `google-apps-script/Code.gs`: script that runs inside the Google Sheet and appends rows

## One-time setup

### 1. Google Sheet

1. Create a new Google Sheet, for example "ECO Vendor Survey Responses".
2. Open **Extensions → Apps Script**, delete the sample code and paste in `google-apps-script/Code.gs`.
3. Change `SECRET` to a long random string and keep a copy of it.
4. Click **Deploy → New deployment → Select type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permissions, and copy the **Web app URL** (ends in `/exec`).

### 2. Vercel

1. In Vercel, click **Add New → Project** and import this GitHub repository. No build settings are needed.
2. Under **Settings → Environment Variables**, add:
   - `SHEET_WEBHOOK_URL`: the Web app URL from step 1.5
   - `SHEET_SECRET`: the same secret you set in `Code.gs`
3. Open **Deployments** and redeploy so the variables take effect.

The survey is then live at `https://<project>.vercel.app`. Fill it in once yourself and check that a row appears in the **Responses** tab of the sheet.

## Downloading responses

In the Google Sheet, use **File → Download → Microsoft Excel (.xlsx)** or **CSV**. You can also share the sheet with colleagues, or build charts directly in it.

## Changing the Apps Script later

After editing `Code.gs`, use **Deploy → Manage deployments → Edit → Version: New version**. That keeps the same URL. A brand-new deployment gets a new URL, and then you must update `SHEET_WEBHOOK_URL` in Vercel.
