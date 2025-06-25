export interface Notification {
  id?: string;
  title: string;
  body: string;
  image?: string;
  link?: string;
  data?: {[key: string]: string};
  read?: boolean;
  createdAt?: Date | string | number;
  userId?: string;
} 