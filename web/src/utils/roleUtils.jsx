/**
 * Utility functions for role-based access control in Komunas App.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER'
};

/**
 * Checks if a user has the SUPER_ADMIN role
 */
export const isSuperAdmin = (user) => {
  return user?.roles?.includes(ROLES.SUPER_ADMIN);
};

/**
 * Checks if a user has the ADMIN role or SUPER_ADMIN role
 */
export const isAdmin = (user) => {
  return user?.roles?.includes(ROLES.ADMIN) || isSuperAdmin(user);
};
