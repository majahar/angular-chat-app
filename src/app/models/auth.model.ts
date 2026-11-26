
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: Date | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen?: string | Date | null;
  createdAt?: string;
}

export interface UsersResponse {
  success: boolean;
  message: string;
  count: number;
  users: ChatUser[];
}
