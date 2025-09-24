import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

/**
 * Basic Authorization Middleware
 * Simple middleware for basic authentication checks
 */

interface AuthorizationOptions {
	requireAdmin?: boolean;
	requireModerator?: boolean;
	customCheck?: (user: any, req: NextRequest) => boolean;
}

/**
 * Main authorization middleware
 */
export async function withAuthorization(
	req: NextRequest,
	options: AuthorizationOptions = {},
): Promise<{ authorized: boolean; user?: any; error?: string }> {
	try {
		// Get session from auth
		const session = await auth();

		if (!session?.user) {
			return { authorized: false, error: "Not authenticated" };
		}

		const { user } = session;

		// If no options, just need authentication
		if (!options.requireAdmin && !options.requireModerator && !options.customCheck) {
			return { authorized: true, user };
		}

		// Check admin requirement
		if (options.requireAdmin && user.role !== "ADMIN") {
			return { authorized: false, error: "Admin access required" };
		}

		// Check moderator requirement
		if (options.requireModerator && !["ADMIN", "MODERATOR"].includes(user.role as string)) {
			return { authorized: false, error: "Moderator access required" };
		}

		// Check custom condition
		if (options.customCheck) {
			const customResult = options.customCheck(user, req);
			if (!customResult) {
				return { authorized: false, error: "Custom authorization failed" };
			}
		}

		return { authorized: true, user };
	} catch (error) {
		console.error("Authorization middleware error:", error);
		return { authorized: false, error: "Authorization error" };
	}
}

/**
 * HOC for API routes with authorization
 */
export function withApiAuthorization(options: AuthorizationOptions = {}) {
	return (handler: (req: NextRequest, context: any) => Promise<NextResponse>) =>
		async (req: NextRequest, context: any): Promise<NextResponse> => {
			const authResult = await withAuthorization(req, options);

			if (!authResult.authorized) {
				return NextResponse.json(
					{
						success: false,
						message: authResult.error || "Unauthorized",
						code: "AUTHORIZATION_FAILED",
					},
					{ status: authResult.error === "Not authenticated" ? 401 : 403 },
				);
			}

			// Add user to request
			(req as any).user = authResult.user;

			return handler(req, context);
		};
}

/**
 * Admin only middleware
 */
export const requireAdmin = () =>
	withApiAuthorization({
		requireAdmin: true,
	});

/**
 * Moderator or Admin middleware
 */
export const requireModerator = () =>
	withApiAuthorization({
		requireModerator: true,
	});
