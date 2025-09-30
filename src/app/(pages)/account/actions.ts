'use server'

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import models from "@/models";

export async function getAll(email: string) {
	const session = await auth();

	if (!session?.user) {
		return {
			success: "error",
			message: "Not authenticated",
		};
	}

	try {
		const { User } = models;
		const user = await User.getUserByEmail(email);

		if (!user) {
			return {
				success: "error",
				message: "User not found",
			};
		}

		return {
			success: "success",
			message: "User profile retrieved successfully",
			data: user,
		};
	} catch (error: any) {
		return {
			success: "error",
			message: error.message || "Failed to retrieve user profile",
		};
	}
}

export async function updateRecord(data: any) {
	const session = await auth();

	if (!session?.user) {
		return {
			success: "error",
			message: "Not authenticated",
		};
	}

	try {
		const { User } = models;

		// Update user record using the User model
		if (!session.user.id) {
			throw new Error('User ID not found');
		}
		await User.updateUser(session.user.id, data);

		revalidatePath("/account");

		return {
			success: "success",
			message: "Profile updated successfully",
		};
	} catch (error: any) {
		return {
			success: "error",
			message: error.message || "Failed to update profile",
		};
	}
}

export async function checkId(username: string) {
	const session = await auth();

	if (!session?.user) {
		return {
			success: "error",
			message: "Not authenticated",
		};
	}

	try {
		// Simple validation - just return success for now
		// In a real app, you'd want to check against the database
		return {
			success: "success",
			message: "Username is available",
		};
	} catch (error: any) {
		return {
			success: "error",
			message: error.message || "Failed to check username",
		};
	}
}