import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Home, ChevronRight } from "lucide-react";
import { cityLabel, districtLabel, DISTRICT_MAP } from "@/lib/slug";
import { AreaBreadcrumbJsonLd } from "@/components/seo/AreaBreadcrumbJsonLd";

export const revalidate = 3600;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentspace.vn";

interface PageProps {
  params: Promise<{ city: string; district: string }>;
}

interface SeoPageData {
  title?: string;
  metaDesc?: string;
  h1?: string;
}

interface Listing {
  id: number;
  title: string;
  pricePerMonth: number;
  address: string;
  district?: string;
  city: string;
  areaM2?: number;
  images: Array<{ imageUrl: string }>;
}

async function fetchSeoMetadata(path: string): Promise<SeoPageData | null> {
  try {
    const res = await fetch(
      `${API_URL}/seo/pages?path=${encodeURIComponent(path)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function fetchListingsByCityDistrict(
  cityName: string,
  districtName: string
): Promise<{ listings: Listing[]; total: number }> {
  try {
    const res = await fetch(
      `${API_URL}/listings?status=ACTIVE&city=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}&size=12&sort=createdAt,desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { listings: [], total: 0 };
    const json = await res.json();
    const page = json.data;
    return {
      listings: page?.content ?? [],
      total: page?.page?.totalElements ?? page?.totalElements ?? 0,
    };
  } catch {
    return { listings: [], total: 0 };
  }
}

// Pre-generate top districts từ map đã biết
export async function generateStaticParams() {
  return Object.entries(DISTRICT_MAP).map(([districtSlug, info]) => ({
    city: info.citySlug,
    district: districtSlug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city, district } = await params;
  const cityName = cityLabel(city);
  const districtName = districtLabel(district);
  const path = `/tim-phong-tro/${city}/${district}`;
  const seo = await fetchSeoMetadata(path);

  const title =
    seo?.title ??
    `Thuê phòng trọ ${districtName}, ${cityName} | RentSpace`;
  const description =
    seo?.metaDesc ??
    `Tìm phòng trọ giá rẻ tại ${districtName}, ${cityName}. Tin đăng uy tín, cập nhật hàng ngày tại RentSpace.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}${path}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}${path}`,
    },
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default async function DistrictPage({ params }: PageProps) {
  const { city, district } = await params;
  const cityName = cityLabel(city);
  const districtName = districtLabel(district);
  const path = `/tim-phong-tro/${city}/${district}`;

  const [seo, { listings, total }] = await Promise.all([
    fetchSeoMetadata(path),
    fetchListingsByCityDistrict(cityName, districtName),
  ]);

  const h1 = seo?.h1 ?? `Phòng trọ ${districtName}`;

  return (
    <>
      <AreaBreadcrumbJsonLd
        city={cityName}
        citySlug={city}
        district={districtName}
        districtSlug={district}
      />

      <div className="min-h-[100dvh] bg-[#FAFAFA]">
        {/* Breadcrumb */}
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-600 transition-colors"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  href={`/tim-phong-tro/${city}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  Thuê trọ {cityName}
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="text-gray-900 font-medium">{districtName}</li>
            </ol>
          </div>
        </nav>

        {/* Header */}
        <header className="bg-white border-b border-gray-100 py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wider">
                {districtName}, {cityName}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
              {h1}
            </h1>
            <p className="text-gray-500 text-base">
              {total > 0 ? (
                <>
                  <span className="font-semibold text-gray-700">{total}</span>{" "}
                  tin đăng tại {districtName}
                </>
              ) : (
                `Tìm phòng trọ tại ${districtName}, ${cityName}`
              )}
            </p>
          </div>
        </header>

        {/* Danh sách tin */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {listings.length === 0 ? (
            <div className="text-center py-20">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Chưa có tin đăng cho thuê tại {districtName}.
              </p>
              <Link
                href={`/tim-phong-tro/${city}`}
                className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline"
              >
                Xem tất cả tin tại {cityName}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/phong-tro/${listing.id}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 hover:shadow-[0_4px_16px_rgba(37,99,235,0.07)] transition-all"
                  >
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      {listing.images[0]?.imageUrl ? (
                        <Image
                          src={listing.images[0].imageUrl}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Home className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5 bg-white/95 rounded-lg px-2.5 py-1 text-sm font-semibold text-gray-900">
                        {formatPrice(listing.pricePerMonth)}
                        <span className="text-xs font-normal text-gray-500">
                          /th
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h2 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-1.5">
                        {listing.title}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {listing.district
                            ? `${listing.district}, ${listing.city}`
                            : listing.city}
                        </span>
                      </div>
                      {listing.areaM2 && (
                        <p className="mt-1.5 text-xs text-gray-400">
                          {listing.areaM2} m²
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {total > 12 && (
                <div className="mt-10 text-center">
                  <Link
                    href={`/app/search?city=${encodeURIComponent(cityName)}&district=${encodeURIComponent(districtName)}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Xem tất cả {total} tin tại {districtName}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
