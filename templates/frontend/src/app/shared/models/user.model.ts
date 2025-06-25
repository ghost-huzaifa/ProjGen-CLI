export type Permission =
  | 'APPOINTMENT_DELETE'
  | 'OWN_RECORD_READ'
  | 'PATIENT_RECORD_UPDATE'
  | 'USER_READ'
  | 'APPOINTMENT_CREATE'
  | 'PATIENT_RECORD_READ'
  | 'APPOINTMENT_UPDATE'
  | 'USER_CREATE'
  | 'PRESCRIPTION_UPDATE'
  | 'USER_UPDATE'
  | 'ROLE_MANAGE'
  | 'PATIENT_RECORD_CREATE'
  | 'USER_DELETE'
  | 'BILLING_MANAGE'
  | 'PRESCRIPTION_CREATE'
  | 'PRESCRIPTION_READ'
  | 'PATIENT_RECORD_DELETE'
  | 'APPOINTMENT_READ'
  | 'BILLING_READ';

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'PATIENT'
  | 'RECEPTIONIST';

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  roles: Role[];
  permissions: Permission[];
}
