export type AuthenticatedUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'HOTEL_PARTNER' | 'TRAVELER';
  permissions: string[];
};
