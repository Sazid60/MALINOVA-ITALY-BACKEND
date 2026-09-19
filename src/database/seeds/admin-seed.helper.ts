import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

export type PermSeed = { code: string; module: string; description?: string };

export const PERMISSIONS: PermSeed[] = [
  // 1. Dashboard
  { code: 'dashboard.overview.view',       module: 'dashboard',    description: 'View dashboard metrics, KPI counters, and real-time activity feed' },
  { code: 'dashboard.overview.manage',     module: 'dashboard',    description: 'Manage and configure dashboard overview widgets and KPI thresholds' },

  // 2. CMS - Hero Sections
  { code: 'cms.hero.view',                 module: 'cms',          description: 'View homepage hero slides and call-to-actions' },
  { code: 'cms.hero.manage',               module: 'cms',          description: 'Create, update, reorder, and delete homepage hero sections' },

  // 3. CMS - Blogs
  { code: 'cms.blogs.view',                module: 'cms',          description: 'View technical blog articles and categories' },
  { code: 'cms.blogs.manage',              module: 'cms',          description: 'Create, edit, publish, and delete blog articles' },

  // 4. CMS - Technologies
  { code: 'cms.technologies.view',         module: 'cms',          description: 'View technology stack showcase and categories' },
  { code: 'cms.technologies.manage',       module: 'cms',          description: 'Create, update, and manage technologies and stacks' },

  // 5. Portfolio & Projects
  { code: 'portfolio.projects.view',       module: 'portfolio',    description: 'View portfolio projects, case studies, and pricing tiers' },
  { code: 'portfolio.projects.manage',     module: 'portfolio',    description: 'Create, edit, and delete portfolio case studies and challenge details' },

  // 6. Products (SaaS)
  { code: 'products.saas.view',            module: 'products',     description: 'View proprietary SaaS products, feature modules, and tech stacks' },
  { code: 'products.saas.manage',          module: 'products',     description: 'Create, update, and delete SaaS product listings and modules' },

  // 7. Testimonials
  { code: 'testimonials.view',             module: 'testimonials', description: 'View client testimonials, case reviews, and brand logos' },
  { code: 'testimonials.manage',           module: 'testimonials', description: 'Create, edit, approve, and delete client testimonials' },

  // 8. Careers - Jobs
  { code: 'careers.jobs.view',             module: 'careers',      description: 'View job openings and career listings' },
  { code: 'careers.jobs.manage',           module: 'careers',      description: 'Create, update, and delete job openings and job specifications' },

  // 9. Careers - Applicants
  { code: 'careers.applicants.view',       module: 'careers',      description: 'View job applications, candidate resumes, and ATS records' },
  { code: 'careers.applicants.manage',     module: 'careers',      description: 'Update candidate recruitment stages, notes, and hiring decisions' },

  // 10. Contact Leads & Pipeline
  { code: 'leads.pipeline.view',           module: 'leads',        description: 'View consultation inquiries, lead details, and contact messages' },
  { code: 'leads.pipeline.manage',         module: 'leads',        description: 'Update consultation lead status, qualification notes, and responses' },

  // 11. Partners & Ecosystem
  { code: 'partners.view',                 module: 'partners',     description: 'View strategic cloud, infrastructure, and enterprise partner directory' },
  { code: 'partners.manage',               module: 'partners',     description: 'Create, update, and delete strategic partner profiles' },

  // 12. Analytics
  { code: 'analytics.view',                module: 'analytics',    description: 'View platform traffic, visitors, and engagement analytics' },
  { code: 'analytics.manage',              module: 'analytics',    description: 'Configure analytics parameters, event tracking, and export reports' },

  // 13. User Management
  { code: 'settings.users.view',           module: 'settings',     description: 'View administrator accounts, roles, and status' },
  { code: 'settings.users.manage',         module: 'settings',     description: 'Create, update, suspend, and delete administrator accounts' },

  // 14. Role Management
  { code: 'settings.roles.view',           module: 'settings',     description: 'View defined system roles and permission sets' },
  { code: 'settings.roles.manage',         module: 'settings',     description: 'Create, edit, and assign permission matrices to roles' },

  // 15. Permission Management
  { code: 'settings.permissions.view',     module: 'settings',     description: 'View system granular access codes' },
  { code: 'settings.permissions.manage',   module: 'settings',     description: 'Create and manage system granular access permissions' },

  // 16. Site Configuration
  { code: 'settings.site.view',            module: 'settings',     description: 'View company settings, headquarters, and contact info' },
  { code: 'settings.site.manage',          module: 'settings',     description: 'Update company profile, legal info, social handles, and logos' },

  // 17. Pages & Policies
  { code: 'settings.pages.view',           module: 'settings',     description: 'View terms of service and privacy policy content' },
  { code: 'settings.pages.manage',         module: 'settings',     description: 'Edit and publish terms of service and privacy policy pages' },

  // 18. SEO Management
  { code: 'seo.seo.view',                  module: 'seo',          description: 'View global SEO metadata, open graph cards, and indexing status' },
  { code: 'seo.seo.manage',                module: 'seo',          description: 'Update SEO meta tags, title patterns, and robots configuration' },

  // 19. Notification Templates
  { code: 'settings.notifications.view',   module: 'settings',     description: 'View OTP and notification SMS/email templates' },
  { code: 'settings.notifications.manage', module: 'settings',     description: 'Edit, activate, or reset notification templates' },
];

