import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all attributes
async function GET_Handler(req: NextRequest) {
	// QUERY PARAMS
	const query = {
		s: req.nextUrl.searchParams.get("s") || "",
		skip: parseInt(req.nextUrl.searchParams.get("skip") ?? "0"),
		take: parseInt(req.nextUrl.searchParams.get("take") ?? "10"),
		orderBy: req.nextUrl.searchParams.get("orderBy") || "createdAt",
		filterBy: req.nextUrl.searchParams.get("filterBy") || "",
		byCat: req.nextUrl.searchParams.get("cat") || "all",
		type: req.nextUrl.searchParams.get("type") || null,
		parent: req.nextUrl.searchParams.get("parent") || null,
		min: Boolean(req.nextUrl.searchParams.get("min")),
	};

	try {
		// Fetch count and data in parallel for better performance
		const [count, db] = await Promise.all([
			models.Attribute.getAttributesCount(query),
			models.Attribute.getAllAttributes(query),
		]);

		return NextResponse.json({
			message: "Data fetched successfully",
			data: db,
			count: count,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{ message: "Error fetching attributes", success: "error" },
			{ status: 500 },
		);
	}
}

// Create Attribute
async function POST_Handler(req: NextRequest) {
	try {
		const body = await req.json();
		const db = await models.Attribute.createAttribute(body);

		return NextResponse.json({
			message: "Attribute created successfully",
			data: db,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{ message: "Error creating attribute", success: "error" },
			{ status: 500 },
		);
	}
}

// DELETE Multiple
async function DELETE_Handler(req: NextRequest) {
	try {
		const body = await req.json();
		const db = await models.Attribute.deleteMulti(body);

		return NextResponse.json({
			message: "Attributes deleted successfully",
			data: db,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{ message: "Error deleting attributes", success: "error" },
			{ status: 500 },
		);
	}
}

export const GET = requireModerator()(GET_Handler);
export const POST = requireModerator()(POST_Handler);
export const DELETE = requireModerator()(DELETE_Handler);
