import type { Metadata } from "next";

import { meta } from "@/lib/appConst";

import Fetch from "./[page]/fetch";

export const metadata: Metadata = {
	...meta({
		title: "Attributes",
	}),
};

export default async function Index() {
	const breadcrumb = [
		{
			title: "Attributes",
			href: "/admin/attributes",
		},
	];

	return (
		<div className="mx-auto flex-col flex py-5 w-full px-4 sm:px-6">
			<Fetch title={metadata.title} breadcrumb={breadcrumb} page={1} />
		</div>
	);
}
