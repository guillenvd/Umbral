import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_ROLE, isAppRole, isRoleAllowed } from "@/lib/auth/roles";

const PUBLIC_ROUTES = ["/login", "/unauthorized"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<(typeof response.cookies)["set"]>[2];
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  if (user && !isPublic) {
    const metadataRole = user.user_metadata?.role;
    const role = typeof metadataRole === "string" && isAppRole(metadataRole) ? metadataRole : DEFAULT_ROLE;

    if (!isRoleAllowed(pathname, role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
