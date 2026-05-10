import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin routes — chỉ ADMIN
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Dashboard routes — chỉ LANDLORD và ADMIN
    if (
      pathname.startsWith("/dashboard") &&
      token?.role !== "LANDLORD" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Các routes cần đăng nhập
        const protectedRoutes = ["/dashboard", "/admin", "/chat", "/profile"];
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/chat/:path*", "/profile/:path*"],
};
