import { prisma } from '../lib/prisma';

export async function logAction(
  entityType: string, 
  entityId: string, 
  action: string, 
  oldValues?: any, 
  newValues?: any, 
  actorUserId?: string
) {
  let validActorId = actorUserId;
  if (actorUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorUserId)) {
    const user = await prisma.user.findFirst();
    validActorId = user?.id;
  }

  return await prisma.auditLog.create({
    data: {
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      actor_user_id: validActorId
    }
  });
}
