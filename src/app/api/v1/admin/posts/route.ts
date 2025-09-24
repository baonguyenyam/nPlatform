import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all posts
export const GET = requireModerator()(
	async (req: NextRequest) => {
		try {
			// QUERY PARAMS
			const query = {
				s: new URL(req.url).searchParams.get("s") || "",
				skip: parseInt(new URL(req.url).searchParams.get("skip") ?? "0"),
				take: parseInt(new URL(req.url).searchParams.get("take") ?? "10"),
				orderBy: new URL(req.url).searchParams.get("orderBy") || "createdAt",
				filterBy: new URL(req.url).searchParams.get("filterBy") || "",
				byCat: new URL(req.url).searchParams.get("cat") || "all",
				type: new URL(req.url).searchParams.get("type") || null,
			};

			const [count, db] = await Promise.all([
				models.Post.getPostsCount(query),
				models.Post.getAllPosts(query),
			]);

			return NextResponse.json({
				message: "Data fetched successfully",
				data: db,
				count: count,
				success: true,
			});
		} catch (error) {
			return NextResponse.json(
				{
					message: "Error fetching posts",
					error: error instanceof Error ? error.message : "Unknown error",
					success: false,
				},
				{ status: 500 },
			);
		}
	},
);

// Create Post
export const POST = withPostsPermission(
	ACTIONS.CREATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		// Get user context from middleware
		const userContext = (req as any).userContext;
		body.userId = userContext?.userId;

		const db = await models.Post.createPost(body);

		if (db) {
			return NextResponse.json({
				message: "Post created successfully",
				data: db,
				success: true,
			});
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
				message: "Error creating post",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// DELETE Multiple Posts
export const DELETE = withPostsPermission(
	ACTIONS.DELETE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Post.deleteMulti(body);

		if (db) {
			return NextResponse.json({
				message: "Post deleted successfully",
				data: db,
				success: true,
			});
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
				message: "Error deleting posts",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// UPDATE Multiple Posts
export const PATCH = withPostsPermission(
	ACTIONS.UPDATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { ids, ...rest } = body;
		const db = await models.Post.updateMulti(ids, rest);

		if (db) {
			return NextResponse.json({
				message: "Post updated successfully",
				data: db,
				success: true,
			});
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
				message: "Error updating posts",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});
