// Chuyển tên tiếng Việt sang URL slug
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// Slug → tên hiển thị cho 3 thành phố chính
export const CITY_MAP: Record<string, string> = {
  "da-nang": "Đà Nẵng",
  "ha-noi": "Hà Nội",
  "ho-chi-minh": "Hồ Chí Minh",
};

// Slug → { tên hiển thị, thuộc thành phố nào }
export const DISTRICT_MAP: Record<string, { name: string; citySlug: string }> =
  {
    // Đà Nẵng
    "hai-chau": { name: "Hải Châu", citySlug: "da-nang" },
    "lien-chieu": { name: "Liên Chiểu", citySlug: "da-nang" },
    "ngu-hanh-son": { name: "Ngũ Hành Sơn", citySlug: "da-nang" },
    "son-tra": { name: "Sơn Trà", citySlug: "da-nang" },
    "thanh-khe": { name: "Thanh Khê", citySlug: "da-nang" },
    "cam-le": { name: "Cẩm Lệ", citySlug: "da-nang" },
    "hoa-vang": { name: "Hòa Vang", citySlug: "da-nang" },
    // Hà Nội
    "cau-giay": { name: "Cầu Giấy", citySlug: "ha-noi" },
    "dong-da": { name: "Đống Đa", citySlug: "ha-noi" },
    "hai-ba-trung": { name: "Hai Bà Trưng", citySlug: "ha-noi" },
    "hoan-kiem": { name: "Hoàn Kiếm", citySlug: "ha-noi" },
    "ba-dinh": { name: "Ba Đình", citySlug: "ha-noi" },
    "thanh-xuan": { name: "Thanh Xuân", citySlug: "ha-noi" },
    "tay-ho": { name: "Tây Hồ", citySlug: "ha-noi" },
    "long-bien": { name: "Long Biên", citySlug: "ha-noi" },
    "hoang-mai": { name: "Hoàng Mai", citySlug: "ha-noi" },
    "ha-dong": { name: "Hà Đông", citySlug: "ha-noi" },
    // Hồ Chí Minh
    "quan-1": { name: "Quận 1", citySlug: "ho-chi-minh" },
    "quan-3": { name: "Quận 3", citySlug: "ho-chi-minh" },
    "quan-4": { name: "Quận 4", citySlug: "ho-chi-minh" },
    "quan-5": { name: "Quận 5", citySlug: "ho-chi-minh" },
    "quan-7": { name: "Quận 7", citySlug: "ho-chi-minh" },
    "binh-thanh": { name: "Bình Thạnh", citySlug: "ho-chi-minh" },
    "phu-nhuan": { name: "Phú Nhuận", citySlug: "ho-chi-minh" },
    "tan-binh": { name: "Tân Bình", citySlug: "ho-chi-minh" },
    "go-vap": { name: "Gò Vấp", citySlug: "ho-chi-minh" },
    "thu-duc": { name: "Thủ Đức", citySlug: "ho-chi-minh" },
    "binh-duong": { name: "Bình Dương", citySlug: "ho-chi-minh" },
  };

export function cityLabel(slug: string): string {
  return CITY_MAP[slug] ?? slug;
}

export function districtLabel(districtSlug: string): string {
  return DISTRICT_MAP[districtSlug]?.name ?? districtSlug;
}
