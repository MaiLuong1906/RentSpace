// Main route group layout — có Navbar và Footer
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* TODO: <Navbar /> */}
      <main>{children}</main>
      {/* TODO: <Footer /> */}
    </div>
  );
}
