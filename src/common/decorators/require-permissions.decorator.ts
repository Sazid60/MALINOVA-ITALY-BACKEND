import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const ANY_PERMISSIONS_KEY = 'any_permissions';

/**
 * Route decorator — একটা বা একাধিক permission code দাও।
 * সব গুলো থাকতে হবে (AND logic)।
 *
 * @example
 * @RequirePermissions('orders.view')
 * @RequirePermissions('orders.view', 'inventory.edit')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Route decorator — একটা বা একাধিক permission code দাও।
 * যেকোনো একটা থাকলেই হবে (OR logic)।
 *
 * @example
 * @RequireAnyPermissions('orders.view', 'inventory.edit')
 */
export const RequireAnyPermissions = (...permissions: string[]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, permissions);