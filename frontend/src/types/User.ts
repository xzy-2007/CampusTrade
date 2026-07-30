export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
  phone?: string;
}