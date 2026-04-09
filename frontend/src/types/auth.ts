export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  user: AuthUser;
  token?: string;
};
