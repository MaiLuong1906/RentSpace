import type { Listing } from "@/types/listing.types";

interface Props {
  listing: Listing;
  siteUrl?: string;
}

export function ListingJsonLd({
  listing,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentspace.vn",
}: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description ?? undefined,
    url: `${siteUrl}/phong-tro/${listing.id}`,
    image: listing.images[0]?.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      price: listing.pricePerMonth,
      priceCurrency: "VND",
      availability:
        listing.status === "ACTIVE"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.district ?? undefined,
      addressRegion: listing.city,
      addressCountry: "VN",
    },
    floorSize: listing.areaM2
      ? {
          "@type": "QuantitativeValue",
          value: listing.areaM2,
          unitCode: "MTK",
        }
      : undefined,
    numberOfRooms: listing.numBedrooms ?? undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
