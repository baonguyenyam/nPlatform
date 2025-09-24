import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import {
	authError,
	createPagination,
	parsePaginationParams,
	parseQueryParams,
	successResponse,
} from "@/lib/api-helpers";
import models from "@/models";

// get all users
export const GET = requireModerator()(
	async (req: NextRequest) => {
		try {
			const url = new URL(req.url);
			const searchParams = url.searchParams;

			// Parse pagination and query parameters
			const pagination = parsePaginationParams(searchParams);
			const queryParams = parseQueryParams(searchParams);

			// Combine parameters
			const query = {
				...queryParams,
				...pagination,
			};

			// Fetch data and count in parallel for better performance
			const [db, count] = await Promise.all([
				models.User.getAllUsers(query),
				models.User.getUsersCount(query),
			]);

			if (!db) {
				throw new Error("Failed to fetch users");
			}

			// Create pagination info
			const paginationInfo = createPagination(
				count || 0,
				pagination.page,
				pagination.limit,
			);

			return NextResponse.json({
				message: "Users fetched successfully",
				data: db,
				count: count || 0,
				pagination: paginationInfo,
				success: true,
			});
		} catch (error) {
			return NextResponse.json(
				{
					message: "Error fetching users",
					error: error instanceof Error ? error.message : "Unknown error",
					success: false,
				},
				{ status: 500 },
			);
		}
	},
);

// Create User
export const POST = withUsersPermission(
	ACTIONS.CREATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.User.createUser(body);

		if (db) {
			return NextResponse.json(
				{
					message: "User created successfully",
					data: db,
					success: true,
				},
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{
				message: "Can not create the data",
				success: false,
			},
			{ status: 400 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error creating user",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// DELETE Multiple
export const DELETE = withUsersPermission(
	ACTIONS.DELETE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.User.deleteMulti(body);

		if (db) {
			return NextResponse.json(
				{
					message: "User deleted successfully",
					data: db,
					success: true,
				},
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{
				message: "Can not delete the data",
				success: false,
			},
			{ status: 400 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error deleting users",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// UPDATE Multiple
export const PATCH = withUsersPermission(
	ACTIONS.UPDATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { ids, ...rest } = body;
		const db = await models.User.updateMulti(ids, rest);

		if (db) {
			return NextResponse.json(
				{
					message: "User updated successfully",
					data: db,
					success: true,
				},
				{ status: 200 },
			);
		}

		return NextResponse.json(
			{
				message: "Can not update the data",
				success: false,
			},
			{ status: 400 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error updating users",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});
