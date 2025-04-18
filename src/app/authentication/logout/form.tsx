import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_LOGOUT_REDIRECT, SIGNIN_ERROR_URL } from "@/routes";

export function Form({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
	async function signOutFrm(formData: FormData) {
		"use server";
		try {
			await signOut({
				redirectTo: DEFAULT_LOGOUT_REDIRECT,
			});
		} catch (error) {
			if (error instanceof AuthError) {
				return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
			}
			throw error;
		}
	}

	return (
		<div
			className={cn("flex flex-col gap-6", className)}
			{...props}>
			<Card className="dark:bg-gray-800 w-full max-w-sm rounded-lg border border-gray-300 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Sign out</CardTitle>
					<CardDescription>Sign out from your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={signOutFrm}>
						<div className="grid gap-6">
							<div className="grid gap-6">
								<Button
									type="submit"
									className="w-full">
									Continue to sign out
								</Button>
							</div>
							<div className="text-center text-sm">
								Already have an account?{" "}
								<Link
									className="underline underline-offset-4 cursor-pointer"
									href="/authentication/login">
									Sign in
								</Link>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
				By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/policy">Privacy Policy</Link>.
			</div>
		</div>
	);
}
