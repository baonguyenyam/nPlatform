import { type NextRequest, NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all Files
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
				models.File.getFilesCount(query),
				models.File.getAllFiles(query),
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
					message: "Error fetching files",
					error: error instanceof Error ? error.message : "Unknown error",
					success: false,
				},
				{ status: 500 },
			);
		}
	},
);

// Create Files
export const POST = requireModerator()(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.File.createFile(body);

		return NextResponse.json({
			message: "File created successfully",
			data: db,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error creating file",
				error: error instanceof Error ? error.message : "Unknown error",
				success: "error",
			},
			{ status: 500 },
		);
	}
});

// DELETE Multiple
export const DELETE = requireModerator()(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.File.deleteMulti(body);

		return NextResponse.json({
			message: "Files deleted successfully",
			data: db,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error deleting files",
				error: error instanceof Error ? error.message : "Unknown error",
				success: "error",
			},
			{ status: 500 },
		);
	}
});
