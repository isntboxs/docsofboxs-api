# DocsOfBoxs API - Bug Fixes & Refactoring TODO

Priority: 🔴 Critical | 🟡 Medium | 🟢 Low

---

## 🔴 Critical Bug Fixes

### [ ] BUG-001: Fix CORS Missing Methods

**File:** `src/lib/create-app.ts`  
**Fix:** Add `PUT`, `DELETE`, `PATCH` to `allowMethods`

```diff
cors({
-  allowMethods: ['POST', 'GET', 'OPTIONS'],
+  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
})
```

---

### [ ] BUG-002: Remove Redundant Permission Check in Delete Handler

**File:** `src/handlers/blogs/delete-blog-by-id.handler.ts`  
**Fix:** Remove the `auth.api.userHasPermission` call since
`requireRole(['admin'])` already ensures admin access with delete permissions
defined in `permission.ts`.

---

## 🟡 Medium Bug Fixes

### [ ] BUG-003: Fix Update Handler Admin Ownership Logic

**File:** `src/handlers/blogs/update-blog.handler.ts`  
**Fix:** Allow admins to update any blog OR only require ownership for non-admin
users.

```typescript
// Option A: Allow admins to update any blog
if (user.role !== UserRole.admin && existingBlog.authorId !== user.id) {
  throw new HTTPException(HttpStatusCodes.FORBIDDEN, {...});
}

// Option B: Remove role check and only require ownership
// Change requireRole(['admin']) to requireRole(['user', 'admin'])
```

---

### [ ] BUG-004: Fix Get Blog By Slug Auth Requirement

**File:** `src/handlers/blogs/get-blog-by-slug.handler.ts`  
**Decision Required:**

- **If should be public:** Remove `requireAuth` and `requireRole` middlewares
- **If should require auth:** Update comment in `blogs.route.ts` to say
  "private"

---

### [ ] BUG-005: Fix Error Code in requireRole Middleware

**File:** `src/middlewares/auth.ts`  
**Fix:**

```diff
if (!user) {
-  throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
+  throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
    message: 'User not found',
  });
}
```

---

## 🟢 Minor Fixes

### [ ] ISSUE-001: Fix TypeScript Any in Route Registration

**File:** `src/routes/index.ts`  
**Fix:** Type the function properly to remove `any`

---

### [ ] ISSUE-002: Remove Unused ESLint Disable

**File:** `src/utils/slug-helpers.ts`  
**Fix:** Delete line 1: `/* eslint-disable no-unused-vars */`

---

### [ ] ISSUE-003: Add Content Validation to Blog Schema

**File:** `src/schemas/blog.schema.ts`  
**Fix:** Add max length and sanitization

```typescript
content: z.string()
  .nonempty({ error: 'Content is required' })
  .max(50000, { error: 'Content is too long' }),
```

---

### [ ] ISSUE-004: Fix ApiErrorResponse Type

**File:** `src/types/api-response.ts`  
**Fix:**

```diff
export interface ApiErrorResponse {
-  success: boolean;
+  success: false;
  error?: ApiErrorDetail;
}
```

---

## 🔧 Refactoring Tasks

### [ ] REFACTOR-001: Extract Blog Transformation Utility

**Create:** `src/utils/blog-transformers.ts`  
**Benefit:** DRY code across 5 handlers

---

### [ ] REFACTOR-002: Create Handler Error Wrapper

**Create:** `src/lib/handler-utils.ts`  
**Benefit:** Remove duplicated try-catch blocks in all handlers

---

### [ ] REFACTOR-003: Centralize Permission Middleware

**Create:** Permission middleware factories in
`src/middlewares/permissions.ts`  
**Benefit:** Reusable permission checks

---

### [ ] REFACTOR-004: Simplify Types Using Prisma Inference

**Modify:** `src/types/blog.ts`  
**Benefit:** Auto-sync with Prisma schema changes

---

## 📝 Documentation Updates

### [ ] Add README.md

- Project setup instructions
- Environment variables documentation
- API endpoints documentation

### [ ] Add CONTRIBUTING.md

- Code style guidelines
- PR process
