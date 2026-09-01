import { findAllRoles, createRole as repoCreateRole, findAllPermissions } from '../repositories/roleRepository';
import { Role, Permission } from '../generated/prisma/client';

export async function getRoles(): Promise<Role[]> {
  return findAllRoles();
}

export async function createRole(data: any): Promise<Role> {
  return repoCreateRole(data);
}

export async function getPermissions(): Promise<Permission[]> {
  return findAllPermissions();
}
