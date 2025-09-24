import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { meta } from "@/lib/appConst";

import Fetch from "./[page]/fetch";

export const metadata: Metadata = {
	...meta({
		title: "Products",
	}),
};

export default async function Index() {
	const session = await auth();

	if (!session?.user) {
		redirect("/authentication/login");
	}

	const breadcrumb = [
		{
			title: "Products",
			href: "/admin/products",
		},
	];

	return (
		<div className="mx-auto flex-col flex py-5 w-full px-4 sm:px-6">
			<Fetch title={metadata.title} breadcrumb={breadcrumb} page={1} />
		</div>
	);
}
