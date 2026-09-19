/**
 * Role Hierarchy Utilities
 * ────────────────────────
 * is_system approach — simple, robust, DB-driven।
 *
 * নিয়ম:
 *  ১. target এর role is_system = true হলে শুধু owner touch করতে পারবে
 *  ২. কেউ নিজেকে নিজে edit/delete/permission-change করতে পারবে না
 */

/** Actor নিজেকে target করছে কিনা */
export function isSelf(actorId: number, targetId: number): boolean {
  return Number(actorId) === Number(targetId);
}

/** Actor কি system-protected role এর user কে touch করতে পারবে? */
export function canTouchSystemUser(actorRoleName: string): boolean {
  return actorRoleName?.toLowerCase() === 'owner';
}