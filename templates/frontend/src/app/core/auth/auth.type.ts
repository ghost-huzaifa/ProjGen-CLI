import { FormControl } from '@angular/forms';

export interface ValidationData {
  otpId: string;
  isEmail: boolean;
  expiryTime: number;
  otpValidation: boolean;
  credential: string;
}

export interface EmailLoginForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  // rememberMe: FormControl<boolean | null>;
}

export interface PhoneNumberLoginForm {
  phoneNumber: FormControl<string | null>;
  password: FormControl<string | null>;
  // rememberMe: FormControl<boolean | null>;
}

export enum ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
}

export enum PERMISSIONS {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_APPOINTMENTS = 'VIEW_APPOINTMENTS',
  VIEW_PATIENTS = 'VIEW_PATIENTS',
  VIEW_HUBS = 'VIEW_HUBS',
  VIEW_CLINICS = 'VIEW_CLINICS',
  VIEW_CONSULTANTS = 'VIEW_CONSULTANTS',
  VIEW_SETTINGS = 'VIEW_SETTINGS',
  VIEW_AVAILABILITY = 'VIEW_AVAILABILITY',
  VIEW_VIDEO_CONSULTATION = 'VIEW_VIDEO_CONSULTATION',
  VIEW_STAFF = 'VIEW_STAFF',
  VIEW_SOAP_NOTE = 'VIEW_SOAP_NOTE',
}
