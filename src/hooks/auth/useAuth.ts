import { useCallback, useEffect } from "react";
import type { UserRole } from "@prisma/client";
import { signOut } from "next-auth/react";

import { useAppDispatch, useAppSelector } from "@/store";
import {
	checkSessionExpiry,
	clearAuthError,
	removeActiveUser,
	selectAuth,
	selectAuthError,
	selectAuthLoading,
	selectAuthUser,
	selectIsLoggedIn,
	selectIsSessionValid,
	selectUserPermissions,
	selectUserRole,
	type AuthUser,
} from "@/store/authSlice";

/**
 * Enhanced hook để lấy thông tin user hiện tại từ Redux store
 * Includes session management and automatic cleanup
 */
export const useAuth = () => {
	const dispatch = useAppDispatch();
	const authState = useAppSelector(selectAuth);
	const user = useAppSelector(selectAuthUser);
	const isLoggedIn = useAppSelector(selectIsLoggedIn);
	const isLoading = useAppSelector(selectAuthLoading);
	const error = useAppSelector(selectAuthError);
	const isSessionValid = useAppSelector(selectIsSessionValid);
	const permissions = useAppSelector(selectUserPermissions);
	const role = useAppSelector(selectUserRole);

	// Check session expiry periodically
	useEffect(() => {
		const checkSession = () => {
			dispatch(checkSessionExpiry());
		};

		// Check immediately
		checkSession();

		// Set up interval to check every minute
		const interval = setInterval(checkSession, 60 * 1000);

		return () => clearInterval(interval);
	}, [dispatch]);

	const handleLogout = useCallback(async () => {
		try {
			// Clear Redux state first
			dispatch(removeActiveUser());
			
			// Then clear NextAuth session
			await signOut({ redirect: false });
		} catch (error) {
			console.error("Logout error:", error);
		}
	}, [dispatch]);

	// Auto logout if session is invalid
	useEffect(() => {
		if (isLoggedIn && !isSessionValid) {
			handleLogout();
		}
	}, [isLoggedIn, isSessionValid, handleLogout]);

	const clearError = useCallback(() => {
		dispatch(clearAuthError());
	}, [dispatch]);

	// Helper functions with type safety
	const hasRole = useCallback((targetRole: UserRole): boolean => {
		return role === targetRole;
	}, [role]);

	const hasPermission = useCallback((permission: string): boolean => {
		return permissions.includes(permission);
	}, [permissions]);

	const hasAnyPermission = useCallback((targetPermissions: string[]): boolean => {
		return targetPermissions.some(permission => permissions.includes(permission));
	}, [permissions]);

	const hasAllPermissions = useCallback((targetPermissions: string[]): boolean => {
		return targetPermissions.every(permission => permissions.includes(permission));
	}, [permissions]);

	const isAdmin = useCallback((): boolean => {
		return role === "ADMIN";
	}, [role]);

	const isModerator = useCallback((): boolean => {
		return role === "MODERATOR" || role === "ADMIN";
	}, [role]);

	const isUser = useCallback((): boolean => {
		return role === "USER";
	}, [role]);

	const hasAdminAccess = useCallback((): boolean => {
		return role === "ADMIN" || role === "MODERATOR";
	}, [role]);

	// Check if user profile is complete
	const isProfileComplete = useCallback((): boolean => {
		if (!user) return false;
		return !!(user.name && user.email && user.emailVerified);
	}, [user]);

	// Get user display name
	const getDisplayName = useCallback((): string => {
		if (!user) return "Guest";
		return user.name || user.email || "User";
	}, [user]);

	// Get user initials for avatar fallback
	const getUserInitials = useCallback((): string => {
		if (!user) return "G";
		const name = user.name || user.email || "User";
		const parts = name.split(" ");
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}
		return name[0]?.toUpperCase() || "U";
	}, [user]);

	return {
		// Core auth state
		user,
		isLoggedIn,
		isLoading,
		error,
		authState,
		isSessionValid,
		permissions,
		role,

		// Actions
		logout: handleLogout,
		clearError,

		// Role checking functions
		hasRole,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isAdmin,
		isModerator,
		isUser,
		hasAdminAccess,

		// User utility functions
		isProfileComplete,
		getDisplayName,
		getUserInitials,

		// Convenience computed values
		isAuthenticated: isLoggedIn && isSessionValid,
		needsEmailVerification: user && !user.emailVerified,
		is2FAEnabled: user?.isTwoFactorEnabled || false,
	};
};

/**
 * Hook để check permissions với better API
 */
export const usePermissions = () => {
	const { user, hasPermission, hasRole, hasAnyPermission, hasAllPermissions, hasAdminAccess } = useAuth();

	const checkPermission = useCallback((permission: string): boolean => {
		if (!user) return false;
		return hasPermission(permission);
	}, [user, hasPermission]);

	const checkRole = useCallback((role: UserRole): boolean => {
		if (!user) return false;
		return hasRole(role);
	}, [user, hasRole]);

	const checkRoles = useCallback((roles: UserRole[]): boolean => {
		if (!user) return false;
		return roles.some(role => hasRole(role));
	}, [user, hasRole]);

	// Resource-based permission checking
	const canRead = useCallback((resource: string): boolean => {
		return checkPermission(`READ_${resource.toUpperCase()}`);
	}, [checkPermission]);

	const canWrite = useCallback((resource: string): boolean => {
		return checkPermission(`WRITE_${resource.toUpperCase()}`);
	}, [checkPermission]);

	const canDelete = useCallback((resource: string): boolean => {
		return checkPermission(`DELETE_${resource.toUpperCase()}`);
	}, [checkPermission]);

	const canManage = useCallback((resource: string): boolean => {
		return checkPermission(`MANAGE_${resource.toUpperCase()}`);
	}, [checkPermission]);

	return {
		checkPermission,
		checkRole,
		checkRoles,
		hasAdminAccess,
		isAdmin: () => checkRole("ADMIN"),
		isModerator: () => checkRole("MODERATOR"),
		isUser: () => checkRole("USER"),
		
		// Resource-based permissions
		canRead,
		canWrite,
		canDelete,
		canManage,
		
		// Common permission combinations
		canManageUsers: () => hasAdminAccess() || checkPermission("MANAGE_USERS"),
		canManagePosts: () => hasAdminAccess() || checkPermission("MANAGE_POSTS"),
		canManageOrders: () => hasAdminAccess() || checkPermission("MANAGE_ORDERS"),
		canViewAnalytics: () => hasAdminAccess() || checkPermission("VIEW_ANALYTICS"),
	};
};
