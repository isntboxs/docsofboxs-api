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

---

## 🆕 Like/Unlike Feature (NEW)

### Feature Overview

| Method   | Endpoint                  | Auth | Role       | Description   |
| -------- | ------------------------- | ---- | ---------- | ------------- |
| `POST`   | `/api/likes/blog/:blogId` | ✅   | user/admin | Like a blog   |
| `DELETE` | `/api/likes/blog/:blogId` | ✅   | user/admin | Unlike a blog |

### Prisma Model

```prisma
model Like {
  id     String @id @default(cuid())
  userId String
  blogId String
  user User @relation(...)
  blog Blog @relation(...)
  @@unique([userId, blogId])
}
```

---

## 🔴 Critical Bug Fixes (Like/Unlike Feature)

### [ ] BUG-006: Incorrect Comment in Unlike Handler

**File:** `src/handlers/likes/unlike-blog.handler.ts`  
**Lines 59-61:**

```typescript
// Step 3: Use transaction to atomically create like and increment likesCount  // WRONG!
const [unlike, updatedBlog] = await prisma.$transaction([
  // Create the like record  // WRONG! It's a DELETE
  prisma.like.delete({...
```

**Fix:** Update comments to say "delete like and decrement likesCount"

---

### [ ] BUG-007: Unlike Handler Comment Says "Increment" but Code Decrements

**File:** `src/handlers/likes/unlike-blog.handler.ts`  
**Line 87:**

```typescript
// Increment the likesCount on the blog  // WRONG! It decrements
prisma.blog.update({
  data: { likesCount: { decrement: 1 } },  // Correctly decrements
```

**Fix:** Change comment to "Decrement the likesCount on the blog"

---

## 🟡 Medium Bug Fixes (Like/Unlike Feature)

### [ ] BUG-008: Potential Negative likesCount

**File:** `src/handlers/likes/unlike-blog.handler.ts`  
**Issue:** If `likesCount` is already 0 (due to data inconsistency),
decrementing will result in -1.

**Fix Option A:** Add check before decrementing:

```typescript
const blog = await prisma.blog.findUnique({ where: { id: blogId } });
if (blog.likesCount <= 0) {
  // Just delete the like, don't decrement
}
```

**Fix Option B:** Use Prisma's `Math.max` or raw SQL to ensure non-negative:

```typescript
likesCount: {
  decrement: blog.likesCount > 0 ? 1 : 0;
}
```

---

### [ ] BUG-009: Unlike Uses Wrong HTTP Status for "Not Liked"

**File:** `src/handlers/likes/unlike-blog.handler.ts`  
**Line 54:**

```typescript
throw new HTTPException(HttpStatusCodes.CONFLICT, {
  message: 'You have not liked this blog',
});
```

