# LinkedIn Profile Scraper

Uses [HarvestAPI LinkedIn Profile Search](https://apify.com/harvestapi/linkedin-profile-search) on Apify.

## Decision making process

I knew from past experience that scraping a LinkedIn profile can be very challenging. In my previous role at CallSine, we had deployed our own scraper that used Chromium and rotated proxies to avoid detection. This took a long time to build and was essentially a product unto itself. I had tried to look into this in recent months and also learned about how mistakes can cause your IP to be blocked from LinkedIn, or cause your LinkedIn account to be banned. I wanted to avoid all of this possibility so I started looking for third party APIs. I tried Bright Data API and it was not returning job descriptions along with the experience. I then looked into the official LinkedIn API but did not think I would get approval in time. Eventually I found an API on Apify and got good results from it, so I went with that.

From there it was straight forward. I put togehter a simple component with an input field, and I added some url validation and debouncing to ensure that the input matched a linkedin url and could provide feedback through th UI to the user.

The React PDF library was also fairly straight forward to implement, and I created a separate component to lay out the PDF format using React PDF's Document, Page, View, Text and Image components.

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

   Open http://localhost:5173, enter a **LinkedIn profile URL**. You will be able to download a PDF resume of the results. Results are cached in the `cache/` folder so repeat requests don’t call Apify again.

## Apify

- Actor: `harvestapi/linkedin-profile-search`
- API runs require an Apify account
