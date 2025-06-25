import { PrismaClient, Role } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient): Promise<Role[]> {
  console.log('Seeding roles...');

  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'SUPER_ADMIN', description: 'Super Administrator with full access' } }),
    prisma.role.create({ data: { name: 'ADMIN', description: 'Clinic Administrator with management access' } }),
    prisma.role.create({
      data: { name: 'DOCTOR', description: 'Medical professional who can diagnose and prescribe' },
    }),
    prisma.role.create({ data: { name: 'NURSE', description: 'Healthcare provider with limited medical access' } }),
    prisma.role.create({ data: { name: 'PATIENT', description: 'Patient with access to their own records' } }),
    prisma.role.create({ data: { name: 'RECEPTIONIST', description: 'Staff member who manages appointments' } }),
  ]);

  console.log(`Created ${roles.length} roles`);
  return roles;
}
