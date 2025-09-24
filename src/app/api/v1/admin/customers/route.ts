import { type NextRequest, NextResponse } from "next/server";

import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all customers
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
				models.Customer.getCustomersCount(query),
				models.Customer.getAllCustomers(query),
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
					message: "Error fetching customers",
					error: error instanceof Error ? error.message : "Unknown error",
					success: false,
				},
				{ status: 500 },
			);
		}
	},
);

// Create Customer
export const POST = withCustomersPermission(
	ACTIONS.CREATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Customer.createCustomer(body);

		if (db) {
			return NextResponse.json({
				message: "Customer created successfully",
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
				message: "Error creating customer",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// DELETE Multiple
export const DELETE = withCustomersPermission(
	ACTIONS.DELETE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Customer.deleteMulti(body);

		if (db) {
			return NextResponse.json({
				message: "Customer deleted successfully",
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
				message: "Error deleting customers",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// UPDATE Multiple
export const PATCH = withCustomersPermission(
	ACTIONS.UPDATE,
	PERMISSION_LEVELS.WRITE,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { ids, ...rest } = body;
		const db = await models.Customer.updateMulti(ids, rest);

		if (db) {
			return NextResponse.json({
				message: "Customer updated successfully",
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
				message: "Error updating customers",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});
