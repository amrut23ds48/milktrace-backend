import { prisma } from '../lib/prisma';
import { Role, Permission } from '../generated/prisma/client';

export async function findAllRoles(): Promise<Role[]> {
  return prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });
}

export async function findAllPermissions(): Promise<Permission[]> {
  return prisma.permission.findMany({
    orderBy: { category: 'asc' },
  });
}

export async function createRole(data: { name: string; description: string; organization_id?: string; permission_ids?: string[] }): Promise<Role> {
  let orgId = data.organization_id || '1';
  if (orgId === '1' || !orgId.includes('-')) {
    const org = await prisma.organization.findFirst();
    if (org) orgId = org.id;
  }

  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description,
      is_system_role: false,
      organization_id: orgId,
      permissions: {
        create: (data.permission_ids || []).map(id => ({
          permission_id: id
        }))
      }
    }
  });
}
