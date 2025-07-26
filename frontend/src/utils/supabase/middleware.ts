import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const nonAuthPath = ["/login", "/register", "/email-verify"];
const protectedRoutes = ["/profile"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname  = request.nextUrl.pathname;

  // allow non-authenticated users to access auth pages (login, register, etc.)
  if (!user && nonAuthPath.some((e) => pathname.startsWith(e)))
    return response;

  // redirect authenticated users away from auth pages to dashboard
  if (user && nonAuthPath.some((e) => pathname.startsWith(e)))
    return NextResponse.redirect(new URL("/", request.url));

  // redirect authenticated users from landing page to dashboard
  // if (user && pathname === "/") {
  //   return NextResponse.redirect(new URL("/dashboard", request.url));
  // }

  // redirect non-auth users from protected route to login
  if ( !user && protectedRoutes.some((e) => pathname.startsWith(e))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
