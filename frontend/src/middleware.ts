import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const token = req.auth; // Trong v5, req.auth chứa session token
  const pathname = req.nextUrl.pathname;

  // Nếu truy cập route được bảo vệ mà chưa đăng nhập
  const protectedRoutes = ["/dashboard", "/admin", "/chat", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Phân quyền Role: Admin routes — chỉ ADMIN
  if (pathname.startsWith("/admin") && token?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Phân quyền Role: Dashboard routes — chỉ LANDLORD và ADMIN
  if (
    pathname.startsWith("/dashboard") &&
    token?.user?.role !== "LANDLORD" &&
    token?.user?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
