import { DataSource } from 'typeorm';
import { User } from '../../users/user.entity';
import { Role } from '../../roles/role.entity';
import { Permission } from '../../roles/permission.entity';
import { RolePermission } from '../../roles/role-permission.entity';
import { UserPermission } from '../../users/user-permission.entity';

/**
 *  Permission code convention:  <module>.<action>
 *  Actions:  manage  (create/update/delete = "Full Access")
 *            read    (list/view            = "Read Only")
 *
 *  Roles seeded per SRS §12 matrix:
 *  ───────────────────────────────────────────────────────────────
 *  Module                   Super Admin   Editor   HR/Recruiter  Sales
 *  ───────────────────────────────────────────────────────────────
 *  users.manage              ✓  (Full)      —         —          —
 *  users.read                ✓              —         —          —
 *  settings.manage           ✓              —         —          —
 *  settings.read             ✓              ✓ (Read)   —         —
 *  portfolio.manage          ✓              ✓ (Full)   —          —
*  portfolio.read              ✓              ✓          —          ✓ (Read)
 *  blog.manage               ✓              ✓ (Full)   —         —
 *  blog.read                 ✓              ✓          —          —
 *  careers.manage            ✓              —          ✓ (Full)   —
 *  careers.read              ✓              —          ✓          —
 *  leads.manage              ✓              —          —          ✓ (Full)
 *  leads.read                ✓              —          —          ✓
 *  ───────────────────────────────────────────────────────────────
 */

type PermSeed = { code: string; module: string; description?: string };

const PERMISSIONS: PermSeed[] = [
  { code: 'users.manage',   module: 'user_management', description: 'Create / update / delete users & roles' },
  { code: 'users.read',     module: 'user_management', description: 'View users & roles list' },

  { code: 'settings.manage', module: 'settings', description: 'Update site settings, hubs, certs' },
  { code: 'settings.read',   module: 'settings', description: 'Read-only view of settings' },

  { code: 'portfolio.manage', module: 'portfolio', description: 'CRUD portfolio projects & tech stack' },
  { code: 'portfolio.read',   module: 'portfolio', description: 'View portfolio projects' },

  { code: 'blog.manage', module: 'blog', description: 'CRUD blog posts & hero sections' },
  { code: 'blog.read',   module: 'blog', description: 'View blog posts' },

  { code: 'careers.manage', module: 'careers', description: 'CRUD jobs & manage applicants' },
  { code: 'careers.read',   module: 'careers', description: 'View jobs & applicants' },

  { code: 'leads.manage', module: 'leads', description: 'CRUD leads & consultations' },
  { code: 'leads.read',   module: 'leads', description: 'View leads list' },

  { code: 'testimonials.manage', module: 'testimonials', description: 'CRUD testimonials & client logos' },
  { code: 'testimonials.read',   module: 'testimonials', description: 'View testimonials & logos' },

  { code: 'partners.manage', module: 'partners', description: 'CRUD partners & ecosystem' },
  { code: 'partners.read',   module: 'partners', description: 'View partners' },
];

const ROLE_MATRIX: Record<string, string[]> = {
  super_admin:         PERMISSIONS.map((p) => p.code),                     // full everything
  editor_content_lead: ['portfolio.manage','portfolio.read','blog.manage','blog.read','settings.read','testimonials.manage','testimonials.read','partners.manage','partners.read'],
  hr_recruiter:        ['careers.manage','careers.read'],
  sales_lead:          ['leads.manage','leads.read','portfolio.read','testimonials.read'],
};

const ADMIN_USER = {
  username: 'super_admin',
  name: 'Super Admin',
  email: 'admin@milanova.tech',
  phone: '+39 02 1234 5678',
  password: 'Admin@123', // hashes via @BeforeInsert — must reset on first login
  status: 'active',
  is_deleted: false,
};

async function upsert<T extends { id?: number }>(
  repo: any,
  find: Partial<T>,
  merge: Partial<T>,
): Promise<T> {
  const existing = await repo.findOneBy(find);
  if (existing) return repo.save({ ...existing, ...merge });
  return repo.save(repo.create({ ...find, ...merge }));
}

export async function seedAdminRbac(dataSource: DataSource): Promise<void> {
  console.log('🔐  Seeding RBAC (admin-seed.helper)...');

  const permRepo    = dataSource.getRepository(Permission);
  const roleRepo    = dataSource.getRepository(Role);
  const rpRepo      = dataSource.getRepository(RolePermission);
  const userRepo    = dataSource.getRepository(User);
  const upRepo      = dataSource.getRepository(UserPermission);

  // ── Permissions ────────────────────────────────────────────────
  const savedPerms: Permission[] = [];
  for (const p of PERMISSIONS) {
    savedPerms.push(await upsert(permRepo, { code: p.code } as any, { module: p.module, description: p.description } as any));
  }
  const permMap = Object.fromEntries(savedPerms.map((p) => [p.code, p]));

  // ── Roles ──────────────────────────────────────────────────────
  const savedRoles: Record<string, Role> = {};
  for (const roleName of Object.keys(ROLE_MATRIX)) {
    savedRoles[roleName] = await upsert(roleRepo, { name: roleName } as any, { description: roleName.replace(/_/g, ' '), status: 'active', is_deleted: false } as any);
  }

  // ── Role ↔ Permission join ─────────────────────────────────────
  for (const [roleName, permCodes] of Object.entries(ROLE_MATRIX)) {
    const role = savedRoles[roleName];
    for (const code of permCodes) {
      const perm = permMap[code];
      if (!perm) continue;
      await upsert(rpRepo, { role_id: role.id, permission_id: perm.id } as any, {} as any);
    }
  }

  // ── Super Admin user ───────────────────────────────────────────
  const adminRole = savedRoles['super_admin'];
  const admin = await upsert(userRepo, { email: ADMIN_USER.email } as any, {
    ...ADMIN_USER,
    role_id: adminRole.id,
  } as any);
  console.log(`   ✔  Admin user  ${ADMIN_USER.email}  role=${adminRole.name}`);
}
