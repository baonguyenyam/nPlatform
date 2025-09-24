import type { UserRole } from "@prisma/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Server-side auth utilities
 */

// JWT secret for custom tokens
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback-secret");

/**
 * Get current user server-side (can be used in server components, API routes)
 */
export const getCurrentUser = async () => {
	try {
		const session = await auth();
		return session?.user || null;
	} catch (error) {
		console.error("Error getting current user:", error);
		return null;
	}
};

/**
 * Get current user with full database data
 */
export const getCurrentUserWithData = async () => {
	try {
		const session = await auth();
		if (!session?.user?.email) return null;

		const user = await db.user.findUnique({
			where: { email: session.user.email },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				permissions: true,
				avatar: true,
				emailVerified: true,
				isTwoFactorEnabled: true,
				published: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) return null;

		// Parse permissions if it's a string
		let permissions: string[] = [];
		if (user.permissions) {
			try {
				permissions = typeof user.permissions === 'string'
					? JSON.parse(user.permissions)
					: user.permissions;
			} catch (error) {
				console.warn("Failed to parse user permissions:", error);
				permissions = [];
			}
		}

		return {
			...user,
			permissions,
		};
	} catch (error) {
		console.error("Error getting current user with data:", error);
		return null;
	}
};

/**
 * Check if user has specific role
 */
export const hasRole = async (role: UserRole): Promise<boolean> => {
	const user = await getCurrentUser();
	return user?.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = async (roles: UserRole[]): Promise<boolean> => {
	const user = await getCurrentUser();
	return user ? roles.includes(user.role) : false;
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (permission: string): Promise<boolean> => {
	const user = await getCurrentUserWithData();
	return user ? user.permissions.includes(permission) : false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = async (permissions: string[]): Promise<boolean> => {
	const user = await getCurrentUserWithData();
	return user ? permissions.some(permission => user.permissions.includes(permission)) : false;
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = async (permissions: string[]): Promise<boolean> => {
	const user = await getCurrentUserWithData();
	return user ? permissions.every(permission => user.permissions.includes(permission)) : false;
};

/**
 * Check if user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
	return hasRole("ADMIN");
};

/**
 * Check if user is moderator or admin
 */
export const isModerator = async (): Promise<boolean> => {
	return hasAnyRole(["ADMIN", "MODERATOR"]);
};

/**
 * Require authentication (throws error if not authenticated)
 */
export const requireAuth = async () => {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
};

/**
 * Require specific role (throws error if user doesn't have role)
 */
export const requireRole = async (role: UserRole) => {
	const user = await requireAuth();
	if (user.role !== role) {
		throw new Error(`Required role: ${role}`);
	}
	return user;
};

/**
 * Require any of the specified roles
 */
export const requireAnyRole = async (roles: UserRole[]) => {
	const user = await requireAuth();
	if (!roles.includes(user.role)) {
		throw new Error(`Required one of roles: ${roles.join(", ")}`);
	}
	return user;
};

/**
 * Require specific permission
 */
export const requirePermission = async (permission: string) => {
	const user = await getCurrentUserWithData();
	if (!user) {
		throw new Error("Authentication required");
	}
	if (!user.permissions.includes(permission)) {
		throw new Error(`Required permission: ${permission}`);
	}
	return user;
};

/**
 * Create a signed JWT token with user data
 */
export const createUserToken = async (
	userId: string,
	expiresIn: string = "24h"
): Promise<string> => {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			permissions: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	// Parse permissions
	let permissions: string[] = [];
	if (user.permissions) {
		try {
			permissions = typeof user.permissions === 'string'
				? JSON.parse(user.permissions)
				: user.permissions;
		} catch (error) {
			permissions = [];
		}
	}

	const payload = {
		sub: user.id,
		email: user.email,
		name: user.name,
		role: user.role,
		permissions,
	};

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(JWT_SECRET);
};

/**
 * Verify and decode JWT token
 */
export const verifyUserToken = async (token: string) => {
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return payload;
	} catch (error) {
		throw new Error("Invalid token");
	}
};

/**
 * Get user from API key (for API authentication)
 */
export const getUserFromApiKey = async (apiKey: string) => {
	// This would typically check against a database table of API keys
	// For now, we'll use a simple hash comparison
	const user = await db.user.findFirst({
		where: {
			// Assuming you have an apiKey field in your user table
			// OR you have a separate apiKeys table
		},
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			permissions: true,
			published: true,
		},
	});

	return user;
};

/**
 * Check if request is from authenticated API client
 */
export const authenticateApiRequest = async (request: Request) => {
	const authHeader = request.headers.get("authorization");

	if (!authHeader) {
		throw new Error("Authorization header required");
	}

	if (authHeader.startsWith("Bearer ")) {
		// JWT token authentication
		const token = authHeader.slice(7);
		const payload = await verifyUserToken(token);
		return payload;
	} else if (authHeader.startsWith("ApiKey ")) {
		// API key authentication
		const apiKey = authHeader.slice(7);
		const user = await getUserFromApiKey(apiKey);
		if (!user) {
			throw new Error("Invalid API key");
		}
		return user;
	} else {
		throw new Error("Invalid authorization header format");
	}
};

/**
 * Rate limiting utilities
 */
interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	keyGenerator?: (request: Request) => string; // Custom key generator
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (config: RateLimitConfig) => {
	return async (request: Request): Promise<boolean> => {
		const now = Date.now();
		const key = config.keyGenerator
			? config.keyGenerator(request)
			: request.headers.get("x-forwarded-for") || "unknown";

		const record = rateLimitStore.get(key);

		if (!record || now > record.resetTime) {
			// First request or window expired
			rateLimitStore.set(key, {
				count: 1,
				resetTime: now + config.windowMs,
			});
			return true;
		}

		if (record.count >= config.maxRequests) {
			return false; // Rate limit exceeded
		}

		record.count++;
		return true;
	};
};

/**
 * Session management utilities (App Router compatible)
 */
export const setSecureCookie = async (name: string, value: string, maxAge?: number) => {
	const cookieStore = await cookies();
	cookieStore.set(name, value, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: maxAge || 24 * 60 * 60, // 24 hours default
		path: "/",
	});
};

export const getSecureCookie = async (name: string) => {
	const cookieStore = await cookies();
	return cookieStore.get(name)?.value;
};

export const deleteSecureCookie = async (name: string) => {
	const cookieStore = await cookies();
	cookieStore.delete(name);
};

/**
 * Password utilities
 */
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
	return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
	return bcrypt.compare(password, hash);
};

/**
 * Email verification utilities
 */
export const generateVerificationToken = (): string => {
	return crypto.randomUUID();
};

export const sendVerificationEmail = async (email: string, token: string) => {
	// Implementation depends on your email service
	console.log(`Send verification email to ${email} with token ${token}`);
	// You would integrate with your email service here
};

/**
 * Two-factor authentication utilities
 */
export const generate2FASecret = (): string => {
	// This would typically use a library like 'speakeasy'
	return crypto.randomUUID();
};

export const verify2FAToken = (secret: string, token: string): boolean => {
	// This would typically use a library like 'speakeasy'
	// For now, return a placeholder
	return token.length === 6 && /^\d+$/.test(token);
};

/**
 * Audit logging
 */
export const logAuthEvent = async (
	event: string,
	userId?: string,
	metadata?: Record<string, any>
) => {
	try {
		// You could store this in a separate audit log table
		console.log("Auth Event:", {
			event,
			userId,
			metadata,
			timestamp: new Date().toISOString(),
		});

		// Example: Store in database
		// await db.auditLog.create({
		//   data: {
		//     event,
		//     userId,
		//     metadata: JSON.stringify(metadata),
		//   },
		// });
	} catch (error) {
		console.error("Failed to log auth event:", error);
	}
};