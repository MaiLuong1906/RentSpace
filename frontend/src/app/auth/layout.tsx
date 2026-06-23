export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
