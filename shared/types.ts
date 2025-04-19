export interface User {
  id: string;
  email: string;
  username: string;
  role: 'STUDENT' | 'ADMIN';
  verified: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
} 