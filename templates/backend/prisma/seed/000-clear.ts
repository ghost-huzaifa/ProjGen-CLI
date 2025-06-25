import { PrismaClient } from '@prisma/client';

export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  console.log('Clearing existing data...');

  await prisma.userAttribute.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  await prisma.user.deleteMany();

  await prisma.attribute.deleteMany();
}
