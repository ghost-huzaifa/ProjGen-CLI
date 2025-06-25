import { User } from './user.model';

export interface LoginPayload {
  isEmail: boolean;
  credential: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user?: User;
}

export interface TokenData {
  accessToken: string;
}
