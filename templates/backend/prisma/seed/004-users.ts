import { PrismaClient, Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Changed import syntax

async function createAttributeForUser(
  prisma: PrismaClient,
  userId: string,
  name: string,
  value: string,
): Promise<void> {
  let attr = await prisma.attribute.findFirst({ where: { value: name } });
  if (!attr) {
    attr = await prisma.attribute.create({ data: { value: name } });
  }
  await prisma.userAttribute.create({ data: { userId, attributeId: attr.id, value } });
}

export async function seedUsers(prisma: PrismaClient, roles: Role[]): Promise<User[]> {
  console.log('Seeding users...');
  // Initialize unique phone number generator
  let phoneCounter = 1;
  const getPhone = () => `+1253253636${phoneCounter++}`;

  const users: User[] = [];
  const findRole = (name: string) => roles.find((r) => r.name === name)!;

  // Add salt rounds to make sure bcrypt works properly
  const saltRounds = 10;

  // Modify password hashing to use async/await properly
  const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, saltRounds);
  };

  // Super Admin
  const superAdminPwd = await hashPassword('superadmin123');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@clinic.com',
      password: superAdminPwd,
      phoneNumber: getPhone(),
      dateOfBirth: new Date('1970-01-01'),
      gender: 'Unspecified',
      preferredPronouns: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      address: '',
      zip: '',
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      isActive: true,
      roles: { create: { roleId: findRole('SUPER_ADMIN').id } },
    },
  });
  users.push(superAdmin);

  // Clinic Admin
  const adminPwd = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@clinic.com',
      password: adminPwd,
      phoneNumber: getPhone(),
      dateOfBirth: new Date('1970-01-01'),
      gender: 'Unspecified',
      preferredPronouns: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      address: '',
      zip: '',
      firstName: 'Clinic',
      lastName: 'Manager',
      fullName: 'Clinic Manager',
      isActive: true,
      roles: { create: { roleId: findRole('ADMIN').id } },
    },
  });
  users.push(admin);

  // Doctors
  const docPwd = await hashPassword('doctor123');
  const doctorsData = [
    { email: 'dr.smith@clinic.com', firstName: 'John', lastName: 'Smith', spec: 'Cardiology' },
    { email: 'dr.patel@clinic.com', firstName: 'Priya', lastName: 'Patel', spec: 'Pediatrics' },
  ];
  for (const d of doctorsData) {
    const u = await prisma.user.create({
      data: {
        email: d.email,
        password: docPwd,
        phoneNumber: getPhone(),
        dateOfBirth: new Date('1970-01-01'),
        gender: 'Unspecified',
        preferredPronouns: null,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        address: '',
        zip: '',
        firstName: d.firstName,
        lastName: d.lastName,
        fullName: `${d.firstName} ${d.lastName}`,
        isActive: true,
        roles: { create: { roleId: findRole('DOCTOR').id } },
      },
    });
    users.push(u);
    await createAttributeForUser(prisma, u.userId, 'specialization', d.spec);
  }

  // Nurses
  const nursePwd = await hashPassword('nurse123');
  const nursesData = [
    { email: 'nurse.johnson@clinic.com', firstName: 'Sarah', lastName: 'Johnson', dept: 'Emergency' },
    { email: 'nurse.garcia@clinic.com', firstName: 'Miguel', lastName: 'Garcia', dept: 'Pediatrics' },
  ];
  for (const n of nursesData) {
    const u = await prisma.user.create({
      data: {
        email: n.email,
        password: nursePwd,
        phoneNumber: getPhone(),
        dateOfBirth: new Date('1970-01-01'),
        gender: 'Unspecified',
        preferredPronouns: null,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        address: '',
        zip: '',
        firstName: n.firstName,
        lastName: n.lastName,
        fullName: `${n.firstName} ${n.lastName}`,
        isActive: true,
        roles: { create: { roleId: findRole('NURSE').id } },
      },
    });
    users.push(u);
    await createAttributeForUser(prisma, u.userId, 'department', n.dept);
  }

  // Receptionist
  const recPwd = await hashPassword('reception123');
  const rec = await prisma.user.create({
    data: {
      email: 'receptionist@clinic.com',
      password: recPwd,
      phoneNumber: getPhone(),
      dateOfBirth: new Date('1970-01-01'),
      gender: 'Unspecified',
      preferredPronouns: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      address: '',
      zip: '',
      firstName: 'Rebecca',
      lastName: 'Jones',
      fullName: 'Rebecca Jones',
      isActive: true,
      roles: { create: { roleId: findRole('RECEPTIONIST').id } },
    },
  });
  users.push(rec);

  // Patients
  const patPwd = await hashPassword('patient123');
  const patientsData = [
    {
      email: 'patient.williams@example.com',
      firstName: 'Robert',
      lastName: 'Williams',
      birthdate: '1975-06-15',
      bloodType: 'O+',
    },
    { email: 'patient.chen@example.com', firstName: 'Li', lastName: 'Chen', birthdate: '1988-09-22', bloodType: 'B-' },
    {
      email: 'patient.miller@example.com',
      firstName: 'Emma',
      lastName: 'Miller',
      birthdate: '1995-03-10',
      bloodType: 'A+',
    },
    {
      email: 'patient.rodriguez@example.com',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      birthdate: '1980-11-28',
      bloodType: 'AB+',
    },
    {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      birthdate: '1990-01-01',
      bloodType: 'A+',
    },
    {
      email: 'sarah.malik@example.com',
      firstName: 'Sarah',
      lastName: 'Malik',
      birthdate: '1986-06-17',
      bloodType: 'O+',
    },
  ];
  for (const p of patientsData) {
    // Special handling for Sarah Malik to use specific phone number from SOAP report
    const phoneNumber = p.email === 'sarah.malik@example.com' ? '(202) 555-1212' : getPhone();
    const dateOfBirth = p.email === 'sarah.malik@example.com' ? new Date('1986-06-17') : new Date('1970-01-01');
    const gender = p.email === 'sarah.malik@example.com' ? 'Female' : 'Unspecified';

    const u = await prisma.user.create({
      data: {
        email: p.email,
        password: patPwd,
        phoneNumber: phoneNumber,
        dateOfBirth: dateOfBirth,
        gender: gender,
        preferredPronouns: null,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        address: '',
        zip: '',
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`,
        isActive: true,
        roles: { create: { roleId: findRole('PATIENT').id } },
      },
    });
    users.push(u);
    await createAttributeForUser(prisma, u.userId, 'birthdate', p.birthdate);
    await createAttributeForUser(prisma, u.userId, 'bloodType', p.bloodType);
  }

  // Add Ahsan's user for testing with email
  const ahsanPwd = await hashPassword('ahsan123');
  const ahsan = await prisma.user.create({
    data: {
      email: 'piratesunny2030@gmail.com',
      phoneNumber: '923095806478',
      password: ahsanPwd,
      dateOfBirth: new Date('1970-01-01'),
      gender: 'Unspecified',
      preferredPronouns: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      address: '',
      zip: '',
      firstName: 'Ahsan',
      lastName: 'Ali',
      fullName: 'Ahsan Ali',
      isActive: true,
      roles: { create: { roleId: findRole('ADMIN').id } },
    },
  });
  users.push(ahsan);

  console.log('Users seeded');
  return users;
}
