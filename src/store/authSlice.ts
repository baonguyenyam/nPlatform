import type { UserRole } from "@prisma/client";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
	id: string;
	email: string;
	name?: string | null;
	role: UserRole;
	avatar?: string | null;
	permissions?: string[];
	isTwoFactorEnabled?: boolean;
	emailVerified?: Date | null;
	createdAt?: Date | null;
}

interface AuthState {
	isLoggedIn: boolean;
	user: AuthUser | null;
	isLoading: boolean;
	lastSync: number | null; // Timestamp of last sync with NextAuth
	error: string | null; // Add error handling
	sessionExpiry: number | null; // Track session expiry
}

const initialState: AuthState = {
	isLoggedIn: false,
	user: null,
	isLoading: false,
	lastSync: null,
	error: null,
	sessionExpiry: null,
};

const authSlice = createSlice({
	name: "authState",
	initialState,
	reducers: {
		setAuthLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
			if (action.payload) {
				state.error = null; // Clear error when loading
			}
		},
		setAuthError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
			state.isLoading = false;
		},
		setActiveUser: (state, action: PayloadAction<AuthUser>) => {
			state.isLoggedIn = true;
			state.user = action.payload;
			state.isLoading = false;
			state.error = null;
			state.lastSync = Date.now();
			// Set session expiry to 24 hours from now
			state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
		},
		updateUserProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
			if (state.user) {
				state.user = { ...state.user, ...action.payload };
				state.lastSync = Date.now();
				state.error = null;
			}
		},
		removeActiveUser: (state) => {
			state.isLoggedIn = false;
			state.user = null;
			state.isLoading = false;
			state.error = null;
			state.sessionExpiry = null;
			state.lastSync = Date.now();
		},
		syncFromNextAuth: (
			state,
			action: PayloadAction<{
				user: AuthUser | null;
				isLoggedIn: boolean;
				error?: string | null;
			}>,
		) => {
			const { user, isLoggedIn, error } = action.payload;
			state.isLoggedIn = isLoggedIn;
			state.user = user;
			state.isLoading = false;
			state.error = error || null;
			state.lastSync = Date.now();

			if (isLoggedIn && user) {
				// Update session expiry when syncing logged in user
				state.sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
			} else {
				state.sessionExpiry = null;
			}
		},
		checkSessionExpiry: (state) => {
			if (state.sessionExpiry && Date.now() > state.sessionExpiry) {
				// Session expired, clear user data
				state.isLoggedIn = false;
				state.user = null;
				state.error = "Session expired. Please log in again.";
				state.sessionExpiry = null;
			}
		},
		clearAuthError: (state) => {
			state.error = null;
		},
	},
});

export const {
	setAuthLoading,
	setAuthError,
	setActiveUser,
	updateUserProfile,
	removeActiveUser,
	syncFromNextAuth,
	checkSessionExpiry,
	clearAuthError,
} = authSlice.actions;

// Enhanced Selectors
export const selectAuth = (state: { authState: AuthState }) => state.authState;
export const selectAuthUser = (state: { authState: AuthState }) =>
	state.authState.user;
export const selectIsLoggedIn = (state: { authState: AuthState }) =>
	state.authState.isLoggedIn;
export const selectAuthLoading = (state: { authState: AuthState }) =>
	state.authState.isLoading;
export const selectAuthError = (state: { authState: AuthState }) =>
	state.authState.error;
export const selectSessionExpiry = (state: { authState: AuthState }) =>
	state.authState.sessionExpiry;
export const selectIsSessionValid = (state: { authState: AuthState }) => {
	const { sessionExpiry, isLoggedIn } = state.authState;
	if (!isLoggedIn || !sessionExpiry) return false;
	return Date.now() < sessionExpiry;
};

// Enhanced selectors with permission checking
export const selectUserPermissions = (state: { authState: AuthState }) =>
	state.authState.user?.permissions || [];
export const selectUserRole = (state: { authState: AuthState }) =>
	state.authState.user?.role;
export const selectHasPermission = (permission: string) => (state: { authState: AuthState }) =>
	state.authState.user?.permissions?.includes(permission) || false;
export const selectHasRole = (role: UserRole) => (state: { authState: AuthState }) =>
	state.authState.user?.role === role;
export const selectHasAnyRole = (roles: UserRole[]) => (state: { authState: AuthState }) =>
	state.authState.user?.role ? roles.includes(state.authState.user.role) : false;

export default authSlice.reducer;
