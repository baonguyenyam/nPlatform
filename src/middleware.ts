import { NextResponse } from "next/server";

import { auth } from "@/auth-middleware";
import {
	checkAdminRoutePermission,
	getUnauthorizedRedirectUrl,
} from "@/lib/admin-route-protection-middleware";
import { secureSearchString } from "@/lib/middleware-utils";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limiter";
import {
	apiAuthPrefix,
	authRoutes,
	DEFAULT_LOGIN_REDIRECT,
	pathAuthPrefix,
	publicApp,
	publicRoutes,
} from "@/routes";

export default auth(async (req) => {
	const response = NextResponse.next();

	// Rate limiting for API routes
	if (req.nextUrl.pathname.startsWith("/api/")) {
		const identifier =
			req.headers.get("x-forwarded-for") ||
			req.headers.get("x-real-ip") ||
			"anonymous";
		const isAuthenticated = !!req.auth;
		const userRole = req.auth?.user?.role;

		let rateLimitRole: "PUBLIC" | "AUTHENTICATED" | "ADMIN" = "PUBLIC";
		if (isAuthenticated) {
			rateLimitRole = userRole === "ADMIN" ? "ADMIN" : "AUTHENTICATED";
		}

		const rateLimitResult = checkRateLimit(identifier, rateLimitRole);

		// Add rate limit headers
		const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
		Object.entries(rateLimitHeaders).forEach(([key, value]) => {
			response.headers.set(key, value);
		});

		// If rate limit exceeded, return 429
		if (!rateLimitResult.success) {
			return new NextResponse(
				JSON.stringify({
					success: false,
					message: "Too many requests",
					error: "Rate limit exceeded",
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						...rateLimitHeaders,
					},
				},
			);
		}
	}

	// Query params
	const searchParams = req.nextUrl.searchParams;
	const search = secureSearchString(searchParams?.get("s")) || "";
	const orderBy = secureSearchString(searchParams?.get("orderBy")) || "";
	const filterBy = secureSearchString(searchParams?.get("filterBy")) || "";
	const byCat = secureSearchString(searchParams?.get("cat")) || "";
	const callbackUrl =
		secureSearchString(searchParams?.get("callbackUrl")) || "";
	const error = secureSearchString(searchParams?.get("error")) || "";

	// Set headers
	response?.headers?.set("x-search", search ?? "");
	response?.headers?.set("x-orderBy", orderBy ?? "");
	response?.headers?.set("x-filterBy", filterBy ?? "");
	response?.headers?.set("x-cat", byCat ?? "");
	response?.headers?.set("x-callbackUrl", callbackUrl ?? "");
	response?.headers?.set("x-error", error ?? "");

	// Add performance headers
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

	const { nextUrl } = req;
	const isLoggedIn = !!req.auth;

	// Basic admin authentication check
	if (
		nextUrl.pathname.startsWith("/admin") &&
		nextUrl.pathname !== "/admin" &&
		nextUrl.pathname !== "/admin/deny"
	) {
		const userRole = req.auth?.user?.role;
		const isAllowed = userRole === "ADMIN" || userRole === "MODERATOR";

		if (!isAllowed) {
			return NextResponse.redirect(new URL("/admin/deny", nextUrl));
		}
	}

	// Publix publicRoute
	const publicApps = publicApp.includes(nextUrl.pathname);
	const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
	const isAdminAuthRoute = nextUrl.pathname.startsWith(pathAuthPrefix);
	const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
	const isAuthRoute = authRoutes.includes(nextUrl.pathname);

	if (nextUrl.pathname.startsWith("/admin")) {
		response.headers.set("x-isadmin", "true");
	}

	if (isApiAuthRoute) {
		return response;
	}

	// Admin routes are already handled above with permission checking
	if (isAdminAuthRoute && !nextUrl.pathname.startsWith("/admin")) {
		if (!isLoggedIn) {
			return NextResponse.redirect(new URL(`/authentication/login`, nextUrl));
		}
		return response;
	}

	if (isAuthRoute) {
		if (isLoggedIn) {
			return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
		}
		return response;
	}

	if (!isLoggedIn && !publicApps) {
		// Check if the route is public
		if (publicRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
			// If the route is public, allow access
			return response;
		}
	}

	if (!isLoggedIn && !isPublicRoute) {
		let callbackUrl = nextUrl.pathname;
		if (nextUrl.search) {
			callbackUrl += nextUrl.search;
		}

		const encodedCallbackUrl = encodeURIComponent(callbackUrl);
		return NextResponse.redirect(
			new URL(
				`/authentication/login?callbackUrl=${encodedCallbackUrl}`,
				nextUrl,
			),
		);
	}

	return response;
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
