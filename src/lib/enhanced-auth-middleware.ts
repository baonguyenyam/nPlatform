import type { UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth-middleware";

// Define route patterns and their required permissions
const PROTECTED_ROUTES = {
	// Admin routes
	"/admin": {
		roles: ["ADMIN"] as UserRole[],
		permissions: [] as string[],
		requireAll: false, // require any of the roles OR permissions
	},
	"/admin/users": {
		roles: ["ADMIN"] as UserRole[],
		permissions: ["MANAGE_USERS"] as string[],
		requireAll: false,
	},
	"/admin/orders": {
		roles: ["ADMIN", "MODERATOR"] as UserRole[],
		permissions: ["MANAGE_ORDERS"] as string[],
		requireAll: false,
	},
	"/admin/analytics": {
		roles: ["ADMIN"] as UserRole[],
		permissions: ["VIEW_ANALYTICS"] as string[],
		requireAll: false,
	},

	// Moderator routes
	"/moderator": {
		roles: ["ADMIN", "MODERATOR"] as UserRole[],
		permissions: [] as string[],
		requireAll: false,
	},

	// User dashboard
	"/dashboard": {
		roles: ["USER", "MODERATOR", "ADMIN"] as UserRole[],
		permissions: [] as string[],
		requireAll: false,
	},

	// API routes
	"/api/admin": {
		roles: ["ADMIN"] as UserRole[],
		permissions: [] as string[],
		requireAll: false,
	},
	"/api/orders": {
		roles: ["ADMIN", "MODERATOR"] as UserRole[],
		permissions: ["MANAGE_ORDERS"] as string[],
		requireAll: false,
	},
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
	"/",
	"/about",
	"/contact",
	"/authentication/login",
	"/authentication/register",
	"/authentication/forgot-password",
	"/authentication/verify-request",
	"/api/auth",
	"/api/public",
];

// Routes that require authentication but no specific permissions
const AUTH_REQUIRED_ROUTES = [
	"/profile",
	"/settings",
	"/orders/my",
];

interface AuthResult {
	authorized: boolean;
	redirectTo?: string;
	error?: string;
}

/**
 * Check if a path matches any of the given patterns
 */
function matchesPattern(path: string, patterns: string[]): boolean {
	return patterns.some(pattern => {
		if (pattern.endsWith('*')) {
			return path.startsWith(pattern.slice(0, -1));
		}
		return path === pattern || path.startsWith(pattern + '/');
	});
}

/**
 * Check if user has required permissions for a route
 */
function checkPermissions(
	user: any,
	requiredRoles: UserRole[],
	requiredPermissions: string[],
	requireAll: boolean = false
): boolean {
	if (!user) return false;

	const userRole = user.role as UserRole;
	const userPermissions = user.permissions || [];

	// Check roles
	const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.includes(userRole);

	// Check permissions
	const hasRequiredPermissions = requiredPermissions.length === 0 ||
		(requireAll
			? requiredPermissions.every(perm => userPermissions.includes(perm))
			: requiredPermissions.some(perm => userPermissions.includes(perm))
		);

	// If requireAll is false, user needs either role OR permissions
	// If requireAll is true, user needs role AND permissions
	if (requireAll) {
		return hasRequiredRole && hasRequiredPermissions;
	} else {
		return hasRequiredRole || hasRequiredPermissions;
	}
}

/**
 * Enhanced authorization middleware
 */
export async function withAuthorization(
	request: NextRequest,
	options: {
		fallback?: string;
		requireEmailVerification?: boolean;
	} = {}
): Promise<AuthResult> {
	try {
		const session = await auth();
		const { pathname } = request.nextUrl;

		// Check if route is public
		if (matchesPattern(pathname, PUBLIC_ROUTES)) {
			return { authorized: true };
		}

		// Check if user is authenticated
		if (!session?.user) {
			return {
				authorized: false,
				redirectTo: `/authentication/login?callbackUrl=${encodeURIComponent(pathname)}`,
				error: "Authentication required"
			};
		}

		const user = session.user;

		// Check email verification if required
		// Note: emailVerified is handled at the session level, not exposed in middleware user
		if (options.requireEmailVerification) {
			// This would need to be checked against the database in middleware context
			// For now, we'll skip this check in middleware and handle it at the page level
		}

		// Check if user account is active
		// Note: published status is not available in middleware user object
		// This should be checked at the API/page level where database access is available

		// Check routes that only require authentication
		if (matchesPattern(pathname, AUTH_REQUIRED_ROUTES)) {
			return { authorized: true };
		}

		// Check protected routes with specific permissions
		for (const [routePattern, requirements] of Object.entries(PROTECTED_ROUTES)) {
			if (matchesPattern(pathname, [routePattern])) {
				const hasPermission = checkPermissions(
					user,
					requirements.roles,
					requirements.permissions,
					requirements.requireAll
				);

				if (!hasPermission) {
					return {
						authorized: false,
						redirectTo: options.fallback || "/unauthorized",
						error: "Insufficient permissions"
					};
				}

				return { authorized: true };
			}
		}

		// Default: allow access if not in protected routes
		return { authorized: true };

	} catch (error) {
		console.error("Authorization middleware error:", error);
		return {
			authorized: false,
			redirectTo: "/authentication/login",
			error: "Authentication error"
		};
	}
}

/**
 * HOC for API routes with authorization
 */
export function withApiAuthorization(options: {
	roles?: UserRole[];
	permissions?: string[];
	requireAll?: boolean;
	requireEmailVerification?: boolean;
} = {}) {
	return (handler: (req: NextRequest, context: any) => Promise<NextResponse>) =>
		async (req: NextRequest, context: any): Promise<NextResponse> => {
			try {
				const session = await auth();

				if (!session?.user) {
					return NextResponse.json(
						{
							success: false,
							message: "Authentication required",
							code: "UNAUTHORIZED",
						},
						{ status: 401 }
					);
				}

				const user = session.user;

				// Check email verification
				// Note: emailVerified is handled at the session/database level
				if (options.requireEmailVerification) {
					// This check should be done at the page/API level with database access
					// Middleware doesn't have access to full user data
				}

				// Check account status
				// Note: published status is not available in middleware user object
				// This should be checked at the API/page level where database access is available

				// Check permissions if specified
				if (options.roles || options.permissions) {
					const hasPermission = checkPermissions(
						user,
						options.roles || [],
						options.permissions || [],
						options.requireAll
					);

					if (!hasPermission) {
						return NextResponse.json(
							{
								success: false,
								message: "Insufficient permissions",
								code: "INSUFFICIENT_PERMISSIONS",
								required: {
									roles: options.roles,
									permissions: options.permissions,
								},
							},
							{ status: 403 }
						);
					}
				}

				// Add user context to request
				(req as any).userContext = user;

				return handler(req, context);
			} catch (error) {
				console.error("API authorization error:", error);
				return NextResponse.json(
					{
						success: false,
						message: "Internal server error",
						code: "INTERNAL_ERROR",
					},
					{ status: 500 }
				);
			}
		};
}

/**
 * Utility to check permissions in components/pages
 */
export function hasPermission(
	user: any,
	roles: UserRole[] = [],
	permissions: string[] = [],
	requireAll: boolean = false
): boolean {
	return checkPermissions(user, roles, permissions, requireAll);
}

/**
 * Create a permission checker for specific route patterns
 */
export function createPermissionChecker(routePattern: string) {
	const requirements = PROTECTED_ROUTES[routePattern as keyof typeof PROTECTED_ROUTES];

	if (!requirements) {
		return (user: any) => true; // Allow access if no requirements defined
	}

	return (user: any) => checkPermissions(
		user,
		requirements.roles,
		requirements.permissions,
		requirements.requireAll
	);
}