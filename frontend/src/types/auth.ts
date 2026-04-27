export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

export type LoginResponse = {
  user: AuthUser;
  token?: string;
};
