import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ApifyClient } from "apify-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "..", "cache");
const APIFY_ACTOR = "dev_fusion/linkedin-profile-scraper";

const app = express();
app.use(cors());
app.use(express.json());

function slugFromLinkedInUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("linkedin.com") || !u.pathname.startsWith("/in/"))
      return null;
    const slug = u.pathname.replace(/^\/in\/?/, "").replace(/\/$/, "") || null;
    return slug && slug.length > 0 ? slug.replace(/[^a-z0-9_-]/gi, "_") : null;
  } catch {
    return null;
  }
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function getCached(slug) {
  const filePath = path.join(CACHE_DIR, `${slug}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function setCached(slug, profile) {
  await ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${slug}.json`);
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");
}

/** Map Apify actor output to our profile shape for the frontend. */
function mapApifyToProfile(item) {
  if (!item || typeof item !== "object") return null;
  const experiences = item.experiences || [];
  const educations = item.educations || [];
  const currentJob =
    experiences.find((e) => e.jobStillWorking) || experiences[0];
  const formatDateRange = (start, end, stillWorking) => {
    const endStr = stillWorking ? "Present" : end || "—";
    return start ? `${start} – ${endStr}` : end ? `– ${end}` : null;
  };
  return {
    name:
      item.fullName ??
      ([item.firstName, item.lastName].filter(Boolean).join(" ") || null),
    avatar:
      item.profilePic ??
      item.profilePicHighQuality ??
      item.profilePictureUrl ??
      item.profilePicture ??
      item.profileImageUrl ??
      item.avatar ??
      null,
    position: item.headline ?? currentJob?.title ?? null,
    current_company: currentJob?.companyName ?? null,
    current_company_name: currentJob?.companyName ?? null,
    about: item.about ?? item.summary ?? null,
    city:
      item.addressWithCountry ??
      item.addressWithoutCountry ??
      item.location ??
      item.city ??
      null,
    country_code: item.countryCode ?? item.addressCountryOnly ?? null,
    connections: item.connections ?? null,
    followers: item.followers ?? null,
    url: item.linkedinUrl ?? item.linkedinPublicUrl ?? null,
    education: educations.map((e) => {
      const period = e.period || {};
      const start = period.startedOn ?? e.startedOn;
      const end = period.endedOn ?? e.endedOn;
      const ongoing = period.endedOn == null && e.stillStudying !== false;
      return {
        school: e.title ?? e.schoolName ?? e.school ?? e.institution,
        degree: e.subtitle ?? e.degree ?? e.degreeName,
        field_of_study: e.fieldOfStudy ?? e.field,
        dates: formatDateRange(start, end, ongoing),
      };
    }),
    experiences: experiences.map((e) => ({
      title: e.title,
      company: e.companyName ?? null,
      dates: formatDateRange(e.jobStartedOn, e.jobEndedOn, e.jobStillWorking),
    })),
  };
}

async function apifyScrape(url) {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN is not set");

  const client = new ApifyClient({ token });
  const input = { profileUrls: [url] };
  const run = await client.actor(APIFY_ACTOR).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const item = items?.[0];
  if (!item) throw new Error("Apify returned no profile data");
  if (item.succeeded === false)
    throw new Error(item.error || "Apify actor reported failure");
  const profile = mapApifyToProfile(item);
  if (!profile) throw new Error("Failed to map Apify output to profile");
  return profile;
}

app.post("/api/scrape", async (req, res) => {
  const url = req.body?.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url" });
  }

  const slug = slugFromLinkedInUrl(url);
  if (!slug) {
    return res.status(400).json({ error: "Invalid LinkedIn profile URL" });
  }

  try {
    let profile = await getCached(slug);
    if (!profile) {
      profile = await apifyScrape(url);
      await setCached(slug, profile);
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Scrape failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
