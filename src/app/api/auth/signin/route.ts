import bcrypt from "bcrypt";
import { z } from "zod";

import models from "@/models";

// Rate limiting map - in production, use Redis or database
const loginAttempts = new Map<string, { attempts: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Validation schema
const SignInSchema = z.object({
	email: z.string().email("Invalid email format").min(1, "Email is required"),
	password: z.string().min(1, "Password is required"),
});

// Clean up old entries periodically
const cleanupAttempts = () => {
	const now = Date.now();
	for (const [key, data] of loginAttempts.entries()) {
		if (now - data.lastAttempt > LOCKOUT_DURATION) {
			loginAttempts.delete(key);
		}
	}
};

// Check if IP is rate limited
const isRateLimited = (identifier: string): boolean => {
	const attempts = loginAttempts.get(identifier);
	if (!attempts) return false;
	
	const now = Date.now();
	if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
		loginAttempts.delete(identifier);
		return false;
	}
	
	return attempts.attempts >= MAX_ATTEMPTS;
};

// Record login attempt
const recordAttempt = (identifier: string, success: boolean) => {
	if (success) {
		loginAttempts.delete(identifier);
		return;
	}
	
	const now = Date.now();
	const attempts = loginAttempts.get(identifier);
	
	if (attempts) {
		attempts.attempts += 1;
		attempts.lastAttempt = now;
	} else {
		loginAttempts.set(identifier, { attempts: 1, lastAttempt: now });
	}
};

// Sign in with credentials
export async function POST(req: Request) {
	try {
		// Clean up old attempts
		cleanupAttempts();
		
		// Get client identifier (IP address)
		const forwardedFor = req.headers.get('x-forwarded-for');
		const clientIP = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
		
		// Check rate limiting
		if (isRateLimited(clientIP)) {
			console.warn(`Rate limited login attempt from IP: ${clientIP}`);
			return Response.json(
				{ message: "Too many login attempts. Please try again later." },
				{ status: 429 }
			);
		}

		// Parse and validate request body
		const body = await req.json();
		const validationResult = SignInSchema.safeParse(body);
		
		if (!validationResult.success) {
			recordAttempt(clientIP, false);
			return Response.json(
				{ 
					message: "Invalid input data",
					errors: validationResult.error.errors.map(err => ({
						field: err.path.join('.'),
						message: err.message
					}))
				},
				{ status: 400 }
			);
		}

		const { email, password } = validationResult.data;

		// Normalize email
		const normalizedEmail = email.toLowerCase().trim();

		// Fetch user including the password hash
		const dbUser = await models.User.signIn(normalizedEmail);

		// Check if user exists and has password
		if (!dbUser || !dbUser.password) {
			recordAttempt(clientIP, false);
			console.warn(`Login attempt for non-existent user: ${normalizedEmail} from IP: ${clientIP}`);
			
			// Use consistent timing to prevent user enumeration
			await new Promise(resolve => setTimeout(resolve, 100));
			
			return Response.json(
				{ message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// Check if user account is active
		if (!dbUser.published) {
			recordAttempt(clientIP, false);
			console.warn(`Login attempt for inactive account: ${normalizedEmail}`);
			return Response.json(
				{ message: "Account is not active. Please contact support." },
				{ status: 403 }
			);
		}

		// Verify email if required
		if (!dbUser.emailVerified) {
			recordAttempt(clientIP, false);
			return Response.json(
				{ message: "Please verify your email before signing in." },
				{ status: 403 }
			);
		}

		// Compare passwords with timing attack protection
		const isMatch = await bcrypt.compare(password, dbUser.password);

		if (!isMatch) {
			recordAttempt(clientIP, false);
			console.warn(`Invalid password attempt for: ${normalizedEmail} from IP: ${clientIP}`);
			return Response.json(
				{ message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// Success - record successful attempt and clear any previous failures
		recordAttempt(clientIP, true);

		// Prepare user object for response (exclude sensitive data)
		const { password: _, ...safeUser } = dbUser;
		
		// Parse permissions if it's a string
		let permissions: string[] = [];
		if (safeUser.permissions) {
			try {
				permissions = typeof safeUser.permissions === 'string' 
					? JSON.parse(safeUser.permissions)
					: safeUser.permissions;
			} catch (error) {
				console.warn("Failed to parse user permissions:", error);
				permissions = [];
			}
		}

		// Return user with properly formatted data
		const responseUser = {
			...safeUser,
			permissions,
			image: safeUser.avatar || null, // NextAuth expects 'image' field
		};

		console.log(`Successful login for: ${normalizedEmail} from IP: ${clientIP}`);
		return Response.json({ user: responseUser }, { status: 200 });

	} catch (error) {
		console.error("Sign-in API error:", error);
		
		// Don't expose internal errors to client
		return Response.json(
			{ message: "An internal server error occurred. Please try again." },
			{ status: 500 }
		);
	}
}
