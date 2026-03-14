import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ApifyClient } from "apify-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "..", "cache");
const APIFY_ACTOR_PROFILE = "harvestapi/linkedin-profile-scraper";
/** Bump this when API or profile shape changes so old cache is ignored. */
const CACHE_VERSION = 4;


const app = express();
app.use(cors());
app.use(express.json());

function slugFromCacheKey(query) {
  const s = String(query)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
  return s.length ? s : "profile";
}

/** Returns { slug, profileUrl } for a LinkedIn profile URL or username, or null. */
function parseProfileInput(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  try {
    const u = new URL(raw);
    if (u.hostname.includes("linkedin.com") && u.pathname.startsWith("/in/")) {
      const slug = u.pathname.replace(/^\/in\/?/, "").replace(/\/$/, "").trim();
      const profileUrl = `https://www.linkedin.com/in/${slug}`;
      return { slug: slug || "profile", profileUrl };
    }
  } catch (_) {}

  if (/^[\w-]+$/.test(raw) && raw.length <= 100) {
    return { slug: raw, profileUrl: `https://www.linkedin.com/in/${raw}` };
  }
  return null;
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function getCached(slug) {
  const filePath = path.join(CACHE_DIR, `${slug}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed._cacheVersion !== CACHE_VERSION) return null;
    const { _cacheVersion, ...profile } = parsed;
    return profile;
  } catch {
    return null;
  }
}

async function setCached(slug, profile) {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${slug}.json`);
  await fs.writeFile(
    filePath,
    JSON.stringify({ ...profile, _cacheVersion: CACHE_VERSION }, null, 2),
    "utf-8",
  );
}

/** Safe date string from HarvestAPI { text?, month?, year? }. */
function toDateStr(d) {
  if (!d || typeof d !== "object") return null;
  if (typeof d.text === "string" && d.text.trim()) return d.text.trim();
  const year = d.year != null ? String(d.year) : null;
  const month = d.month != null ? (typeof d.month === "string" ? d.month : String(d.month)) : null;
  if (year && month) return `${month} ${year}`;
  return year;
}

/** Map HarvestAPI profile-scraper item to our profile shape. */
function mapHarvestToProfile(item) {
  if (!item || typeof item !== "object") return null;
  const exp = item.experience || [];
  const edu = item.education || [];
  const currentPos = item.currentPosition?.[0];
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ") || null;
  return {
    name,
    avatar: item.profilePicture?.url ?? item.photo ?? null,
    position: item.headline ?? currentPos?.companyName ?? null,
    current_company: currentPos?.companyName ?? null,
    current_company_name: currentPos?.companyName ?? null,
    about: item.about ?? null,
    city: item.location?.linkedinText ?? item.location?.parsed?.text ?? null,
    country_code: item.location?.countryCode ?? item.location?.parsed?.country ?? null,
    connections: item.connectionsCount ?? null,
    followers: item.followerCount ?? null,
    url: item.linkedinUrl ?? null,
    education: edu.map((e) => {
      const start = toDateStr(e.startDate);
      const end = toDateStr(e.endDate);
      const dates = e.period ?? (start && end ? `${start} – ${end}` : start || end || null);
      return {
        school: e.schoolName ?? null,
        degree: e.degree ?? null,
        field_of_study: e.fieldOfStudy ?? null,
        dates: dates || null,
      };
    }),
    experiences: exp.map((e) => {
      const start = toDateStr(e.startDate);
      const end = toDateStr(e.endDate);
      const dates = [start, end].filter(Boolean).join(" – ") || null;
      return {
        title: e.position ?? null,
        company: e.companyName ?? null,
        dates,
        description: e.description ?? null,
      };
    }),
  };
}

async function apifyProfileByUrl(profileUrl) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const client = new ApifyClient({ token });
  const input = {
    profileScraperMode: "Profile details no email ($4 per 1k)",
    queries: [profileUrl],
  };
  const run = await client.actor(APIFY_ACTOR_PROFILE).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const item = items?.[0];
  if (!item) throw new Error("Profile not found or failed to scrape");
  const profile = mapHarvestToProfile(item);
  if (!profile) throw new Error("Failed to map profile");
  return profile;
}

app.post("/api/scrape", async (req, res) => {
  const input = req.body?.searchQuery ?? req.body?.url;
  const parsed = parseProfileInput(input);
  if (!parsed) {
    return res
      .status(400)
      .json({ error: "Provide a LinkedIn profile URL or username (e.g. linkedin.com/in/username or username)" });
  }

  const slug = slugFromCacheKey(parsed.slug);
  try {
    let profile = await getCached(slug);
    if (!profile) {
      profile = await apifyProfileByUrl(parsed.profileUrl);
      await setCached(slug, profile);
    }
    res.json(profile);
  } catch (err) {
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
    console.error(`Port ${PORT} is in use. Run: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  }
  throw err;
});
