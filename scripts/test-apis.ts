import { prisma } from '../src/lib/prisma';
import { updateFacility } from '../src/services/facilityService';
import { updateUser, deleteUser } from '../src/services/userService';

async function main() {
  console.log('Testing APIs...');
  const facility = await prisma.facility.findFirst();
  const user = await prisma.user.findFirst();

  if (facility) {
    try {
      console.log('Testing updateFacility...');
      await updateFacility(facility.id, { name: facility.name + ' Updated' }, '1');
      console.log('updateFacility OK');
    } catch (e) {
      console.error('updateFacility FAILED:', (e as any).message || e);
    }
  }

  if (user) {
    try {
      console.log('Testing updateUser...');
      await updateUser(user.id, { name: user.name + ' Updated' });
      console.log('updateUser OK');
    } catch (e) {
      console.error('updateUser FAILED:', (e as any).message || e);
    }
    
    try {
      console.log('Testing deleteUser...');
      await deleteUser(user.id);
      console.log('deleteUser OK');
    } catch (e) {
      console.error('deleteUser FAILED:', (e as any).message || e);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
