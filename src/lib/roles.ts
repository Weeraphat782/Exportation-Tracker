export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  LAB_ADMIN: 'lab_admin',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export function isStaffOrAdmin(role: string | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.STAFF;
}

export function isLabAdmin(role: string | null | undefined): boolean {
  return role === ROLES.LAB_ADMIN;
}

export function isLabAdminOrAdmin(role: string | null | undefined): boolean {
  return role === ROLES.LAB_ADMIN || role === ROLES.ADMIN;
}

export function isInternalUser(role: string | null | undefined): boolean {
  return isStaffOrAdmin(role) || isLabAdmin(role);
}

export function isCustomer(role: string | null | undefined): boolean {
  return role === ROLES.CUSTOMER;
}

export const LAB_ADMIN_ALLOWED_PREFIX = '/qc';

export function isLabAdminPath(pathname: string | null | undefined): boolean {
  return !!pathname?.startsWith(LAB_ADMIN_ALLOWED_PREFIX);
}
