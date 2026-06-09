import { Metadata } from "next";
import { ListingDetailClient } from "./ListingDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

// 🌐 Dynamic SEO Metadata generation on Server side
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

  try {
    const res = await fetch(`${apiUrl}/listings/${id}`, {
      next: { revalidate: 60 }, // Cache response for 1 minute
    });
    
    if (!res.ok) {
      return {
        title: "Không tìm thấy phòng trọ | RentSpace",
      };
    }

    const apiResponse = await res.json();
    const listing = apiResponse?.data;

    if (!listing) {
      return {
        title: "Không tìm thấy phòng trọ | RentSpace",
      };
    }

    const title = `${listing.title} - ${new Intl.NumberFormat("vi-VN").format(listing.pricePerMonth)}đ/tháng`;
    const description = listing.description 
      ? listing.description.slice(0, 160) + (listing.description.length > 160 ? "..." : "")
      : `Cho thuê phòng trọ diện tích ${listing.area}m² tại ${listing.address}, ${listing.district}, ${listing.city}. Liên hệ chủ trọ ngay.`;
    
    const imageUrl = listing.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: listing.title,
          },
        ],
        type: "website",
      },
    };
  } catch (error) {
    console.error("Lỗi khi tạo SEO Metadata:", error);
    return {
      title: "Chi tiết phòng trọ | RentSpace",
    };
  }
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ListingDetailClient listingId={id} />;
}
