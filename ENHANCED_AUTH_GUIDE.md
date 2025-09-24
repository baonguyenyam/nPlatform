# Enhanced Authentication System - Usage Guide

## 📚 Tổng quan

Hệ thống authentication đã được nâng cấp với các tính năng:
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Auto Sync**: Tự động đồng bộ NextAuth với Redux
- ✅ **Session Management**: Quản lý session với expiry
- ✅ **Permission System**: Hệ thống phân quyền chi tiết  
- ✅ **Rate Limiting**: Bảo vệ khỏi brute force attacks
- ✅ **Enhanced Security**: Improved validation và error handling
- ✅ **Route Protection**: Component-based route protection
- ✅ **Server Utilities**: Server-side auth helpers

## 🚀 Cách sử dụng

### 1. Basic Authentication

```tsx
import { useAuth } from "@/hooks/auth";

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout,
    getDisplayName,
    error 
  } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isAuthenticated) return <div>Please login</div>;
  
  return (
    <div>
      <h1>Welcome, {getDisplayName()}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 2. Permission Checking

```tsx
import { usePermissions } from "@/hooks/auth";

function AdminPanel() {
  const { 
    hasAdminAccess, 
    isAdmin, 
    checkPermission,
    canManageUsers 
  } = usePermissions();
  
  if (!hasAdminAccess()) {
    return <div>Access denied</div>;
  }
  
  return (
    <div>
      {isAdmin() && <AdminOnlyFeature />}
      {checkPermission("DELETE_POSTS") && <DeleteButton />}
      {canManageUsers() && <UserManagement />}
    </div>
  );
}
```

### 3. Route Protection

#### Client-side Protection:
```tsx
import { RouteProtection } from "@/components/auth/RouteProtection";

function AdminPage() {
  return (
    <RouteProtection 
      roles={["ADMIN"]}
      fallbackUrl="/unauthorized"
      requireEmailVerification={true}
    >
      <AdminDashboard />
    </RouteProtection>
  );
}

// Hoặc sử dụng HOC
const ProtectedAdminPage = withRouteProtection(AdminDashboard, {
  roles: ["ADMIN"],
  permissions: ["MANAGE_USERS"],
  requireAll: false
});
```

#### Conditional Rendering:
```tsx
import { PermissionGate, AdminOnly, AuthOnly } from "@/components/auth/RouteProtection";

function MyComponent() {
  return (
    <div>
      <AuthOnly>
        <p>Only logged-in users see this</p>
      </AuthOnly>
      
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>
      
      <PermissionGate 
        permissions={["EDIT_POSTS"]} 
        fallback={<div>No permission</div>}
      >
        <EditButton />
      </PermissionGate>
    </div>
  );
}
```

### 4. Server-side Authentication

```tsx
// In server components or API routes
import { 
  getCurrentUser, 
  requireAuth, 
  hasPermission,
  requireRole 
} from "@/lib/auth-utils";

// Server Component
async function ServerComponent() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Please login</div>;
  }
  
  const canManageUsers = await hasPermission("MANAGE_USERS");
  
  return (
    <div>
      <h1>Hello {user.name}</h1>
      {canManageUsers && <AdminFeature />}
    </div>
  );
}

// API Route
export async function GET() {
  try {
    const user = await requireRole("ADMIN");
    // Admin-only logic here
    return Response.json({ data: "admin data" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 403 });
  }
}
```

### 5. API Route Protection

```tsx
import { withApiAuthorization } from "@/lib/enhanced-auth-middleware";

export const GET = withApiAuthorization({
  roles: ["ADMIN"],
  permissions: ["MANAGE_USERS"],
  requireEmailVerification: true
})(async (req, context) => {
  // User context is available as req.userContext
  const user = (req as any).userContext;
  
  return Response.json({ 
    message: `Hello ${user.name}`,
    role: user.role 
  });
});
```

### 6. Enhanced Logout

```tsx
import { useAuth } from "@/hooks/auth";

function LogoutButton() {
  const { logout, isLoading } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled automatically
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <button 
      onClick={handleLogout} 
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Logout"}
    </button>
  );
}
```

## 🔧 Configuration

### Environment Variables

```env
# Required
AUTH_SECRET=your-secret-key
DATABASE_URL=your-database-url
PUBLIC_SITE_URL=http://localhost:3000

