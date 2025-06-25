import { PrismaClient, Role, Permission } from '@prisma/client';

export async function assignPermissionsToRoles(
  prisma: PrismaClient,
  roles: Role[],
  permissions: Permission[],
): Promise<void> {
  console.log('Assigning permissions to roles...');

  const findByName = <T extends { name: string }>(items: T[], name: string) =>
    items.find((item) => item.name === name)!;

  // SUPER_ADMIN gets all permissions
  const superAdmin = findByName(roles, 'SUPER_ADMIN');
  await Promise.all(
    permissions.map((p) => prisma.rolePermission.create({ data: { roleId: superAdmin.id, permissionId: p.id } })),
  );

  // ADMIN permissions
  const admin = findByName(roles, 'ADMIN');
  const adminPerms = [
    'VIEW_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'VIEW_PATIENTS',
    'VIEW_HUBS',
    'VIEW_CLINICS',
    'VIEW_CONSULTANTS',
    'VIEW_SETTINGS',
    'VIEW_STAFF',
  ];
  await Promise.all(
    adminPerms.map((name) =>
      prisma.rolePermission.create({ data: { roleId: admin.id, permissionId: findByName(permissions, name).id } }),
    ),
  );

  // DOCTOR permissions
  const doctor = findByName(roles, 'DOCTOR');
  const doctorPerms = [
    'VIEW_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'VIEW_PATIENTS',
    'VIEW_VIDEO_CONSULTATION',
    'VIEW_SOAP_NOTE',
    'VIEW_AVAILABILITY',
  ];
  await Promise.all(
    doctorPerms.map((name) =>
      prisma.rolePermission.create({ data: { roleId: doctor.id, permissionId: findByName(permissions, name).id } }),
    ),
  );

  // NURSE permissions
  const nurse = findByName(roles, 'NURSE');
  const nursePerms = [
    'VIEW_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'VIEW_PATIENTS',
    'VIEW_SOAP_NOTE',
  ];
  await Promise.all(
    nursePerms.map((name) =>
      prisma.rolePermission.create({ data: { roleId: nurse.id, permissionId: findByName(permissions, name).id } }),
    ),
  );

  // PATIENT permissions
  const patient = findByName(roles, 'PATIENT');
  const patientPerms = [
    'VIEW_APPOINTMENTS',
    'VIEW_VIDEO_CONSULTATION',
  ];
  await Promise.all(
    patientPerms.map((name) =>
      prisma.rolePermission.create({ data: { roleId: patient.id, permissionId: findByName(permissions, name).id } }),
    ),
  );

  // RECEPTIONIST permissions
  const receptionist = findByName(roles, 'RECEPTIONIST');
  const recPerms = [
    'VIEW_DASHBOARD',
    'VIEW_APPOINTMENTS',
    'VIEW_PATIENTS',
    'VIEW_AVAILABILITY',
  ];
  await Promise.all(
    recPerms.map((name) =>
      prisma.rolePermission.create({
        data: { roleId: receptionist.id, permissionId: findByName(permissions, name).id },
      }),
    ),
  );

  console.log('Permissions assigned to roles');
}
