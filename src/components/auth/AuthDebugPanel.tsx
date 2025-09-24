"use client";

import { useAuth, usePermissions } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Component để test và debug authentication system
 */
export default function AuthDebugPanel() {
	const {
		user,
		isAuthenticated,
		isLoading,
		error,
		isSessionValid,
		logout,
		getDisplayName,
		getUserInitials,
		isProfileComplete,
		needsEmailVerification,
		is2FAEnabled,
	} = useAuth();

	const {
		isAdmin,
		isModerator,
		hasAdminAccess,
		checkPermission,
		canManageUsers,
		canManageOrders,
	} = usePermissions();

	if (isLoading) {
		return (
			<Card className="w-full max-w-2xl mx-auto">
				<CardHeader>
					<CardTitle>🔄 Authentication Status</CardTitle>
					<CardDescription>Checking authentication...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="animate-pulse">Loading authentication data...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>🔐 Authentication Debug Panel</CardTitle>
				<CardDescription>Current authentication status and user info</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Authentication Status */}
				<div className="space-y-2">
					<h3 className="font-semibold text-lg">Authentication Status</h3>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-2">
							<span>Authenticated:</span>
							<Badge variant={isAuthenticated ? "default" : "destructive"}>
								{isAuthenticated ? "✅ Yes" : "❌ No"}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span>Session Valid:</span>
							<Badge variant={isSessionValid ? "default" : "destructive"}>
								{isSessionValid ? "✅ Valid" : "❌ Invalid"}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span>Profile Complete:</span>
							<Badge variant={isProfileComplete() ? "default" : "secondary"}>
								{isProfileComplete() ? "✅ Complete" : "⚠️ Incomplete"}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span>Email Verified:</span>
							<Badge variant={needsEmailVerification ? "destructive" : "default"}>
								{needsEmailVerification ? "❌ Unverified" : "✅ Verified"}
							</Badge>
						</div>
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="space-y-2">
						<h3 className="font-semibold text-lg text-red-600">Error</h3>
						<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-800">{error}</p>
						</div>
					</div>
				)}

				{/* User Information */}
				{user && (
					<div className="space-y-4">
						<h3 className="font-semibold text-lg">User Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<p><strong>ID:</strong> {user.id}</p>
								<p><strong>Email:</strong> {user.email}</p>
								<p><strong>Name:</strong> {user.name || "Not set"}</p>
								<p><strong>Display Name:</strong> {getDisplayName()}</p>
								<p><strong>Initials:</strong> {getUserInitials()}</p>
							</div>
							<div className="space-y-2">
								<p><strong>Role:</strong> <Badge>{user.role}</Badge></p>
								<p><strong>2FA Enabled:</strong> {is2FAEnabled ? "✅ Yes" : "❌ No"}</p>
								<p><strong>Avatar:</strong> {user.avatar ? "Set" : "Not set"}</p>
								<p><strong>Email Verified:</strong> {user.emailVerified ? "✅ Yes" : "❌ No"}</p>
							</div>
						</div>

						{/* Permissions */}
						<div className="space-y-2">
							<h4 className="font-semibold">Permissions ({user.permissions?.length || 0})</h4>
							<div className="flex flex-wrap gap-2">
								{user.permissions && user.permissions.length > 0 ? (
									user.permissions.map((permission) => (
										<Badge key={permission} variant="outline">
											{permission}
										</Badge>
									))
								) : (
									<span className="text-gray-500">No permissions assigned</span>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Role & Permission Tests */}
				{isAuthenticated && (
					<div className="space-y-4">
						<h3 className="font-semibold text-lg">Role & Permission Tests</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							<div className="flex items-center gap-2">
								<span>Is Admin:</span>
								<Badge variant={isAdmin() ? "default" : "secondary"}>
									{isAdmin() ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span>Is Moderator:</span>
								<Badge variant={isModerator() ? "default" : "secondary"}>
									{isModerator() ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span>Admin Access:</span>
								<Badge variant={hasAdminAccess() ? "default" : "secondary"}>
									{hasAdminAccess() ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span>Manage Users:</span>
								<Badge variant={canManageUsers() ? "default" : "secondary"}>
									{canManageUsers() ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span>Manage Orders:</span>
								<Badge variant={canManageOrders() ? "default" : "secondary"}>
									{canManageOrders() ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<span>Delete Posts:</span>
								<Badge variant={checkPermission("DELETE_POSTS") ? "default" : "secondary"}>
									{checkPermission("DELETE_POSTS") ? "✅ Yes" : "❌ No"}
								</Badge>
							</div>
						</div>
					</div>
				)}

				{/* Actions */}
				<div className="space-y-4">
					<h3 className="font-semibold text-lg">Actions</h3>
					<div className="flex gap-4">
						{isAuthenticated ? (
							<Button onClick={logout} variant="destructive">
								Logout
							</Button>
						) : (
							<Button asChild>
								<a href="/authentication/login">Login</a>
							</Button>
						)}
						<Button 
							onClick={() => window.location.reload()} 
							variant="outline"
						>
							Refresh Page
						</Button>
					</div>
				</div>

				{/* Raw Data (for debugging) */}
				<details className="space-y-2">
					<summary className="font-semibold cursor-pointer">🔍 Raw Auth Data (Debug)</summary>
					<pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
						{JSON.stringify({ user, isAuthenticated, isSessionValid, error }, null, 2)}
					</pre>
				</details>
			</CardContent>
		</Card>
	);
}