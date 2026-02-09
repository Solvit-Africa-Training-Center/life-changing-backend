import { UserType } from "src/config/constants";

export interface AuthUser {
  id: string;
  email?: string;
  phone: string;
  userType: UserType;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
}