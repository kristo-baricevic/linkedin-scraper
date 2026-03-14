# LinkedIn to PDF Resume

Turn a public LinkedIn profile URL into a one-page PDF resume.

- **Client:** Vite + React (in `client/`). URL input, calls the server, then builds a PDF with [@react-pdf/renderer](https://react-pdf.org/) and a download button.
- **Server:** Express + Playwright (in `server/`). Single `POST /api/scrape` endpoint that opens the LinkedIn URL headlessly, scrapes profile data, and returns JSON (profile photo as base64).

## Run

```bash
npm i
npx playwright install chromium
npm start
```

Then open http://localhost:5173, paste a LinkedIn profile URL (e.g. `https://www.linkedin.com/in/username`), click **Scrape profile**, then **Download PDF**.

## Repo structure

```
/
├── client/          # Vite + React + @react-pdf/renderer
├── server/          # Express + Playwright
└── package.json     # root — concurrently runs both
```

## Key decisions

### Why Playwright instead of a paid API?

We use a local headless browser (Playwright) so the app works without API keys, subscriptions, or rate limits from third-party LinkedIn scrapers. It only needs a public profile URL and runs against the same page an unauthenticated user would see in a browser.

### Why use `og:image` for the profile photo?

LinkedIn’s profile picture is often not exposed as a simple image URL in the DOM for unauthenticated viewers. The Open Graph meta tag `og:image` is set for sharing and is a stable way to get a profile image URL. We fetch that URL and embed it as base64 in the PDF so the document is self-contained and doesn’t depend on external image URLs at view time.

### Limitation: truncated data for unauthenticated visitors

LinkedIn may show less (or different) data to users who aren’t logged in. Experience and education sections can be abbreviated or missing. The scraper only sees what a normal unauthenticated visit sees; we don’t log in or use cookies.
