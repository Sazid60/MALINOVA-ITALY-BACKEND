import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY, ANY_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RolePermission } from '../../roles/role-permission.entity';
import { UserPermission } from '../../users/user-permission.entity';

interface CacheEntry {
  perms: Set<string>;
  expiresAt: number;
}

/** TTL for in-process permission cache (milliseconds). 
 *  Keeps DB queries to 0 on repeated calls within this window.
 *  5 minutes is highly optimized and safe since we have explicit cache invalidation. */
const CACHE_TTL_MS = 300_000;

@Injectable()
export class PermissionsGuard implements CanActivate {
  private static readonly permCache = new Map<string, CacheEntry>();
  private static readonly inFlightRequests = new Map<string, Promise<Set<string>>>();

  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private userPermRepo: Repository<UserPermission>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ১. Route এ কোনো permission দরকার কিনা চেক করো
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredAny = this.reflector.getAllAndOverride<string[]>(ANY_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // কোনো permission দরকার না থাকলে — allow করো
    if ((!required || required.length === 0) && (!requiredAny || requiredAny.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // user না থাকলে (JwtAuthGuard miss করলে)
    if (!user) throw new ForbiddenException('Unauthorized');

    // ২. এই user এর সব effective permissions resolve করো (cached)
    const effectivePermissions = await this.resolvePermissions(user.id, user.role_id);

    // ৩. Required সব permissions আছে কিনা চেক করো (AND logic)
    if (required && required.length > 0) {
      const hasAll = required.every((perm) => effectivePermissions.has(perm));
      if (!hasAll) {
        const missing = required.filter((p) => !effectivePermissions.has(p));
        throw new ForbiddenException(
          `Access denied. Missing permission(s): ${missing.join(', ')}`,
        );
      }
    }

    // ৪. RequiredAny permission এর যেকোনো একটা আছে কিনা চেক করো (OR logic)
    if (requiredAny && requiredAny.length > 0) {
      const hasAny = requiredAny.some((perm) => effectivePermissions.has(perm));
      if (!hasAny) {
        throw new ForbiddenException(
          `Access denied. Missing at least one permission: ${requiredAny.join(', ')}`,
        );
      }
    }

    // ৫. Request এ effective permissions attach করো (optional)
    request.effectivePermissions = [...effectivePermissions];

    return true;
  }

  /**
   * Permission resolution logic (3 স্তর):
   *
   * স্তর ১ — Role permissions: user এর role এর সব permission লোড করো
   * স্তর ২ — User overrides (allowed: true): role এ নেই কিন্তু user কে দেওয়া হয়েছে
   * স্তর ৩ — User overrides (allowed: false): role এ আছে কিন্তু এই user এর জন্য বন্ধ
   *
   * Final set = (role permissions ∪ user grants) − user denies
   *
   * Results are cached per user+role for CACHE_TTL_MS to avoid repeated DB queries.
   * Call invalidateCache(userId) after any permission change to ensure immediate effect.
   */
  private async resolvePermissions(
    userId: number,
    roleId: number | null,
  ): Promise<Set<string>> {
    const cacheKey = `${userId}:${roleId ?? 'norole'}`;
    
    // 1. Check valid cache
    const cached = PermissionsGuard.permCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.perms;
    }

    // 2. Check if a resolution promise is already in-flight for this key to deduplicate parallel requests
    let promise = PermissionsGuard.inFlightRequests.get(cacheKey);
    if (!promise) {
      promise = (async () => {
        try {
          const permSet = new Set<string>();

          // Run both queries in parallel for speed, selecting only necessary fields
          const [rolePerms, userPerms] = await Promise.all([
            roleId
              ? this.rolePermRepo.find({
                  where: { role_id: roleId },
                  relations: { permission: true },
                  select: {
                    id: true,
                    role_id: true,
                    permission_id: true,
                    permission: {
                      id: true,
                      code: true,
                    },
                  },
                })
              : Promise.resolve([]),
            this.userPermRepo.find({
              where: { user_id: userId },
              relations: { permission: true },
              select: {
                id: true,
                user_id: true,
                permission_id: true,
                allowed: true,
                permission: {
                  id: true,
                  code: true,
                },
              },
            }),
          ]);

          // স্তর ১: Role এর permissions
          for (const rp of rolePerms) {
            if (rp.permission?.code) {
              permSet.add(rp.permission.code);
            }
          }

          // স্তর ২ & ৩: User-level overrides
          for (const up of userPerms) {
            if (!up.permission?.code) continue;

            if (up.allowed) {
              // Grant: role এ না থাকলেও দাও
              permSet.add(up.permission.code);
            } else {
              // Deny: role এ থাকলেও সরাও
              permSet.delete(up.permission.code);
            }
          }

          // Cache the result
          PermissionsGuard.permCache.set(cacheKey, {
            perms: permSet,
            expiresAt: Date.now() + CACHE_TTL_MS,
          });

          // Prune stale entries to prevent unbounded map growth
          if (PermissionsGuard.permCache.size > 1000) {
            const now = Date.now();
            for (const [key, entry] of PermissionsGuard.permCache.entries()) {
              if (entry.expiresAt <= now) {
                PermissionsGuard.permCache.delete(key);
              }
            }
          }

          return permSet;
        } finally {
          // Remove from in-flight tracker once completed/failed
          PermissionsGuard.inFlightRequests.delete(cacheKey);
        }
      })();

      PermissionsGuard.inFlightRequests.set(cacheKey, promise);
    }

    return promise;
  }

  /**
   * Call this after updating a user's permissions or role to force immediate 
   * re-resolution on the next request (bypasses the 30s cache).
   */
  static invalidateCache(userId: number, roleId?: number | null): void {
    if (roleId !== undefined) {
      PermissionsGuard.permCache.delete(`${userId}:${roleId ?? 'norole'}`);
    } else {
      // Invalidate all entries for this user regardless of role
      for (const key of PermissionsGuard.permCache.keys()) {
        if (key.startsWith(`${userId}:`)) {
          PermissionsGuard.permCache.delete(key);
        }
      }
    }
  }

  /**
   * Call this after a role's permission set has changed to invalidate the cache
   * for all users belonging to that role.
   */
  static invalidateRoleCache(roleId: number): void {
    const suffix = `:${roleId}`;
    for (const key of PermissionsGuard.permCache.keys()) {
      if (key.endsWith(suffix)) {
        PermissionsGuard.permCache.delete(key);
      }
    }
  }
}