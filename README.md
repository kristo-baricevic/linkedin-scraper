# LinkedIn Profile Scraper

Search for LinkedIn profiles and turn the first result into a resume PDF. Uses [HarvestAPI LinkedIn Profile Search](https://apify.com/harvestapi/linkedin-profile-search) on Apify (paid plan required for API access). Job experience descriptions are included in the PDF.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set your Apify API token**

   Copy `.env.example` to `.env` and set your token (from [Apify Console → Integrations](https://console.apify.com/account/integrations)):

   ```bash
   cp .env.example .env
   # Edit .env and set APIFY_API_TOKEN=your_token
   ```

3. **Run the app**

   ```bash
   npm start
   ```

   Open http://localhost:5173, enter a **search query** (e.g. name or job title) or a **LinkedIn profile URL**; the app uses the first search result and caches by that query. You can download a PDF resume including experience descriptions. Results are cached in the `cache/` folder so repeat requests don’t call Apify again.

## Apify

- Actor: `harvestapi/linkedin-profile-search` (Full profile mode, 1 page, up to 10 items per request).
- API runs require a **paid** Apify plan (free plan only allows runs from the Apify web UI).
