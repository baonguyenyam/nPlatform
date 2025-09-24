import { db } from "@/lib/db";
import {
	cachedGetUserByEmail,
	cachedGetUserById,
	clearCache,
} from "@/lib/db-cache";

// Get User by Email - use cached version for auth
export const getUserByEmail = async (email: string) => {
	try {
		return await cachedGetUserByEmail(email);
	} catch (error) {
		return null;
	}
};

// Get User by ID - use cached version
export const getUserById = async (id: string) => {
	try {
		return await cachedGetUserById(id);
	} catch (error) {
		return null;
	}
};

// Create User
export const createUser = async (data: any) => {
	try {
		const user = await db.user.create({
			data,
		});
		// Clear user cache when creating new user
		clearCache("user");
		return user;
	} catch (error) {
		return null;
	}
};

// Optimized get all users with better indexing
export const getAllUsers = async (query: any) => {
	const { take, skip, s, orderBy, filterBy, byCat, published } = query;
	try {
		const users = await db.user.findMany({
			take: take ? take : 20, // Default limit
			skip: skip ? skip : 0,
			where: {
				published: published !== undefined ? published : undefined,
				...(s && {
					OR: [
						{ email: { contains: s, mode: "insensitive" } },
						{ name: { contains: s, mode: "insensitive" } },
					],
				}),
			},
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
				avatar: true,
				emailVerified: true,
				createdAt: true,
				isTwoFactorEnabled: true,
				role: true,
				published: true,
				permissions: true,
			},
			orderBy: orderBy ? { [orderBy]: "desc" } : { createdAt: "desc" },
		});
		return users;
	} catch (error) {
		return null;
	}
};

// Optimized count query
export const getUsersCount = async (query: any) => {
	const { s, published } = query;
	try {
		const count = await db.user.count({
			where: {
				published: published !== undefined ? published : undefined,
				...(s && {
					OR: [
						{ email: { contains: s, mode: "insensitive" } },
						{ name: { contains: s, mode: "insensitive" } },
					],
				}),
			},
		});
		return count;
	} catch (error) {
		return null;
	}
};

// delete user
export const deleteUser = async (id: string) => {
	try {
		const user = await db.user.delete({
			where: {
				id,
			},
		});
		// Clear user cache when deleting user
		clearCache("user");
		return user;
	} catch (error) {
		return null;
	}
};

// update user
export const updateUser = async (id: string, data: any) => {
	try {
		const user = await db.user.update({
			where: {
				id,
			},
			data,
		});
		// Clear specific user cache
		clearCache(`user-by-id:${id}`);
		if (data.email) {
			clearCache(`user-by-email:${data.email}`);
		}
		return user;
	} catch (error) {
		return null;
	}
};

// delete multiple users
export const deleteMulti = async (ids: string[]) => {
	try {
		const users = await db.user.deleteMany({
			where: {
				id: {
					in: ids,
				},
			},
		});
		// Clear user cache when bulk deleting
		clearCache("user");
		return users;
	} catch (error) {
		return null;
	}
};

// update multiple users
export const updateMulti = async (ids: string[], data: any) => {
	try {
		const users = await db.user.updateMany({
			where: {
				id: {
					in: ids,
				},
			},
			data,
		});
		// Clear user cache when bulk updating
		clearCache("user");
		return users;
	} catch (error) {
		return null;
	}
};

// signIn - fetch user with password for authentication
export const signIn = async (email: string) => {
	try {
		// Fetch user with password for authentication - don't use cache for security
		const user = await db.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				name: true,
				password: true, // Include password for verification
				role: true,
				permissions: true,
				emailVerified: true,
				isTwoFactorEnabled: true,
				published: true,
				avatar: true,
			},
		});
		return user;
	} catch (error) {
		console.error("SignIn query error:", error);
		return null;
	}
};
