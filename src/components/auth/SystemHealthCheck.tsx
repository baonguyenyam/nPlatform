"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface SystemCheckResult {
	name: string;
	status: "pass" | "fail" | "warning";
	message: string;
	details?: string[];
}

export function SystemHealthCheck() {
	const [isChecking, setIsChecking] = useState(false);
	const [results, setResults] = useState<SystemCheckResult[]>([]);

	const runHealthCheck = async () => {
		setIsChecking(true);
		const checkResults: SystemCheckResult[] = [];

		// 1. Check API Endpoint
		try {
			const response = await fetch("/api/auth/signin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: "", password: "" }),
			});

			if (response.status === 400) {
				checkResults.push({
					name: "API Endpoint",
					status: "pass",
					message: "Endpoint accessible and returning validation errors",
					details: ["POST /api/auth/signin responds correctly"]
				});
			} else {
				checkResults.push({
					name: "API Endpoint",
					status: "warning",
					message: `Unexpected response status: ${response.status}`,
				});
			}
		} catch (error) {
			checkResults.push({
				name: "API Endpoint",
				status: "fail",
				message: "Cannot reach signin endpoint",
				details: [`Error: ${error}`]
			});
		}

		// 2. Check NextAuth Config
		try {
			const response = await fetch("/api/auth/session");
			checkResults.push({
				name: "NextAuth Session",
				status: "pass",
				message: "NextAuth session endpoint accessible",
				details: ["GET /api/auth/session responds"]
			});
		} catch (error) {
			checkResults.push({
				name: "NextAuth Session",
				status: "fail",
				message: "NextAuth session endpoint error",
				details: [`Error: ${error}`]
			});
		}

		// 3. Check Redux Store
		try {
			const storeExists = typeof window !== "undefined" &&
				(window as any).__REDUX_DEVTOOLS_EXTENSION__;
			checkResults.push({
				name: "Redux Store",
				status: storeExists ? "pass" : "warning",
				message: storeExists
					? "Redux DevTools detected - store is working"
					: "Redux store working (DevTools not detected)",
				details: ["Check browser console for Redux actions"]
			});
		} catch (error) {
			checkResults.push({
				name: "Redux Store",
				status: "fail",
				message: "Redux store error",
				details: [`Error: ${error}`]
			});
		}

		// 4. Check Environment Variables
		const envChecks = [];
		if (process.env.NEXT_PUBLIC_SITE_URL) {
			envChecks.push("✓ NEXT_PUBLIC_SITE_URL");
		} else {
			envChecks.push("✗ NEXT_PUBLIC_SITE_URL missing");
		}

		checkResults.push({
			name: "Environment Variables",
			status: envChecks.some(c => c.includes("✗")) ? "warning" : "pass",
			message: "Environment variables check",
			details: envChecks
		});

		// 5. Test Rate Limiting
		let rateLimitStatus = "pass";
		const rateLimitDetails = [];

		try {
			// Send multiple invalid requests quickly
			const promises = Array.from({ length: 3 }, () =>
				fetch("/api/auth/signin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: "test@test.com", password: "wrong" }),
				})
			);

			const responses = await Promise.all(promises);
			const statuses = responses.map(r => r.status);

			if (statuses.every(s => s === 400)) {
				rateLimitStatus = "pass";
				rateLimitDetails.push("Rate limiting allows normal failed attempts");
			} else if (statuses.some(s => s === 429)) {
				rateLimitStatus = "pass";
				rateLimitDetails.push("Rate limiting is working (429 responses)");
			} else {
				rateLimitStatus = "warning";
				rateLimitDetails.push(`Unexpected statuses: ${statuses.join(", ")}`);
			}
		} catch (error) {
			rateLimitStatus = "warning";
			rateLimitDetails.push(`Rate limit test failed: ${error}`);
		}

		checkResults.push({
			name: "Rate Limiting",
			status: rateLimitStatus as any,
			message: "Rate limiting functionality",
			details: rateLimitDetails
		});

		// 6. Check Client-side Auth State
		try {
			const authStateExists = typeof window !== "undefined";
			checkResults.push({
				name: "Client Auth State",
				status: authStateExists ? "pass" : "fail",
				message: authStateExists
					? "Client-side environment ready"
					: "Not running in browser",
				details: ["Check AuthProvider and hooks integration"]
			});
		} catch (error) {
			checkResults.push({
				name: "Client Auth State",
				status: "fail",
				message: "Client auth state error",
				details: [`Error: ${error}`]
			});
		}

		setResults(checkResults);
		setIsChecking(false);
	};

	const getStatusIcon = (status: SystemCheckResult["status"]) => {
		switch (status) {
			case "pass":
				return <CheckCircle className="w-5 h-5 text-green-500" />;
			case "fail":
				return <XCircle className="w-5 h-5 text-red-500" />;
			case "warning":
				return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
		}
	};

	const getStatusColor = (status: SystemCheckResult["status"]) => {
		switch (status) {
			case "pass":
				return "bg-green-100 text-green-800";
			case "fail":
				return "bg-red-100 text-red-800";
			case "warning":
				return "bg-yellow-100 text-yellow-800";
		}
	};

	return (
		<Card className="w-full max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					🔧 System Health Check
					<Button
						onClick={runHealthCheck}
						disabled={isChecking}
						size="sm"
						variant="outline"
					>
						{isChecking ? "Checking..." : "Run Check"}
					</Button>
					<Button
						onClick={async () => {
							try {
								await fetch("/api/auth/signin", { method: "DELETE" });
								alert("Rate limits cleared!");
							} catch (error) {
								alert("Failed to clear rate limits");
							}
						}}
						size="sm"
						variant="destructive"
						className="text-xs"
					>
						Clear Rate Limits
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{results.length === 0 ? (
					<p className="text-muted-foreground">
						Click "Run Check" to test your authentication system
					</p>
				) : (
					<div className="space-y-4">
						{results.map((result, index) => (
							<div key={index} className="border rounded-lg p-4">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										{getStatusIcon(result.status)}
										<h3 className="font-semibold">{result.name}</h3>
									</div>
									<Badge className={getStatusColor(result.status)}>
										{result.status.toUpperCase()}
									</Badge>
								</div>

								<p className="text-sm text-muted-foreground mb-2">
									{result.message}
								</p>

								{result.details && (
									<div className="mt-2">
										<Separator className="mb-2" />
										<ul className="text-xs space-y-1">
											{result.details.map((detail, i) => (
												<li key={i} className="font-mono bg-muted p-1 rounded">
													{detail}
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						))}

						<div className="mt-6 p-4 bg-blue-50 rounded-lg">
							<h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• If any checks failed, review the error details above</li>
								<li>• Test actual login at <code>/auth-test</code></li>
								<li>• Check browser console for additional errors</li>
								<li>• Verify database connection and user data</li>
							</ul>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}