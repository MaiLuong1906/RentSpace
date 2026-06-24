import type { MetadataRoute } from "next";
import { slugify } from "@/lib/slug";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentspace.vn";

interface ListingEntry {
  id: number;
  updatedAt: string;
}

interface ListingApiResponse {
  data?: {
    content?: ListingEntry[];
    totalElements?: number;
  };
}

interface AreaEntry {
  city: string;
  district: string;
}

async function fetchListingsForSitemap(): Promise<ListingEntry[]> {
  try {
    const res = await fetch(
      `${API_URL}/listings?status=ACTIVE&size=5000&sort=updatedAt,desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json: ListingApiResponse = await res.json();
    return json.data?.content ?? [];
  } catch {
    return [];
  }
}

async function fetchAreaUrls(): Promise<AreaEntry[]> {
  try {
    const res = await fetch(
      `${API_URL}/listings?status=ACTIVE&size=5000`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json: ListingApiResponse = await res.json();
    const listings = json.data?.content ?? [];

    // Lấy các cặp (city, district) phân biệt
    const seen = new Set<string>();
    const areas: AreaEntry[] = [];
    for (const l of listings as Array<{ city?: string; district?: string }>) {
      if (!l.city || !l.district) continue;
      const key = `${l.city}|${l.district}`;
      if (!seen.has(key)) {
        seen.add(key);
        areas.push({ city: l.city, district: l.district });
      }
    }
    return areas;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, areas] = await Promise.all([
    fetchListingsForSitemap(),
    fetchAreaUrls(),
  ]);

  // Trang chủ
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Trang city + district — lấy distinct từ listing thực tế
  const seenAreaUrls = new Set<string>();
  const areaEntries: MetadataRoute.Sitemap = [];

  for (const area of areas) {
    const citySlug = slugify(area.city);
    const districtSlug = slugify(area.district);

    const cityUrl = `${SITE_URL}/tim-phong-tro/${citySlug}`;
    if (!seenAreaUrls.has(cityUrl)) {
      seenAreaUrls.add(cityUrl);
      areaEntries.push({
        url: cityUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    const districtUrl = `${SITE_URL}/tim-phong-tro/${citySlug}/${districtSlug}`;
    if (!seenAreaUrls.has(districtUrl)) {
      seenAreaUrls.add(districtUrl);
      areaEntries.push({
        url: districtUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Từng tin đăng ACTIVE
  const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${SITE_URL}/phong-tro/${l.id}`,
    lastModified: new Date(l.updatedAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticEntries, ...areaEntries, ...listingEntries];
}
