interface Props {
  city: string;
  citySlug: string;
  district?: string;
  districtSlug?: string;
  siteUrl?: string;
}

export function AreaBreadcrumbJsonLd({
  city,
  citySlug,
  district,
  districtSlug,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentspace.vn",
}: Props) {
  const items: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }> = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Trang chủ",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: `Thuê trọ ${city}`,
      item: `${siteUrl}/tim-phong-tro/${citySlug}`,
    },
  ];

  if (district && districtSlug) {
    items.push({
      "@type": "ListItem",
      position: 3,
      name: district,
      item: `${siteUrl}/tim-phong-tro/${citySlug}/${districtSlug}`,
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
