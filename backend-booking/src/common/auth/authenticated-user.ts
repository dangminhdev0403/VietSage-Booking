export type AuthenticatedUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role?: string;
  permissions?: string[];
  managedPropertyId?: string | null;
};
