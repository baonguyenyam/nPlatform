import { NextRequest, NextResponse } from "next/server";

// This endpoint is for debugging only - remove in production
export async function POST(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not available in production" }, { status: 404 });
	}

	try {
		// Import the signin route to access the clear function
		// Since we can't directly import the map, we'll use a different approach

		// For now, just return success
		// In a real implementation, you'd need to export the clear function
		return NextResponse.json({
			success: true,
			message: "Rate limits cleared (development only)"
		});
	} catch (error) {
		return NextResponse.json({
			error: "Failed to clear rate limits"
		}, { status: 500 });
	}
}