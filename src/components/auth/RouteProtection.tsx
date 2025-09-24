import React from "react";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { useAuth, usePermissions } from "@/hooks/auth";

interface RouteProtectionProps {
	children: React.ReactNode;
	roles?: UserRole[];
	permissions?: string[];
	requireAll?: boolean;
	requireAuth?: boolean;
	requireEmailVerification?: boolean;
	fallbackUrl?: string;
	loadingComponent?: React.ReactNode;
	unauthorizedComponent?: React.ReactNode;
}

/**
 * Client-side route protection component
 * Wraps components that need authentication/authorization
 */
export function RouteProtection({
	children,
	roles = [],
	permissions = [],
	requireAll = false,
	requireAuth = true,
	requireEmailVerification = false,
	fallbackUrl = "/unauthorized",
	loadingComponent,
	unauthorizedComponent,
}: RouteProtectionProps) {
	const {
		isAuthenticated,
		isLoading,
		user,
		needsEmailVerification,
		error,
	} = useAuth();
	const { checkRoles, checkPermission } = usePermissions();

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				{loadingComponent || (
					<div className="text-center">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
						<p className="mt-2 text-sm text-gray-600">Loading...</p>
					</div>
				)}
			</div>
		);
	}

	// Check authentication requirement
	if (requireAuth && !isAuthenticated) {
		if (unauthorizedComponent) {
			return <>{unauthorizedComponent}</>;
		}
		redirect(`/authentication/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
	}

	// Check email verification requirement
	if (requireEmailVerification && needsEmailVerification) {
		if (unauthorizedComponent) {
			return <>{unauthorizedComponent}</>;
		}
		redirect(`/authentication/verify-request?email=${encodeURIComponent(user?.email || '')}`);
	}

	// Check role requirements
	if (roles.length > 0 && !checkRoles(roles)) {
		if (unauthorizedComponent) {
			return <>{unauthorizedComponent}</>;
		}
		redirect(fallbackUrl);
	}

	// Check permission requirements
	if (permissions.length > 0) {
		const hasPermissions = requireAll
			? permissions.every(permission => checkPermission(permission))
			: permissions.some(permission => checkPermission(permission));

		if (!hasPermissions) {
			if (unauthorizedComponent) {
				return <>{unauthorizedComponent}</>;
			}
			redirect(fallbackUrl);
		}
	}

	// Show error state if there's an auth error
	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="text-red-500">
						<svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<h2 className="mt-2 text-lg font-semibold">Authentication Error</h2>
					<p className="mt-1 text-sm text-gray-600">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-primary/80"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// All checks passed, render children
	return <>{children}</>;
}

/**
 * Higher-order component for route protection
 */
export function withRouteProtection<P extends object>(
	Component: React.ComponentType<P>,
	protectionOptions: Omit<RouteProtectionProps, 'children'>
) {
	const ProtectedComponent = (props: P) => {
		return (
			<RouteProtection {...protectionOptions}>
				<Component {...props} />
			</RouteProtection>
		);
	};

	ProtectedComponent.displayName = `withRouteProtection(${Component.displayName || Component.name})`;

	return ProtectedComponent;
}

/**
 * Conditional rendering based on permissions
 */
interface PermissionGateProps {
	children: React.ReactNode;
	roles?: UserRole[];
	permissions?: string[];
	requireAll?: boolean;
	fallback?: React.ReactNode;
	requireAuth?: boolean;
}

export function PermissionGate({
	children,
	roles = [],
	permissions = [],
	requireAll = false,
	fallback = null,
	requireAuth = true,
}: PermissionGateProps) {
	const { isAuthenticated, user } = useAuth();
	const { checkRoles, checkPermission } = usePermissions();

	// Check authentication if required
	if (requireAuth && !isAuthenticated) {
		return <>{fallback}</>;
	}

	// Check role requirements
	if (roles.length > 0 && !checkRoles(roles)) {
		return <>{fallback}</>;
	}

	// Check permission requirements
	if (permissions.length > 0) {
		const hasPermissions = requireAll
			? permissions.every(permission => checkPermission(permission))
			: permissions.some(permission => checkPermission(permission));

		if (!hasPermissions) {
			return <>{fallback}</>;
		}
	}

	return <>{children}</>;
}

/**
 * Admin-only component wrapper
 */
export function AdminOnly({
	children,
	fallback = <div>Access Denied: Admin access required</div>,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	return (
		<PermissionGate roles={["ADMIN"]} fallback={fallback}>
			{children}
		</PermissionGate>
	);
}

/**
 * Moderator and Admin access wrapper
 */
export function ModeratorOnly({
	children,
	fallback = <div>Access Denied: Moderator access required</div>,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	return (
		<PermissionGate roles={["ADMIN", "MODERATOR"]} fallback={fallback}>
			{children}
		</PermissionGate>
	);
}

/**
 * Authenticated users only wrapper
 */
export function AuthOnly({
	children,
	fallback = <div>Please log in to view this content</div>,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	return (
		<PermissionGate requireAuth={true} fallback={fallback}>
			{children}
		</PermissionGate>
	);
}