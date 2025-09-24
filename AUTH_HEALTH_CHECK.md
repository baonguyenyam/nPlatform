# 🔍 Authentication System Health Check

## ✅ Checklist để kiểm tra hệ thống login

### 1. **Database & User Model**
- [ ] Database connection hoạt động
- [ ] User table có đầy đủ fields: id, email, password, role, permissions, published, emailVerified
- [ ] Password được hash với bcrypt
- [ ] Có test users trong database

### 2. **Environment Variables**
- [ ] `AUTH_SECRET` được set
- [ ] `DATABASE_URL` đúng
- [ ] `PUBLIC_SITE_URL` đúng (quan trọng cho API endpoint)
- [ ] OAuth credentials (nếu dùng GitHub/Google)

### 3. **API Endpoints**
- [ ] `/api/auth/signin` hoạt động
- [ ] `/api/auth/[...nextauth]` hoạt động
- [ ] Rate limiting working (test với 6+ attempts)
- [ ] Error messages consistent

### 4. **NextAuth Configuration**
- [ ] `auth.config.ts` được setup đúng
- [ ] `auth.ts` có đầy đủ callbacks
- [ ] Session strategy = "jwt"
- [ ] Custom pages được set

### 5. **Redux Integration**
- [ ] AuthSlice được add vào store
- [ ] AuthProvider wrap toàn bộ app
- [ ] useAuthSync hoạt động
- [ ] State persistence working

### 6. **Hooks & Components**
- [ ] `useAuth()` return đúng data
- [ ] `usePermissions()` check đúng
- [ ] Session expiry working
- [ ] Auto logout khi session invalid

## 🧪 Test Cases

### Test Login Flow:
1. **Valid credentials** → Should login successfully
2. **Invalid email** → Should show "Invalid email or password"
3. **Invalid password** → Should show "Invalid email or password"  
4. **Non-existent user** → Should show "Invalid email or password"
5. **Inactive account** → Should show "Account is not active"
6. **Unverified email** → Should show "Please verify your email"
7. **Rate limiting** → Should block after 5 failed attempts

### Test Session Management:
1. **Session persistence** → Refresh page, should stay logged in
2. **Session expiry** → Should auto logout after 24h
3. **Logout** → Should clear both NextAuth session và Redux state
4. **Permission checking** → Should work correctly

## 🔧 Common Issues & Solutions

### Issue 1: Login không hoạt động
**Symptoms**: Login form submit nhưng không redirect hoặc error
**Check**:
- Console errors
- Network tab trong DevTools  
- API response từ `/api/auth/signin`
- Database connection

### Issue 2: Session không persist
**Symptoms**: Refresh page thì logout
**Check**:
- AuthProvider có wrap app không
- Redux persist configuration
- Next.js cookies

### Issue 3: Permissions không work
**Symptoms**: hasPermission() return false dù user có permission
**Check**:
- Database permissions field format (JSON array)
- Permission parsing trong API
- Redux state có đúng permissions không

### Issue 4: Rate limiting quá strict
**Symptoms**: Bị block ngay khi test
**Check**:
- Clear server memory (restart)
- Adjust MAX_ATTEMPTS
- Check IP detection

## 📊 Performance Considerations

1. **Database Queries**:
   - User lookup should be indexed on email
   - Consider caching for frequent queries
   - Avoid N+1 queries

2. **Session Management**:
   - JWT tokens are stateless
   - Redis for production rate limiting
   - Session cleanup for expired tokens

3. **Client-Side**:
   - Minimize re-renders with proper selectors
   - Lazy load auth components
   - Efficient permission checking

## 🚀 Production Readiness

### Security Checklist:
- [ ] HTTPS enforced
- [ ] Secure cookies in production
- [ ] Rate limiting với Redis
- [ ] Password strength validation
- [ ] Brute force protection
- [ ] Audit logging
- [ ] Error monitoring

### Monitoring:
- [ ] Login success/failure rates
- [ ] Session duration analytics
- [ ] Failed attempt alerts
- [ ] Performance metrics

## 🐛 Debug Tools

1. **Auth Test Page**: `/auth-test`
   - Shows current auth state
   - Test login/logout
   - Permission checking
   - Raw data inspection

2. **Console Logging**:
   ```javascript
   // Enable debug mode
   AUTH_DEBUG=true
   ```

3. **Redux DevTools**:
   - Monitor auth state changes
   - Time travel debugging
   - Action replay

## 📝 Testing Script

```bash
# 1. Test API endpoint directly
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo"}'

# 2. Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# 3. Check database
# Connect to your database and verify:
# - Users exist
# - Passwords are hashed
# - Permissions are JSON arrays
```