# OAuth providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional
JWT_SECRET=your-jwt-secret-for-custom-tokens
AUTH_DEBUG=true # Enable debug logging
```

### Permission System

Định nghĩa permissions trong database:
```json
{
  "permissions": [
    "READ_POSTS",
    "WRITE_POSTS", 
    "DELETE_POSTS",
    "MANAGE_USERS",
    "MANAGE_ORDERS",
    "VIEW_ANALYTICS"
  ]
}
```

## 📁 File Structure

```
src/
├── hooks/
│   └── auth/
│       ├── index.ts              # Export all hooks
│       ├── useAuth.ts            # Main auth hook
│       └── useAuthSync.ts        # Auto-sync logic
├── components/
│   └── auth/
│       └── RouteProtection.tsx   # Route protection components
├── lib/
│   ├── auth-utils.ts             # Server-side utilities
│   └── enhanced-auth-middleware.ts # Advanced middleware
├── store/
│   ├── authSlice.ts              # Enhanced Redux slice
│   └── index.ts                  # Store configuration
├── auth.config.ts                # NextAuth configuration
├── auth.ts                       # Main auth setup
└── middleware.ts                 # Route middleware
```

## 🔒 Security Features

### 1. Rate Limiting
- Automatic protection against brute force attacks
- 5 attempts per 15 minutes per IP
- Configurable limits

### 2. Input Validation
- Zod schema validation for all inputs
- Sanitization of email addresses
- Password strength checking

### 3. Session Security
- JWT tokens with expiration
- Secure cookie settings
- Session invalidation on logout

### 4. Error Handling
- Consistent error messages to prevent user enumeration
- Detailed logging for security monitoring
- Graceful fallbacks for failed authentication

## 🎯 Best Practices

### 1. Always Use Hooks
```tsx
// ❌ Avoid direct session access
import { useSession } from "next-auth/react";

// ✅ Use enhanced hooks
import { useAuth, usePermissions } from "@/hooks/auth";
```

### 2. Server-side Checks
```tsx
// ❌ Don't rely only on client-side protection
function AdminPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin()) return null;
  return <AdminPanel />;
}

// ✅ Always verify on server-side too
async function AdminPage() {
  const user = await requireRole("ADMIN");
  return <AdminPanel user={user} />;
}
```

### 3. Progressive Enhancement
```tsx
// ✅ Handle all states properly
function MyComponent() {
  const { isAuthenticated, isLoading, error } = useAuth();
  
  if (error) return <ErrorState error={error} />;
  if (isLoading) return <LoadingState />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <AuthenticatedContent />;
}
```

## 🚨 Migration từ hệ thống cũ

### 1. Update imports
```tsx
// ❌ Old
import { useAppSelector } from "@/store";
const user = useAppSelector(state => state.authState.user);

// ✅ New
import { useAuth } from "@/hooks/auth";
const { user } = useAuth();
```

### 2. Update Redux actions
```tsx
// ❌ Old manual dispatch
dispatch(SET_ACTIVE_USER(userData));

// ✅ New automatic sync
// No manual dispatch needed! useAuthSync handles it
```

### 3. Update permission checks
```tsx
// ❌ Old
const hasPermission = user?.permissions?.includes("MANAGE_USERS");

// ✅ New
const { checkPermission } = usePermissions();
const hasPermission = checkPermission("MANAGE_USERS");
```

## 🐛 Troubleshooting

### Common Issues:

1. **Session không sync**
   - Đảm bảo `AuthProvider` wrap toàn bộ app
   - Check console logs cho sync errors

2. **Permission không hoạt động**
   - Verify user có permissions trong database
   - Check permissions format (array of strings)

3. **Rate limiting quá strict**
   - Adjust MAX_ATTEMPTS in signin API
   - Clear rate limit cache: restart server

4. **TypeScript errors**
   - Update `next-auth.d.ts` với custom user fields
   - Ensure all imports đúng path

## 📖 API Reference

### Hooks
- `useAuth()` - Main authentication hook
- `usePermissions()` - Permission checking hook  
- `useAuthSync()` - Auto-sync hook (internal)

### Components
- `<RouteProtection>` - Route protection wrapper
- `<PermissionGate>` - Conditional rendering
- `<AdminOnly>` - Admin-only wrapper
- `<AuthOnly>` - Auth-required wrapper

### Server Utilities
- `getCurrentUser()` - Get current user
- `requireAuth()` - Require authentication
- `requireRole()` - Require specific role
- `hasPermission()` - Check permissions
- `withApiAuthorization()` - API protection HOC

### Redux Actions
- `syncFromNextAuth()` - Sync session data
- `setAuthLoading()` - Set loading state
- `updateUserProfile()` - Update user info
- `removeActiveUser()` - Clear auth state

---

## 💡 Tips & Advanced Usage

### Custom Permission System
```tsx
// Tạo custom permission checker
const useCustomPermissions = () => {
  const { checkPermission } = usePermissions();
  
  return {
    canEditPost: (postId: string) => {
      // Custom logic combining permissions and ownership
      return checkPermission("EDIT_POSTS") || checkPermission(`EDIT_POST_${postId}`);
    }
  };
};
```

### Conditional API Routes
```tsx
// Dynamic permission based on resource
export const DELETE = withApiAuthorization({
  permissions: ["DELETE_POSTS"]
})(async (req, { params }) => {
  const postId = params.id;
  const user = (req as any).userContext;
  
  // Additional checks
  const post = await getPost(postId);
  if (post.authorId !== user.id && user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  
  await deletePost(postId);
  return Response.json({ success: true });
});
```