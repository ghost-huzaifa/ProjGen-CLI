import { PrismaClient, Permission, PERMISSION_GROUP } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient): Promise<Permission[]> {
  console.log('Seeding permissions...');

  const permsData = [
    {
      name: 'VIEW_DASHBOARD',
      description: 'Permission to view the dashboard',
      permissionGroup: PERMISSION_GROUP.DASHBOARD,
    },
    {
      name: 'VIEW_APPOINTMENTS',
      description: 'Permission to view appointments',
      permissionGroup: PERMISSION_GROUP.APPOINTMENT,
    },
    { name: 'VIEW_PATIENTS', description: 'Permission to view patients', permissionGroup: PERMISSION_GROUP.PATIENT },
    { name: 'VIEW_HUBS', description: 'Permission to view hubs', permissionGroup: PERMISSION_GROUP.HUB },
    { name: 'VIEW_CLINICS', description: 'Permission to view clinics', permissionGroup: PERMISSION_GROUP.CLINIC },
    {
      name: 'VIEW_CONSULTANTS',
      description: 'Permission to view consultants',
      permissionGroup: PERMISSION_GROUP.EMPLOYEE,
    },
    { name: 'VIEW_SETTINGS', description: 'Permission to view settings', permissionGroup: PERMISSION_GROUP.SETTINGS },
    {
      name: 'VIEW_AVAILABILITY',
      description: 'Permission to view availability',
      permissionGroup: PERMISSION_GROUP.AVAILABILITY,
    },
    {
      name: 'VIEW_VIDEO_CONSULTATION',
      description: 'Permission to view video consultations',
      permissionGroup: PERMISSION_GROUP.CONSULTATION,
    },
    { name: 'VIEW_STAFF', description: 'Permission to view staff', permissionGroup: PERMISSION_GROUP.STAFF },
    {
      name: 'VIEW_SOAP_NOTE',
      description: 'Permission to view SOAP notes',
      permissionGroup: PERMISSION_GROUP.CONSULTATION,
    },
  ];

  const permissions = await Promise.all(permsData.map((data) => prisma.permission.create({ data })));

  console.log(`Created ${permissions.length} permissions`);
  return permissions;
}
