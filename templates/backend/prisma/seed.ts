import { PrismaClient } from '@prisma/client';
import { clearDatabase } from './seed/000-clear';
import { seedRoles } from './seed/001-roles';
import { seedPermissions } from './seed/002-permissions';
import { assignPermissionsToRoles } from './seed/003-assign-permissions';
import { seedUsers } from './seed/004-users';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  await clearDatabase(prisma);
  const roles = await seedRoles(prisma);
  const permissions = await seedPermissions(prisma);
  await assignPermissionsToRoles(prisma, roles, permissions);
  await seedUsers(prisma, roles);
  console.log('Database seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
