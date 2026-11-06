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
  departmentId?: string | null
}) {
  const { email, firstName, lastName, role, userType, password, departmentId } = params
  const passwordHash = await bcrypt.hash(password, 10)
  return prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role,
      userType,
      departmentId: departmentId ?? null,
      password: passwordHash,
      isActive: true,
    },
    create: {
      email,
      firstName,
      lastName,
      role,
      userType,
      departmentId: departmentId ?? null,
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
  await ensureDepartment({ name: "Management", description: "Management Department" })
  await ensureDepartment({ name: "Operations", description: "Operations Department" })
  await ensureDepartment({ name: "Support", description: "Support Department" })
  await ensureDepartment({ name: "HR", description: "Human Resources Department" })

  const users = [
    {
      email: "admin@fcsc.com",
      firstName: "System",
      lastName: "Admin",
      role: UserRole.ADMIN,
      userType: UserType.INTERNAL,
      department: "Management",
      password: "admin@1234",
    },
    {
      email: "commissioner@example.com",
      firstName: "General",
      lastName: "Commissioner",
      role: UserRole.Commissioner,
      userType: UserType.INTERNAL,
      department: "Management",
      password: "Password123!",
    },
    {
      email: "department.head@example.com",
      firstName: "Department",
      lastName: "Head",
      role: UserRole.Department_Head,
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
    // IT Department Head
    {
      email: "head.it@example.com",
      firstName: "IT",
      lastName: "Head",
      role: UserRole.Department_Head,
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
    // Finance Department Head
    {
      email: "head.finance@example.com",
      firstName: "Finance",
      lastName: "Head",
      role: UserRole.Department_Head,
      userType: UserType.INTERNAL,
      department: "Finance",
      password: "Password123!",
    },
    // Maintenance Team
    {
      email: "maintenance@example.com",
      firstName: "Maintenance",
      lastName: "Team",
      role: UserRole.Maintenace_Team,
      userType: UserType.INTERNAL,
      department: "Operations",
      password: "Password123!",
    },
    // Finance Department User
    {
      email: "finance.user@example.com",
      firstName: "Finance",
      lastName: "User",
      role: UserRole.Finance_Department,
      userType: UserType.INTERNAL,
      department: "Finance",
      password: "Password123!",
    },
    // Announcement Creator
    {
      email: "announcement@example.com",
      firstName: "Announcement",
      lastName: "Creator",
      role: UserRole.Announcement_Creator,
      userType: UserType.INTERNAL,
      department: "Operations",
      password: "Password123!",
    },
    // Fleet Manager
    {
      email: "fleet@example.com",
      firstName: "Fleet",
      lastName: "Manager",
      role: UserRole.Fleet_Manager,
      userType: UserType.INTERNAL,
      department: "Operations",
      password: "Password123!",
    },
    // Driver
    {
      email: "driver@example.com",
      firstName: "Company",
      lastName: "Driver",
      role: UserRole.Driver,
      userType: UserType.INTERNAL,
      department: "Operations",
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
    // External end user
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
    let departmentId: string | null = null

    if (u.department) {
      const dept = await ensureDepartment({ name: u.department })
      departmentId = dept.id
    }

    const { department, ...rest } = u as any

    const saved = await upsertUser({
      ...(rest as Omit<(typeof users)[number], "department">),
      departmentId,
    })
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