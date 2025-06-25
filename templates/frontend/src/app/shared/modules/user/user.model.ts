
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type RoleType = keyof typeof RoleType;
import { Type } from "@angular/core";
import { EmployeeType, RoleType } from "../../constants/constants";

export type EmployeeType = keyof typeof EmployeeType;
export interface Profile {
  userId: string;

  patientId?: string;
  guardianId?: string;
  employeeId?: string;
  employeeType?: EmployeeType;
  homeHealthAgencyId?: string;
  isSuperAdmin: boolean;
  roles: { role: RoleType }[];

  showAnonymousData: boolean;
  userSetting: {
    units: {
      weight: 'kg' | 'lb';
      temperature: 'C' | 'F';
    };
  };
}
export interface User {
  userId: string;
  username: string;
  password: string;
  firstName: string;
  image?: string;
  title?: string;
  middleName?: string;
  lastName?: string;
  gender?: Gender;
  birthDate?: number;
  email?: string;
  mobile: string;
  phone?: string;
  nic?: string;
  address1?: string;
  address2?: string;
  zipCode?: string;
  isActivated?: boolean;
  mailVerified?: boolean;
  phoneVerified?: boolean;
  useTwoFactor?: boolean;
  otpSecret?: string;
  emergencyContactPerson?: string;
  emergencyContactPhone?: string;
  userInt?: number;
  userDate?: number;
  serString?: string;
  userFloat?: number;
  isDeleted?: boolean;
  dateCreated: number;
  dateUpdated: number;
  fullName: string;

  profile: Profile;
}



// Type
export interface FormField {
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  class?: string;
  api?: string;
  component?: Type<any>;
  componentData?: any;
  value?: string;
  hint?: string;
  addNewItem?: any;
  isCompositeField?:boolean;
}
export interface LineBreak {
  inlineBlock: boolean;
}
export interface SelectOption {
  value: string,
  label: string,
}



export interface FormConfig {
  title: string;
  fields: (FormField | LineBreak)[];
}

export interface MasterSettingFormsConfig {
  [key: string]: FormConfig;
}