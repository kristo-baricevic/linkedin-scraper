import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());
app.use(express.json());

function isValidLinkedInProfileUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes("linkedin.com") && u.pathname.startsWith("/in/");
  } catch {
    return false;
  }
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkedIn-Resume/1.0)" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

app.post("/api/scrape", async (req, res) => {
  const url = req.body?.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url" });
  }
  if (!isValidLinkedInProfileUrl(url)) {
    return res.status(400).json({ error: "Invalid LinkedIn profile URL" });
  }

  function parseMetaFromHtml(html) {
    const out = {};
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogTitle) out.name = ogTitle[1].replace(/&amp;/g, "&").trim();
    if (ogDesc) out.about = ogDesc[1].replace(/&amp;/g, "&").trim();
    if (ogImage) out.profileImageUrl = ogImage[1].trim();
    return out;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

    // Get og: meta from first HTML in case the page later becomes login wall or empty
    const initialHtml = await page.content();
    const metaFallback = parseMetaFromHtml(initialHtml);

    await page.waitForLoadState("networkidle").catch(() => {});

    // Scroll to load lazy sections (experience, education)
    await page.evaluate(async () => {
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 600);
        await delay(400);
      }
      window.scrollTo(0, 0);
      await delay(300);
    });

    // Expand "See more" in About so we get full text
    await page.evaluate(() => {
      document.querySelectorAll("button span, span[aria-hidden='true']").forEach((el) => {
        const text = (el.textContent || "").trim().toLowerCase();
        if (text === "see more" || text === "see less") {
          const btn = el.closest("button");
          if (btn) btn.click();
        }
      });
    });
    await new Promise((r) => setTimeout(r, 600));

    const profile = await page.evaluate(() => {
      const decodeHtml = (str) => {
        if (!str) return str;
        const div = document.createElement("div");
        div.innerHTML = str;
        return div.textContent || str;
      };
      const getMeta = (name) => {
        const el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
        const v = el?.getAttribute("content")?.trim();
        return v ? decodeHtml(v) : null;
      };
      const name = getMeta("og:title") || document.querySelector("h1")?.textContent?.trim() || null;
      const profileImageUrl = getMeta("og:image");

      // About: prefer full text from DOM over truncated og:description
      let about = null;
      const aboutSection = Array.from(document.querySelectorAll("section")).find((s) => {
        const h2 = s.querySelector("h2");
        return h2 && h2.textContent?.trim()?.toLowerCase() === "about";
      });
      if (aboutSection) {
        const aboutBlock = aboutSection.querySelector(".inline-show-more-text, [class*='inline'], .pv-about__summary-text, div span[dir='ltr']");
        if (aboutBlock) about = aboutBlock.textContent?.trim();
      }
      if (!about) about = getMeta("og:description");

      const getSectionItems = (sectionIdOrLabel) => {
        let section = document.getElementById(sectionIdOrLabel);
        if (!section) {
          const sections = Array.from(document.querySelectorAll("section"));
          section = sections.find((s) => {
            const h2 = s.querySelector("h2");
            return h2 && h2.textContent?.toLowerCase().includes(sectionIdOrLabel.toLowerCase());
          });
        }
        if (!section) return [];
        const items = [];
        const listItems = section.querySelectorAll("ul li.pvs-list__item, ul li, .pvs-list__outer-container");
        listItems.forEach((li) => {
          const spans = li.querySelectorAll("span[aria-hidden='true']");
          const texts = Array.from(spans).map((s) => s.textContent?.trim()).filter(Boolean);
          const titleEl = li.querySelector(".mr1.t-bold span, [class*='t-bold'] span, h3 span");
          const title = titleEl?.textContent?.trim() || texts[0] || null;
          const rest = li.querySelectorAll(".t-14.t-normal span, [class*='t-normal'] span");
          let company = null;
          let dates = null;
          rest.forEach((s) => {
            const t = s.textContent?.trim();
            if (!t || t.length > 100) return;
            if (dates == null && /^\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|–|-|to/i.test(t)) dates = t;
            else if (company == null && t !== title) company = t;
          });
          if (!company && texts[1]) company = texts[1];
          if (!dates && texts[2]) dates = texts[2];
          if (title || company) items.push({ title: title || null, company: company || null, dates: dates || null });
        });
        return items;
      };

      const experience = getSectionItems("experience");
      const education = getSectionItems("education");

      const locationEl = document.querySelector("[data-test-id='line-item-location'], .pv-top-card--list li, [class*='location']");
      const location = locationEl?.textContent?.trim() || null;

      let headline = null;
      const headlineSelectors = [
        "[data-test-id='headline']",
        ".pv-top-card--list-bullet li",
        ".text-body-medium.break-words",
      ];
      for (const sel of headlineSelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && !el.textContent.includes("followers") && el.textContent.trim().length > 0 && el.textContent.trim().length < 500) {
          headline = el.textContent.trim();
          break;
        }
      }

      return {
        name,
        headline,
        location,
        about: about ? decodeHtml(about) : null,
        profileImageUrl,
        experience: experience.length ? experience : null,
        education: education.length ? education : null,
      };
    });

    // Use og: meta from initial HTML when DOM scrape returned nothing (e.g. login wall)
    if (!profile.name && metaFallback.name) profile.name = metaFallback.name;
    if (!profile.about && metaFallback.about) profile.about = metaFallback.about;
    if (!profile.profileImageUrl && metaFallback.profileImageUrl) profile.profileImageUrl = metaFallback.profileImageUrl;

    if (profile.profileImageUrl) {
      profile.profileImageBase64 = await fetchImageAsBase64(profile.profileImageUrl);
    } else {
      profile.profileImageBase64 = null;
    }
    delete profile.profileImageUrl;

    await browser.close();
    res.json(profile);
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error(err);
    res.status(500).json({ error: err.message || "Scrape failed" });
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process (e.g. run: lsof -ti:${PORT} | xargs kill) and try again.`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