**Issue:** `CONFLICT (409)` is for request conflicts. For "resource not found"
(user hasn't liked), `NOT_FOUND (404)` or `BAD_REQUEST (400)` is more
appropriate.

**Fix:**

```diff
- throw new HTTPException(HttpStatusCodes.CONFLICT, {
+ throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
    message: 'You have not liked this blog',
  });
```

---

## 🟢 Minor Issues (Like/Unlike Feature)

### [ ] ISSUE-005: Unused Include Data in Transaction

**Files:** Both like and unlike handlers  
**Issue:** The `include` clause fetches blog/user data but it's not used in the
response.

```typescript
prisma.like.create({
  data: {...},
  include: {
    blog: { select: {...} },  // Not used
    user: { select: {...} },  // Not used
  },
});
```

**Fix:** Remove unused `include` to improve performance.

---

### [ ] ISSUE-006: No Rate Limiting on Like/Unlike

**Issue:** Users could spam like/unlike requests rapidly.

**Suggestion:** Add rate limiting middleware for `/api/likes/*` routes.

---

## 🔧 Refactoring Tasks (Like/Unlike Feature)

### [ ] REFACTOR-005: Extract Common Blog Existence Check

**Files:** `like-blog.handler.ts`, `unlike-blog.handler.ts`  
**Issue:** Both handlers have duplicate blog existence verification.

**Fix:** Create shared middleware or utility:

```typescript
// src/middlewares/verify-blog-exists.ts
export const verifyBlogExists = factory.createMiddleware(async (c, next) => {
  const blogId = c.req.param('blogId');
  const blog = await c.get('prisma').blog.findUnique({...});
  if (!blog) throw new HTTPException(NOT_FOUND, {...});
  c.set('blog', blog);
  await next();
});
```

---

### [ ] REFACTOR-006: Create LikeType Response Interface

**Create:** `src/types/like.ts`  
**Benefit:** Type consistency for like responses

```typescript
export interface LikeResponse {
  likeCount: number;
}
```

---

## 🆕 Comments Feature (NEW)

### Feature Overview

| Method   | Endpoint                           | Auth | Role       | Description               |
| -------- | ---------------------------------- | ---- | ---------- | ------------------------- |
| `GET`    | `/api/comments/blog/:blogId`       | ✅   | user/admin | Get comments for a blog   |
| `GET`    | `/api/comments/:commentId/replies` | ✅   | user/admin | Get replies for a comment |
| `POST`   | `/api/comments/blog/:blogId`       | ✅   | user/admin | Create a comment          |
| `POST`   | `/api/comments/:commentId/reply`   | ✅   | user/admin | Create a reply            |
| `DELETE` | `/api/comments/:commentId`         | ✅   | user/admin | Delete a comment          |

### Prisma Model

```prisma
model Comment {
  id       String  @id @default(uuid())
  authorId String
  blogId   String
  content  String
  parentId String? // null = top-level comment
  depth    Int     @default(0) // 0 = top-level, 1 = reply, etc.
  // Self-referential relation for nested replies
  parent  Comment?  @relation("CommentReplies", ...)
  replies Comment[] @relation("CommentReplies")
  @@unique([userId, blogId])
}
```

**Features:**

- Nested comments with depth tracking (max depth: 5)
- Cascade delete for replies when parent is deleted
- `commentsCount` sync on Blog model

---

## 🔴 Critical Bug Fixes (Comments Feature)

### [ ] BUG-010: Transaction Uses Wrong Prisma Client

**File:** `src/handlers/comments/create-comment-blog.handler.ts`  
**Lines 39-43:**

```typescript
const newComment = await prisma.$transaction(async (tx) => {
  const blog = await prisma.blog.findUnique({  // WRONG! Uses outer `prisma`
    where: { id: blogId },
  });
```

**Issue:** Inside the transaction callback, the code uses `prisma` instead of
`tx`, which defeats the purpose of the transaction (the blog lookup happens
outside the transaction).

**Fix:**

```diff
const newComment = await prisma.$transaction(async (tx) => {
-  const blog = await prisma.blog.findUnique({
+  const blog = await tx.blog.findUnique({
    where: { id: blogId },
  });
```

---

### [ ] BUG-011: Delete Handler Only Counts Direct Replies

**File:** `src/handlers/comments/delete-comment-blog.handler.ts`  
**Lines 51-55:**

```typescript
const repliesCount = await tx.comment.count({
  where: {
    OR: [{ id: commentId }, { parentId: commentId }], // Only counts 1 level!
  },
});
```

**Issue:** This query only counts the comment itself and its direct children
(depth=1), but NOT deeply nested replies (depth=2+). If a comment has nested
replies beyond depth 1, `commentsCount` will become incorrect.

**Fix:** Use recursive query or count all descendants:

```typescript
// Option A: Count all descendants recursively
async function countAllDescendants(tx, commentId) {
  const directReplies = await tx.comment.findMany({
    where: { parentId: commentId },
    select: { id: true },
  });
  let count = 1; // Include the current comment
  for (const reply of directReplies) {
    count += await countAllDescendants(tx, reply.id);
  }
  return count;
}

// Option B: Since onDelete: Cascade will delete all replies,
// count ALL comments in the cascade chain before delete
```

---

## 🟡 Medium Bug Fixes (Comments Feature)

### [ ] BUG-012: Transaction Uses Wrong Client in create-reply.handler

**File:** `src/handlers/comments/create-reply.handler.ts`  
**Lines 42-46:**

```typescript
const newReply = await prisma.$transaction(async (tx) => {
  const parentComment = await prisma.comment.findUnique({  // WRONG!
    where: { id: commentId },
  });
```

**Issue:** Same as BUG-010 - uses outer `prisma` instead of `tx`.

**Fix:** Change `prisma.comment.findUnique` to `tx.comment.findUnique`

---

### [ ] BUG-013: Potential Negative commentsCount

**Files:** `delete-comment-blog.handler.ts`  
**Issue:** Similar to likesCount, if `commentsCount` is 0 due to data
inconsistency, decrementing will result in negative values.

**Fix:** Add check or use Math.max:

```typescript
await tx.blog.update({
  where: { id: comment.blogId },
  data: {
    commentsCount: {
      decrement: Math.min(repliesCount, blog.commentsCount),
    },
  },
});
```

---

### [ ] BUG-014: Get Replies Handler Returns Wrong Message

**File:** `src/handlers/comments/get-replies-comment.handler.ts`  
**Line 103:**

```typescript
message: 'Comments retrieved successfully',  // Should say "Replies"
```

**Fix:** Change to `'Replies retrieved successfully'`

---

### [ ] BUG-015: No Update Comment Handler

**Files:** Comments handlers  
**Issue:** There's no endpoint to update/edit an existing comment. Users cannot
correct typos or modify their comments.

**Fix:** Create `src/handlers/comments/update-comment.handler.ts` and add route:

```typescript
// PUT /api/comments/:commentId
commentsRoute.put('/:commentId', ...updateCommentHandler);
```

---

## 🟢 Minor Issues (Comments Feature)

### [ ] ISSUE-007: No Content Length Validation for Comments

**Files:** `create-comment-blog.handler.ts`, `create-reply.handler.ts`  
**Issue:** Comment content has no max length validation, allowing extremely long
comments.

**Fix:** Add max length to validation:

```typescript
content: z.string()
  .nonempty({ error: 'Content is required' })
  .max(5000, { error: 'Comment is too long' }),
```

---

### [ ] ISSUE-008: MAX_DEPTH Constant Not Centralized

**File:** `src/handlers/comments/create-reply.handler.ts`  
**Line 15:**

```typescript
const MAX_DEPTH = 5; // Hardcoded locally
```

**Fix:** Move to `src/constants/index.ts`:

```typescript
export const COMMENT_MAX_DEPTH = 5;
```

---

## 🔧 Refactoring Tasks (Comments Feature)

### [ ] REFACTOR-007: Extract Comment Transformation Utility

**Files:** All 4 comment handlers with transformation logic  
**Issue:** Duplicate `transformedComment` mapping in multiple handlers.

**Fix:** Create `src/utils/comment-transformers.ts`:

```typescript
export function transformComment(comment: PrismaComment): Comment { ... }
export function transformComments(comments: PrismaComment[]): Comment[] { ... }
```

---

### [ ] REFACTOR-008: Create Comment Validation Schema

**Files:** `create-comment-blog.handler.ts`, `create-reply.handler.ts`  
**Issue:** Inline Zod schemas are duplicated.

**Fix:** Add to `src/schemas/comment.schema.ts`:

```typescript
export const createCommentSchema = z.object({
  content: z.string().nonempty().max(5000),
});
```

---

### [ ] REFACTOR-009: Extract Comment Existence Middleware

**Files:** Multiple handlers check comment/blog existence.

**Fix:** Create reusable middlewares:

```typescript
// src/middlewares/verify-comment-exists.ts
export const verifyCommentExists = factory.createMiddleware(...)
```
