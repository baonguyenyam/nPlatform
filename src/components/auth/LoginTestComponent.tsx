"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";

export default function LoginTestComponent() {
	const [email, setEmail] = useState("demo@example.com");
	const [password, setPassword] = useState("demo");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const { isAuthenticated, user } = useAuth();

	const handleCredentialsLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError(`Login failed: ${result.error}`);
			} else if (result?.ok) {
				setSuccess("Login successful!");
			}
		} catch (error) {
			setError(`Login error: ${error}`);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		try {
			await signOut({ redirect: false });
			setSuccess("Logged out successfully!");
		} catch (error) {
			setError(`Logout error: ${error}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle>🧪 Login Test</CardTitle>
				<CardDescription>Test the login functionality</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{isAuthenticated ? (
					<div className="space-y-4">
						<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
							<p className="text-green-800">✅ Currently logged in as:</p>
							<p className="font-semibold">{user?.name || user?.email}</p>
							<p className="text-sm">Role: {user?.role}</p>
						</div>

						<Button onClick={handleLogout} disabled={loading} className="w-full">
							{loading ? "Logging out..." : "Logout"}
						</Button>
					</div>
				) : (
					<form onSubmit={handleCredentialsLogin} className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-medium">
								Email
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter email"
								required
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium">
								Password
							</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter password"
								required
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Signing in..." : "Sign In"}
						</Button>

						<div className="space-y-2">
							<p className="text-sm text-gray-600">Test accounts:</p>
							<div className="text-xs space-y-1">
								<div>📧 demo@example.com / 🔑 demo</div>
								<div>📧 admin@example.com / 🔑 demo</div>
							</div>
						</div>
					</form>
				)}

				{/* OAuth Login Options */}
				<div className="space-y-2">
					<p className="text-sm font-medium">Or sign in with:</p>
					<div className="grid grid-cols-2 gap-2">
						<Button
							onClick={() => signIn("github")}
							variant="outline"
							size="sm"
							disabled={loading}
						>
							GitHub
						</Button>
						<Button
							onClick={() => signIn("google")}
							variant="outline"
							size="sm"
							disabled={loading}
						>
							Google
						</Button>
					</div>
				</div>

				{/* Status Messages */}
				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-800 text-sm">❌ {error}</p>
					</div>
				)}

				{success && (
					<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
						<p className="text-green-800 text-sm">✅ {success}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}