import { type NextRequest, NextResponse } from "next/server";


import { requireModerator } from "@/lib/auth-middleware";
import { auth } from "@/auth";
import { appState } from "@/lib/appConst";

import * as actions from "./actions";

// Create File
async function POST_Handler(req: NextRequest) {
	const session = await auth();
	const { id } = session?.user || {};

	const upload_path = process.env.UPLOAD_PATH || appState.UPLOAD_PATH;
	const upload_dir = process.env.UPLOAD_DIR || appState.UPLOAD_DIR;
	const r2 = process.env.ENABLE_R2;

	try {
		const formData = await req.formData();
		const files = formData
			.getAll("file")
			.filter((item): item is File => item instanceof File);
		const db = [];

		for (const file of files) {
			if (file instanceof File) {
				const fileName = file.name.replaceAll(" ", "_");
				const randomString = Math.random().toString(36).substring(2, 15);
				const fileHash = actions.generateHash(fileName + randomString);
				const fileBuffer = Buffer.from(await file.arrayBuffer());
				const fileSize = file.size;
				const fileSizeInMB = fileSize / (1024 * 1024);
				const fileExtension = fileName.split(".").pop() || "";
				const fileType = file.type;
				const fileMimeType = fileType || "application/octet-stream";

				const maxFileSize = Number(process.env.MAX_FILE_SIZE || 0);
				if (fileSizeInMB > maxFileSize) {
					return NextResponse.json(
						{ message: `File size exceeds ${maxFileSize / (1024 * 1024)}MB` },
						{ status: 400 },
					);
				}
				if (!file) {
					return NextResponse.json(
						{ message: "File not found" },
						{ status: 400 },
					);
				}
				if (!fileName) {
					return NextResponse.json(
						{ message: "Invalid file" },
						{ status: 400 },
					);
				}
				if (!fileBuffer) {
					return NextResponse.json(
						{ message: "Invalid file data" },
						{ status: 400 },
					);
				}

				if (r2 === "true" || r2 === "1") {
					if (!id) {
						return NextResponse.json(
							{ message: "User ID is required" },
							{ status: 400 },
						);
					}
					const item = await actions.upload(
						upload_dir,
						fileHash,
						fileExtension,
						fileBuffer,
						fileSize,
						fileMimeType,
						fileName,
						id,
					);

					if (item) {
						db.push(item);
					} else {
						return NextResponse.json(
							{ message: "Can not upload the file" },
							{ status: 500 },
						);
					}
				} else {
					if (!id) {
						return NextResponse.json(
							{ message: "User ID is required" },
							{ status: 400 },
						);
					}
					const item = await actions.uploadSave(
						upload_path,
						fileHash,
						fileExtension,
						fileBuffer,
						fileName,
						id,
						fileMimeType,
						fileSize,
						upload_dir,
					);

					if (item) {
						db.push(item);
					} else {
						return NextResponse.json(
							{ message: "Can not upload the file" },
							{ status: 500 },
						);
					}
				}
			}
		}

		if (db.length === 0) {
			return NextResponse.json(
				{ message: "Can not upload the file" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			message: "File uploaded successfully",
			data: db,
			success: "success",
		});
	} catch (error) {
		return NextResponse.json(
			{ message: "Error uploading file" },
			{ status: 500 },
		);
	}
}

export const POST = requireModerator()(POST_Handler);
