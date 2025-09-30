import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import DefaultLayout from "@/components/site/default-layout";
import { meta } from "@/lib/appConst";

import Fetch from "./fetch";

export const metadata: Metadata = {
	...meta({
		title: "My Account",
	}),
};

export default async function Index() {
	const session = await auth();

	// Account page is accessible to all authenticated users
	if (!session?.user) {
		redirect("/authentication/login");
	}

	const breadcrumb = [
		{
			title: "My Account",
			href: "/account",
		},
	];

	return (
		<DefaultLayout>
			<Fetch
				breadcrumb={breadcrumb}
				email={session?.user?.email}
			/>
		</DefaultLayout>
	);
}