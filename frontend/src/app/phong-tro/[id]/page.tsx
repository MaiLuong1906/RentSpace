import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  ChevronRight,
  Wifi,
  Car,
  Wind,
  WashingMachine,
  PawPrint,
  Home,
  ArrowRight,
} from "lucide-react";
import { ListingJsonLd } from "@/components/seo/ListingJsonLd";
import type { Listing } from "@/types/listing.types";
import { slugify } from "@/lib/slug";

export const revalidate = 3600;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentspace.vn";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: "Không tìm thấy phòng trọ | RentSpace" };
  }

  const price = new Intl.NumberFormat("vi-VN").format(listing.pricePerMonth);
  const title = `${listing.title} - ${price}đ/tháng | RentSpace`;
  const description =
    listing.description?.slice(0, 160) ??
    `Cho thuê phòng trọ tại ${listing.address}, ${listing.district ?? ""}, ${listing.city}. Liên hệ chủ trọ ngay.`;
  const imageUrl = listing.images[0]?.imageUrl;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/phong-tro/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/phong-tro/${id}`,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 600, alt: listing.title }] : [],
    },
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

const AMENITY_ICONS = [
  { key: "hasWifi", icon: Wifi, label: "Wifi" },
  { key: "hasParking", icon: Car, label: "Bãi xe" },
  { key: "hasAirConditioner", icon: Wind, label: "Điều hòa" },
  { key: "hasWashingMachine", icon: WashingMachine, label: "Máy giặt" },
  { key: "allowPets", icon: PawPrint, label: "Nuôi thú cưng" },
] as const;

export default async function PublicListingPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return (
      <div className="min-h-[100dvh] bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <Home className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">
            Không tìm thấy phòng trọ
          </h1>
          <p className="text-gray-500 mb-6">
            Tin đăng này có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Link
            href="/app/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Tìm phòng khác
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const citySlug = slugify(listing.city);
  const districtSlug = listing.district ? slugify(listing.district) : null;
  const activeAmenities = AMENITY_ICONS.filter(
    (a) => listing[a.key as keyof Listing]
  );

  return (
    <>
      <ListingJsonLd listing={listing} />

      <div className="min-h-[100dvh] bg-[#FAFAFA]">
        {/* Breadcrumb */}
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  href={`/tim-phong-tro/${citySlug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {listing.city}
                </Link>
              </li>
              {listing.district && districtSlug && (
                <>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <Link
                      href={`/tim-phong-tro/${citySlug}/${districtSlug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {listing.district}
                    </Link>
                  </li>
                </>
              )}
              <li>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="text-gray-900 font-medium line-clamp-1 max-w-[180px]">
                {listing.title}
              </li>
            </ol>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái — ảnh + mô tả */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              {listing.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  <div className="col-span-2 relative h-64 md:h-80">
                    <Image
                      src={listing.images[0].imageUrl}
                      alt={listing.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                    />
                  </div>
                  {listing.images.slice(1, 3).map((img, i) => (
                    <div key={i} className="relative h-36 md:h-44">
                      <Image
                        src={img.imageUrl}
                        alt={`${listing.title} ảnh ${i + 2}`}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Home className="h-12 w-12 text-gray-300" />
                </div>
              )}

              {/* Tiêu đề + địa chỉ */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
                  {listing.title}
                </h1>
                <div className="flex items-start gap-2 text-gray-500">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{listing.address}</span>
                </div>
              </div>

              {/* Thông tin chính */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 border-y border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Giá thuê</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(listing.pricePerMonth)}
                    <span className="text-sm font-normal text-gray-500">
                      /tháng
                    </span>
                  </p>
                </div>
                {listing.areaM2 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Diện tích</p>
                    <p className="font-semibold text-gray-900">
                      {listing.areaM2} m²
                    </p>
                  </div>
                )}
                {listing.numBedrooms !== undefined && listing.numBedrooms > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phòng ngủ</p>
                    <p className="font-semibold text-gray-900">
                      {listing.numBedrooms} phòng
                    </p>
                  </div>
                )}
              </div>

              {/* Tiện ích */}
              {activeAmenities.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">
                    Tiện ích
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {activeAmenities.map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả */}
              {listing.description && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">
                    Mô tả
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>

            {/* Cột phải — CTA liên hệ */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(listing.pricePerMonth)}
                    <span className="text-base font-normal text-gray-500">
                      /tháng
                    </span>
                  </p>
                  {listing.areaM2 && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {listing.areaM2} m²
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p className="font-medium text-gray-700">
                    {listing.landlordName}
                  </p>
                  <p>Chủ nhà</p>
                </div>

                <Link
                  href={`/app/listings/${listing.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Xem đầy đủ và liên hệ
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="text-xs text-center text-gray-400">
                  Đăng nhập để nhắn tin trực tiếp với chủ trọ
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
