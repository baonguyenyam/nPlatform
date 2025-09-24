import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth"; // Import CredentialsSignin
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z, ZodError } from "zod";

// Consider moving this schema to a shared location if used elsewhere (e.g., the login form)
const FormSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.min(1, "Email is required")
		.email("Invalid email"),
	password: z
		.string({ required_error: "Password is required" })
		.min(1, "Password is required"),
	// You might remove min/max length checks here if you prefer the API to handle all validation
	// .min(8, "Password must be more than 8 characters")
	// .max(32, "Password must be less than 32 characters"),
});

export default {
	trustHost: true, // This allows NextAuth to trust all hosts
	providers: [
		GitHub({
			clientId: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
		}),
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		Credentials({
			// Optional: You can remove name and credentials if you use a custom login form exclusively
			// name: "Credentials",
			// credentials: {
			// 	email: { label: "Email", type: "text", placeholder: "Email" },
			// 	password: { label: "Password", type: "password", placeholder: "Password" },
			// },
			async authorize(credentials: any) {
				// credentials type is any, which is okay here
				try {
					// 1. Validate input using Zod
					const { email, password } = await FormSchema.parseAsync(credentials);

					// 2. Call your custom sign-in API endpoint
					// Ensure PUBLIC_SITE_URL is correctly set in your environment variables
					const apiEndpoint = `${process.env.PUBLIC_SITE_URL}/api/auth/signin`;
					console.log(`Calling sign-in API: ${apiEndpoint}`); // Log the endpoint being called

					const res = await fetch(apiEndpoint, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ email, password }),
						// Add timeout to prevent hanging requests
						signal: AbortSignal.timeout(10000), // 10 second timeout
					});

					// Check if response is ok before parsing JSON
					if (!res.ok) {
						const errorText = await res.text();
						console.error(`API Sign-in failed: Status ${res.status}`, errorText);

						// Return more specific error messages
						if (res.status === 401) {
							throw new CredentialsSignin("Invalid email or password.");
						} else if (res.status === 429) {
							throw new CredentialsSignin("Too many login attempts. Please try again later.");
						} else {
							throw new CredentialsSignin("Login service unavailable. Please try again.");
						}
					}

					const responseBody = await res.json();

					// 3. Check the response from your API
					if (!responseBody.user) {
						console.error("API Sign-in failed: No user in response", responseBody);
						throw new CredentialsSignin(
							responseBody.message || "Login failed. Please check your credentials.",
						);
					}

					// 4. Validate user data before returning
					const user = responseBody.user;
					if (!user.id || !user.email) {
						console.error("API Sign-in failed: Invalid user data", user);
						throw new CredentialsSignin("Invalid user data received.");
					}

					// 5. Return the user object if authentication was successful
					console.log("API Sign-in successful for:", user.email);
					return {
						id: user.id,
						email: user.email,
						name: user.name || null,
						role: user.role || "USER",
						permissions: Array.isArray(user.permissions) ? user.permissions : [],
						isTwoFactorEnabled: user.isTwoFactorEnabled || false,
						image: user.avatar || null,
					};
				} catch (error) {
					// Handle Zod validation errors
					if (error instanceof ZodError) {
						console.error("Zod Validation Error:", error.errors);
						throw new CredentialsSignin("Invalid email or password format.");
					}

					// Handle timeout errors
					if (error && typeof error === 'object' && 'name' in error &&
						(error.name === 'TimeoutError' || error.name === 'AbortError')) {
						console.error("Login timeout:", error);
						throw new CredentialsSignin("Login request timed out. Please try again.");
					}

					// Handle network errors
					if (error instanceof TypeError && error.message.includes('fetch')) {
						console.error("Network error during login:", error);
						throw new CredentialsSignin("Network error. Please check your connection.");
					}

					// Handle errors thrown from the fetch/response check block
					if (error instanceof CredentialsSignin) {
						// Re-throw the specific error for NextAuth to handle
						throw error;
					}

					// Handle other unexpected errors
					console.error("Unexpected authorize error:", error);
					throw new CredentialsSignin("An unexpected error occurred during login.");
				}
			},
		}),
	],
} satisfies NextAuthConfig;
