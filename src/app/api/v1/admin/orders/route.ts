import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all orders
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
			};

			const [count, db] = await Promise.all([
				models.Order.getOrdersCount(query),
				models.Order.getAllOrders(query),
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
					message: "Error fetching orders",
					error: error instanceof Error ? error.message : "Unknown error",
					success: false,
				},
				{ status: 500 },
			);
		}
	},
);

// Create Order
export const POST = withOrdersPermission(
	ACTIONS.CREATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Order.createOrder(body);

		if (db) {
			return NextResponse.json({
				message: "Order created successfully",
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
				message: "Error creating order",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// DELETE Multiple
export const DELETE = withOrdersPermission(
	ACTIONS.DELETE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Order.deleteMulti(body);

		if (db) {
			return NextResponse.json({
				message: "Order deleted successfully",
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
				message: "Error deleting orders",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// UPDATE Multiple
export const PATCH = withOrdersPermission(
	ACTIONS.UPDATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { ids, ...rest } = body;
		const db = await models.Order.updateMulti(ids, rest);

		if (db) {
			return NextResponse.json({
				message: "Order updated successfully",
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
				message: "Error updating orders",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});
