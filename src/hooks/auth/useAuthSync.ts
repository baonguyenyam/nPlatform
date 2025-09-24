import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { useAppDispatch, useAppSelector } from "@/store";
import {
	selectAuth,
	setAuthLoading,
	syncFromNextAuth,
	type AuthUser
} from "@/store/authSlice";

/**
 * Enhanced hook để sync NextAuth session với Redux state
 * Automatically syncs NextAuth session with Redux auth state
 */
export const useAuthSync = () => {
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const authState = useAppSelector(selectAuth);

	useEffect(() => {
		// Set loading state
		if (status === "loading") {
			dispatch(setAuthLoading(true));
			return;
		}

		const isLoggedIn = !!session?.user;
		let user: AuthUser | null = null;

		if (session?.user) {
			user = {
				id: session.user.id as string,
				email: session.user.email as string,
				name: session.user.name,
				role: session.user.role,
				avatar: session.user.image,
				permissions: session.user.permissions || [],
				isTwoFactorEnabled: session.user.isTwoFactorEnabled,
				// These fields might not be available in middleware session
				emailVerified: null,
				createdAt: null,
			};
		}

		// Chỉ sync nếu có sự thay đổi hoặc chưa bao giờ sync
		const shouldSync =
			!authState.lastSync ||
			authState.isLoggedIn !== isLoggedIn ||
			(isLoggedIn && authState.user?.id !== user?.id) ||
			(isLoggedIn && authState.user?.role !== user?.role);

		if (shouldSync) {
			dispatch(syncFromNextAuth({
				user,
				isLoggedIn
			}));
		}
	}, [
		session,
		status,
		dispatch,
		authState.lastSync,
		authState.isLoggedIn,
		authState.user?.id,
		authState.user?.role,
	]);

	// Expose session state for debugging/monitoring
	return {
		session,
		status,
		authState,
		isLoading: status === "loading" || authState.isLoading,
		error: authState.error,
	};
};
