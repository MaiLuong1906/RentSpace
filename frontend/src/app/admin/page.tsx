import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | RentSpace",
};

export default function AdminPage() {
  return (
    <main>
      <h1>Admin Panel</h1>
      {/* TODO: Implement KYC review, listing moderation */}
    </main>
  );
}
