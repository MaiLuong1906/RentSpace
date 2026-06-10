import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "change_me_to_a_strong_secret",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          const data = await response.json();

          if (data.success) {
            const { user, accessToken, refreshToken } = data.data;
            return {
              ...user,
              accessToken,
              refreshToken,
            };
          }
          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account }: any) {
      if (account?.provider === "google") {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/auth/google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              googleId: user.id,
              email: user.email,
              fullName: user.name,
              avatarUrl: user.image,
            }),
          });

          const data = await response.json();

          if (data.success) {
            // Lưu JWT và thông tin user từ Backend vào đối tượng user của NextAuth
            user.id = data.data.user.id;
            user.role = data.data.user.role;
            user.fullName = data.data.user.fullName;
            user.accessToken = data.data.accessToken;
            user.refreshToken = data.data.refreshToken;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Exchange Google token error:", error);
          return false;
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user?: any }) {
      // 1. Lần đầu đăng nhập: Lưu thông tin và thời gian hết hạn của accessToken vào token object
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullName = user.fullName;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        
        try {
          const payload = JSON.parse(Buffer.from(user.accessToken.split(".")[1], "base64").toString());
          token.accessTokenExpires = payload.exp * 1000; // Đổi giây sang mili-giây
        } catch {
          // Fallback: 15 phút từ thời điểm hiện tại nếu giải mã lỗi
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000;
        }
        return token;
      }

      // 2. Những lần gọi sau: Nếu Access Token vẫn còn hạn (buffer 1 phút), trả về token cũ
      if (Date.now() < token.accessTokenExpires - 60 * 1000) {
        return token;
      }

      // 3. Nếu Access Token đã hoặc sắp hết hạn: Thực hiện làm mới ngầm (Silent Refresh)
      try {
        console.log("Access Token sắp/đã hết hạn. Đang tiến hành làm mới token ngầm...");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: token.refreshToken,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          console.log("Làm mới Access Token ngầm thành công!");
          const { accessToken, refreshToken } = data.data;
          
          let expiresTime = Date.now() + 15 * 60 * 1000;
          try {
            const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString());
            expiresTime = payload.exp * 1000;
          } catch {}

          return {
            ...token,
            accessToken,
            refreshToken,
            accessTokenExpires: expiresTime,
          };
        } else {
          console.warn("Làm mới token thất bại từ backend:", data.message);
          return {
            ...token,
            error: "RefreshAccessTokenError", // Gắn cờ lỗi để client biết cần đăng xuất
          };
        }
      } catch (error) {
        console.error("Lỗi khi kết nối làm mới token:", error);
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.fullName = token.fullName;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.error = token.error; // Truyền cờ lỗi xuống client
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
