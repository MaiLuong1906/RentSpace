import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // TODO: Fetch listing data for dynamic metadata
  return {
    title: `Chi tiết phòng #${params.id} | RentSpace`,
    description: "Xem chi tiết phòng trọ, ảnh thực tế và đánh giá từ người đã ở.",
  };
}

export default function ListingDetailPage({ params }: Props) {
  return (
    <main>
      <h1>Chi tiết phòng #{params.id}</h1>
      {/* TODO: Implement ListingDetail, ImageGallery, ReviewSection */}
    </main>
  );
}
