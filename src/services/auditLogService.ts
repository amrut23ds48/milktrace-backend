import { prisma } from '../lib/prisma';

export async function logAction(
  entityType: string, 
  entityId: string, 
  action: string, 
  oldValues?: any, 
  newValues?: any, 
  actorUserId?: string
) {
  return await prisma.auditLog.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      actor_user_id: actorUserId
    }
  });
}
