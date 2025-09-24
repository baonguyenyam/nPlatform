import AuthDebugPanel from "@/components/auth/AuthDebugPanel";
import LoginTestComponent from "@/components/auth/LoginTestComponent";
import { SystemHealthCheck } from "@/components/auth/SystemHealthCheck";

export default function AuthTestPage() {
	return (
		<div className="container mx-auto py-8 space-y-8">
			<div className="text-center">
				<h1 className="text-3xl font-bold mb-2">🔐 Authentication Test</h1>
				<p className="text-muted-foreground">
					Test and debug your authentication system
				</p>
			</div>

			{/* System Health Check First */}
			<SystemHealthCheck />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<LoginTestComponent />
				<AuthDebugPanel />
			</div>
		</div>
	);
}