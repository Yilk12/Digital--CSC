import { PrismaClient, UserRole, UserType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function upsertUser(params: {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  userType: UserType
  password: string
  department?: string | null
}) {
  const { email, firstName, lastName, role, userType, password, department } = params
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role,
      userType,
      department: department ?? null,
      password: passwordHash,
      isActive: true,
    },
    create: {
      email,
      firstName,
      lastName,
      role,
      userType,
      department: department ?? null,
      password: passwordHash,
      isActive: true,
    },
  })
}

async function ensureDepartment(params: { name: string; nameAm?: string | null; description?: string | null }) {
  const { name, nameAm = null, description = null } = params
  // Name is not unique in schema, so use findFirst + create-if-missing
  const existing = await prisma.department.findFirst({ where: { name } })
  if (existing) return existing
  return prisma.department.create({
    data: {
      name,
      nameAm,
      description,
      isActive: true,
    },
  })
}

async function main() {
  console.log("Seeding demo users…")

  // Ensure core departments exist
  await ensureDepartment({ name: "Information Technology", description: "IT Department" })
  await ensureDepartment({ name: "Finance", description: "Finance Department" })

  const users = [
    {
      email: "admin@example.com",
      firstName: "System",
      lastName: "Admin",
      role: UserRole.ADMIN,
      userType: UserType.INTERNAL,
      department: "Management",
      password: "Password123!",
    },
    {
      email: "general.manager@example.com",
      firstName: "General",
      lastName: "Manager",
      role: UserRole.GENERAL_DIRECTOR,
      userType: UserType.INTERNAL,
      department: "Management",
      password: "Password123!",
    },
    {
      email: "staff.manager@example.com",
      firstName: "Staff",
      lastName: "Manager",
      role: UserRole.STAFF_MANAGER,
      userType: UserType.INTERNAL,
      department: "Operations",
      password: "Password123!",
    },
    {
      email: "agent@example.com",
      firstName: "Support",
      lastName: "Agent",
      role: UserRole.SUPPORT_AGENT,
      userType: UserType.INTERNAL,
      department: "Support",
      password: "Password123!",
    },
    // Default IT Support Agent
    {
      email: "support.it@example.com",
      firstName: "IT",
      lastName: "Support",
      role: UserRole.SUPPORT_AGENT,
      userType: UserType.INTERNAL,
      department: "Information Technology",
      password: "Password123!",
    },
    // IT Employee (END_USER)
    {
      email: "employee.it@example.com",
      firstName: "IT",
      lastName: "Employee",
      role: UserRole.END_USER,
      userType: UserType.INTERNAL,
      department: "Information Technology",
      password: "Password123!",
    },
    // IT Department Head (STAFF_MANAGER)
    {
      email: "head.it@example.com",
      firstName: "IT",
      lastName: "Head",
      role: UserRole.STAFF_MANAGER,
      userType: UserType.INTERNAL,
      department: "Information Technology",
      password: "Password123!",
    },
    // Finance Employee (END_USER)
    {
      email: "employee.finance@example.com",
      firstName: "Finance",
      lastName: "Employee",
      role: UserRole.END_USER,
      userType: UserType.INTERNAL,
      department: "Finance",
      password: "Password123!",
    },
    // Finance Department Head (STAFF_MANAGER)
    {
      email: "head.finance@example.com",
      firstName: "Finance",
      lastName: "Head",
      role: UserRole.STAFF_MANAGER,
      userType: UserType.INTERNAL,
      department: "Finance",
      password: "Password123!",
    },
    {
      email: "user.internal@example.com",
      firstName: "Internal",
      lastName: "User",
      role: UserRole.END_USER,
      userType: UserType.INTERNAL,
      department: "HR",
      password: "Password123!",
    },
    // Optional: external end user (comment out if you only want 4 users)
    {
      email: "user.external@example.com",
      firstName: "External",
      lastName: "User",
      role: UserRole.END_USER,
      userType: UserType.EXTERNAL,
      department: null,
      password: "Password123!",
    },
  ]

  for (const u of users) {
    const saved = await upsertUser(u)
    console.log(`Upserted: ${saved.email} (role=${saved.role}, type=${saved.userType})`)
  }

  console.log("Seeding complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
