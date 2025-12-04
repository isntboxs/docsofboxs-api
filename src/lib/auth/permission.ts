import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements, userAc } from 'better-auth/plugins/admin/access';

import { UserRole } from '@/generated/prisma/enums';

const statement = {
  ...defaultStatements,
  blogs: ['create', 'read', 'update', 'delete', 'read:draft'],
} as const;

const ac = createAccessControl(statement);

const roles = {
  [UserRole.admin]: ac.newRole({
    ...adminAc.statements,
    blogs: ['create', 'read', 'update', 'delete', 'read:draft'],
  }),

  [UserRole.user]: ac.newRole({
    ...userAc.statements,
    blogs: ['read'],
  }),
};

export { ac, roles };
