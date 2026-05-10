import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | RentSpace",
    default: "RentSpace — Tìm phòng trọ an toàn, minh bạch",
  },
  description:
    "RentSpace là nền tảng tìm phòng trọ và mạng xã hội kết nối người thuê với chủ trọ. Thông tin xác thực, đánh giá thực tế, đặt phòng an toàn.",
  keywords: ["phòng trọ", "thuê phòng", "đà nẵng", "chung cư mini", "ở ghép"],
  openGraph: {
    title: "RentSpace — Tìm phòng trọ an toàn",
    description: "Nền tảng tìm phòng trọ với danh tính xác thực và đánh giá thực tế",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
