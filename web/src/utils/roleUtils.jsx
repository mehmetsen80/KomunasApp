/**
 * Utility functions for role-based access control in Komunas App.
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
  GATEWAY_ADMIN: 'gateway_admin',
  GATEWAY_ADMIN_REALM: 'gateway_admin_realm'
};

/**
 * Checks if a user has the SUPER_ADMIN role
 */
export const isSuperAdmin = (user) => {
  return user?.roles?.includes(ROLES.SUPER_ADMIN);
};

/**
 * Checks if a user has the ADMIN or SUPER_ADMIN role
 */
export const isAdmin = (user) => {
  return user?.roles?.includes(ROLES.ADMIN) || isSuperAdmin(user);
};
