# Keep Backend Alive Setup

This GitHub Actions workflow automatically pings Render.com backend every 10 minutes to prevent it from going to sleep.

## Setup Instructions

### 1. Add Backend URL Secret to GitHub

1. Go to your GitHub repository: https://github.com/csfahad/rbms
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
    - **Name:** `BACKEND_URL`
    - **Value:** Your Render backend URL (e.g., `https://your-app.onrender.com`)
    - Make sure to **NOT include a trailing slash**

### 2. Enable GitHub Actions (if not already enabled)

1. Go to the **Actions** tab in your repository
2. If workflows are disabled, click to enable them
3. The "Keep Backend Alive" workflow should appear

### 3. Test the Workflow

You can manually trigger the workflow to test it:

1. Go to **Actions** → **Keep Backend Alive**
2. Click **Run workflow** → **Run workflow**
3. Check the logs to ensure it's working correctly

## How It Works

-   The workflow runs every 10 minutes (cron: `*/10 * * * *`)
-   It sends a GET request to `{BACKEND_URL}/api/health`
-   If the backend responds with status 200, it logs success
-   If the backend doesn't respond or returns an error, the workflow fails and you'll get notified

## Notes

-   **Free tier limitation:** GitHub Actions has a limit of 2,000 minutes/month for private repos (unlimited for public repos)
-   **This workflow uses:** ~1 minute per day = ~30 minutes per month (well within the free tier)
-   **Render free tier:** Still has limitations (750 hours/month), but this keeps it active when it's available
-   **Alternative:** Consider upgrading to Render's paid plan ($7/month) for guaranteed uptime

## Monitoring

You can monitor the workflow runs:

1. Go to **Actions** tab
2. Click on **Keep Backend Alive**
3. View all runs and their logs

## Optional: Reduce Ping Frequency

If you want to change the frequency:

-   Edit `.github/workflows/keep-alive.yml`
-   Modify the cron expression:
    -   `*/5 * * * *` = every 5 minutes
    -   `*/15 * * * *` = every 15 minutes
    -   `0 * * * *` = every hour

**Recommendation:** Keep it at 10-14 minutes. Render's free tier sleeps after 15 minutes of inactivity.
