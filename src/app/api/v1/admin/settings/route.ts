import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import models from "@/models";

// get all Settings (Admin only)
export const GET = withSettingsPermission(
	ACTIONS.READ,
	PERMISSION_LEVELS.ADMIN,
)(async (req: NextRequest) => {
	try {
		const db = await models.Setting.getAllSettings();

		return NextResponse.json({
			message: "Data fetched successfully",
			data: db,
			success: true,
		});
	} catch (error) {
		return NextResponse.json(
			{
				message: "Error fetching settings",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});

// Update Settings (Admin only)
export const PUT = withSettingsPermission(
	ACTIONS.UPDATE,
	PERMISSION_LEVELS.ADMIN,
)(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const db = await models.Setting.updateSetting(body);

		if (db) {
			return NextResponse.json({
				message: "Setting updated successfully",
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
				message: "Error updating setting",
				error: error instanceof Error ? error.message : "Unknown error",
				success: false,
			},
			{ status: 500 },
		);
	}
});
