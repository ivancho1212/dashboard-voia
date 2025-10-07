// utils/permissions.js
export function hasPermission(user, permission) {
  return user?.permissions?.includes(permission);
}

export function hasAnyPermission(user, permissions) {
  if (!Array.isArray(permissions)) return false;
  return permissions.some((perm) => hasPermission(user, perm));
}
