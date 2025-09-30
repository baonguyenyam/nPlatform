"use client";

import { cache, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import AppLoading from "@/components/AppLoading";
import BreadcrumbBar from "@/components/public/BreadcrumbBar";
import Title from "@/components/public/Title";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import * as actions from "./actions";

// Memoized form schema to prevent recreation on each render
const FormSchema = z.object({
	first_name: z
		.string()
		.min(2, { message: "First name must be at least 2 characters." }),
	last_name: z
		.string()
		.min(2, { message: "Last name must be at least 2 characters." }),
	address: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	country: z.string().optional(),
	zip: z.string().optional(),
	phone: z.string().optional(),
	username: z.string().optional(),
});

// Memoized user info header component
const UserInfoHeader = memo(({ userData }: { userData: any }) => (
	<div className="flex items-center space-x-4 p-6 bg-card rounded-lg border">
		<Avatar className="h-16 w-16">
			<AvatarImage src={userData?.avatar || userData?.image} alt={userData?.name} />
			<AvatarFallback className="text-lg">
				{userData?.first_name?.[0]}{userData?.last_name?.[0]}
			</AvatarFallback>
		</Avatar>
		<div>
			<h2 className="text-xl font-semibold">{userData?.name || `${userData?.first_name} ${userData?.last_name}`}</h2>
			<p className="text-muted-foreground">{userData?.email}</p>
			<p className="text-sm text-muted-foreground">Role: {userData?.role}</p>
		</div>
	</div>
));

UserInfoHeader.displayName = "UserInfoHeader";

function FetchComponent(props: any) {
	const { breadcrumb, email } = props;
	const [db, setDb] = useState<any>([]);
	const [loading, setLoading] = useState(true);
	// Memoize default form values
	const defaultValues = useMemo(() => ({
		first_name: "",
		last_name: "",
		address: "",
		city: "",
		state: "",
		country: "",
		zip: "",
		phone: "",
		username: "",
	}), []);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues,
	});

	const fetchUserData = useCallback(async () => {
		if (!email) return;

		const getUserData = cache(async () => {
			try {
				const res = await actions.getAll(email);
				return res;
			} catch (error) {
				console.error("Error fetching user data:", error);
				return { success: "error", message: "Failed to load user data" };
			}
		});

		setLoading(true);
		const result = await getUserData();

		if (result.success === "success") {
			setDb(result.data);
			form.reset({
				first_name: result?.data?.first_name || "",
				last_name: result?.data?.last_name || "",
				address: result?.data?.address || "",
				city: result?.data?.city || "",
				state: result?.data?.state || "",
				country: result?.data?.country || "",
				zip: result?.data?.zip || "",
				phone: result?.data?.phone || "",
				username: result?.data?.id || "",
			});
		} else {
			toast.error(result.message);
		}

		setLoading(false);
	}, [email, form]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	const onSubmit = useCallback(async (values: z.infer<typeof FormSchema>) => {
		try {
			setLoading(true);

			// Check username availability if it's different from current
			if (values.username && values.username !== db.id) {
				const checkId = await actions.checkId(values.username || "");
				if (checkId.success !== "success") {
					toast.error(checkId.message);
					return;
				}
			}

			// Prepare data for update
			const updateData = {
				...values,
				published: true,
			};

			const result = await actions.updateRecord(updateData);
			if (result.success === "success") {
				toast.success(result.message);
				fetchUserData(); // Refresh data
			} else {
				toast.error(result.message);
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("Failed to update profile");
		} finally {
			setLoading(false);
		}
	}, [db.id, fetchUserData]);

	return (
		<>
			<div className="mx-auto p-5 dark:bg-gray-800 dark:text-white w-full">
				<div className="my-5 flex flex-col justify-between items-center space-y-1">
					<Title data="My Account" breadcrumb={breadcrumb} className="" />
					<BreadcrumbBar />
				</div>
			</div>
			{loading && (
				<div className="flex h-screen w-full p-5">
					<AppLoading />
				</div>
			)}
			{!loading && (
				<div className="mx-auto max-w-4xl p-5 space-y-6">
					{/* User Info Header */}
					<UserInfoHeader userData={db} />			{/* Profile Form */}
					<div className="bg-card p-6 rounded-lg border">
						<h3 className="text-lg font-medium mb-4">Profile Information</h3>
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="first_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>First Name</FormLabel>
												<FormControl>
													<Input placeholder="Enter your first name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="last_name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Last Name</FormLabel>
												<FormControl>
													<Input placeholder="Enter your last name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Username</FormLabel>
											<FormControl>
												<Input placeholder="Enter your username" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone Number</FormLabel>
											<FormControl>
												<Input placeholder="Enter your phone number" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="address"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Address</FormLabel>
											<FormControl>
												<Input placeholder="Enter your address" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="City" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="state"
										render={({ field }) => (
											<FormItem>
												<FormLabel>State</FormLabel>
												<FormControl>
													<Input placeholder="State" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="zip"
										render={({ field }) => (
											<FormItem>
												<FormLabel>ZIP Code</FormLabel>
												<FormControl>
													<Input placeholder="ZIP" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="country"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Country</FormLabel>
											<FormControl>
												<Input placeholder="Enter your country" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex justify-end pt-4">
									<Button type="submit" disabled={loading}>
										{loading ? "Updating..." : "Update Profile"}
									</Button>
								</div>
							</form>
						</Form>
					</div>
				</div>
			)}
		</>
	);
}

// Export memoized component for better performance
export default memo(FetchComponent);