const VALID_PERMISSION_CODES = new Set(PERMISSIONS.map((p) => p.code));

const ROLE_MATRIX: Record<string, string[]> = {
  super_admin: PERMISSIONS.map((p) => p.code),
  owner: PERMISSIONS.map((p) => p.code), // Full access for owner
  editor_content_lead: [
    'dashboard.overview.view',
    'cms.hero.view',
    'cms.hero.manage',
    'cms.blogs.view',
    'cms.blogs.manage',
    'cms.technologies.view',
    'cms.technologies.manage',
    'portfolio.projects.view',
    'portfolio.projects.manage',
    'products.saas.view',
    'products.saas.manage',
    'testimonials.view',
    'testimonials.manage',
    'partners.view',
    'partners.manage',
    'settings.pages.view',
    'settings.pages.manage',
    'seo.seo.view',
    'seo.seo.manage',
    'settings.site.view',
  ],
  hr_recruiter: [
    'dashboard.overview.view',
    'careers.jobs.view',
    'careers.jobs.manage',
    'careers.applicants.view',
    'careers.applicants.manage',
  ],
  sales_lead: [
    'dashboard.overview.view',
    'leads.pipeline.view',
    'leads.pipeline.manage',
    'portfolio.projects.view',
    'products.saas.view',
    'testimonials.view',
  ],
};

const ADMIN_USER = {
  username: 'super_admin',
  name: 'Super Admin',
  email: 'admin@milanova.tech',
  phone: '+39 02 1234 5678',
  password: 'Admin@123',
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
  console.log('🔐  Seeding & Cleaning RBAC permissions...');

  const permRepo    = dataSource.getRepository(Permission);
  const roleRepo    = dataSource.getRepository(Role);
  const rpRepo      = dataSource.getRepository(RolePermission);
  const userRepo    = dataSource.getRepository(User);
  const upRepo      = dataSource.getRepository(UserPermission);

  // ── 1. Prune obsolete permissions not in the clean set ─────────
  const existingPerms = await permRepo.find();
  const obsoletePerms = existingPerms.filter((p) => !VALID_PERMISSION_CODES.has(p.code));

  if (obsoletePerms.length > 0) {
    const obsoleteIds = obsoletePerms.map((p) => p.id);
    await rpRepo
      .createQueryBuilder()
      .delete()
      .where('permission_id IN (:...ids)', { ids: obsoleteIds })
      .execute();

    await upRepo
      .createQueryBuilder()
      .delete()
      .where('permission_id IN (:...ids)', { ids: obsoleteIds })
      .execute();

    await permRepo
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids: obsoleteIds })
      .execute();

    console.log(`   ✔  Pruned ${obsoletePerms.length} obsolete permissions from database.`);
  }

  // ── 2. Upsert Clean Permissions ────────────────────────────────
  const savedPerms: Permission[] = [];
  for (const p of PERMISSIONS) {
    savedPerms.push(await upsert(permRepo, { code: p.code } as any, { module: p.module, description: p.description } as any));
  }
  const permMap = Object.fromEntries(savedPerms.map((p) => [p.code, p]));

  // ── 3. Roles ───────────────────────────────────────────────────
  const savedRoles: Record<string, Role> = {};
  for (const roleName of Object.keys(ROLE_MATRIX)) {
    savedRoles[roleName] = await upsert(roleRepo, { name: roleName } as any, { description: roleName.replace(/_/g, ' '), status: 'active', is_deleted: false } as any);
  }

  // ── 4. Role ↔ Permission join ──────────────────────────────────
  for (const [roleName, permCodes] of Object.entries(ROLE_MATRIX)) {
    const role = savedRoles[roleName];
    for (const code of permCodes) {
      const perm = permMap[code];
      if (!perm) continue;
      await upsert(rpRepo, { role_id: role.id, permission_id: perm.id } as any, {} as any);
    }
  }

  // ── 5. Super Admin users ───────────────────────────────────────
  const adminRole = savedRoles['super_admin'];
  const defaultPasswordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await upsert(userRepo, { email: ADMIN_USER.email } as any, {
    ...ADMIN_USER,
    password: defaultPasswordHash,
    role_id: adminRole.id,
  } as any);

  // Also sync primary admin user (id: 1 or admin@acharshop.com) to super_admin
  const primaryAdmin = await userRepo.findOne({
    where: [{ username: 'admin' }, { email: 'admin@acharshop.com' }, { id: 1 }],
  });
  if (primaryAdmin) {
    primaryAdmin.role_id = adminRole.id;
    await userRepo.save(primaryAdmin);
    console.log(`   ✔  Synced primary admin user ${primaryAdmin.email} (id: ${primaryAdmin.id}) to super_admin.`);
  }

  // Seed / Sync requested admin user: shahnawazsazid60@gmail.com
  const targetEmail = 'shahnawazsazid60@gmail.com';
  const targetUser = await upsert<User>(userRepo, { email: targetEmail } as any, {
    username: 'shahnawaz',
    name: 'Shahnawaz Sazid',
    email: targetEmail,
    password: defaultPasswordHash,
    role_id: adminRole.id,
    status: 'active',
    is_deleted: false,
  } as any);
  console.log(`   ✔  Seeded user ${targetUser.email} (role=${adminRole.name}) with default password Admin@123.`);

  console.log(`   ✔  Admin user  ${ADMIN_USER.email}  role=${adminRole.name} with ${savedPerms.length} permissions.`);
}
