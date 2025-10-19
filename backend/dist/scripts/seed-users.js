"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function upsertUser(params) {
    const { email, firstName, lastName, role, userType, password, department } = params;
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    return prisma.user.upsert({
        where: { email },
        update: {
            firstName,
            lastName,
            role,
            userType,
            department: department !== null && department !== void 0 ? department : null,
            password: passwordHash,
            isActive: true,
        },
        create: {
            email,
            firstName,
            lastName,
            role,
            userType,
            department: department !== null && department !== void 0 ? department : null,
            password: passwordHash,
            isActive: true,
        },
    });
}
async function ensureDepartment(params) {
    const { name, nameAm = null, description = null } = params;
    const existing = await prisma.department.findFirst({ where: { name } });
    if (existing)
        return existing;
    return prisma.department.create({
        data: {
            name,
            nameAm,
            description,
            isActive: true,
        },
    });
}
async function main() {
    console.log("Seeding demo users…");
    await ensureDepartment({ name: "Information Technology", description: "IT Department" });
    await ensureDepartment({ name: "Finance", description: "Finance Department" });
    const users = [
        {
            email: "admin@example.com",
            firstName: "System",
            lastName: "Admin",
            role: client_1.UserRole.ADMIN,
            userType: client_1.UserType.INTERNAL,
            department: "Management",
            password: "Password123!",
        },
        {
            email: "general.manager@example.com",
            firstName: "General",
            lastName: "Manager",
            role: client_1.UserRole.GENERAL_DIRECTOR,
            userType: client_1.UserType.INTERNAL,
            department: "Management",
            password: "Password123!",
        },
        {
            email: "staff.manager@example.com",
            firstName: "Staff",
            lastName: "Manager",
            role: client_1.UserRole.STAFF_MANAGER,
            userType: client_1.UserType.INTERNAL,
            department: "Operations",
            password: "Password123!",
        },
        {
            email: "agent@example.com",
            firstName: "Support",
            lastName: "Agent",
            role: client_1.UserRole.SUPPORT_AGENT,
            userType: client_1.UserType.INTERNAL,
            department: "Support",
            password: "Password123!",
        },
        {
            email: "support.it@example.com",
            firstName: "IT",
            lastName: "Support",
            role: client_1.UserRole.SUPPORT_AGENT,
            userType: client_1.UserType.INTERNAL,
            department: "Information Technology",
            password: "Password123!",
        },
        {
            email: "employee.it@example.com",
            firstName: "IT",
            lastName: "Employee",
            role: client_1.UserRole.END_USER,
            userType: client_1.UserType.INTERNAL,
            department: "Information Technology",
            password: "Password123!",
        },
        {
            email: "head.it@example.com",
            firstName: "IT",
            lastName: "Head",
            role: client_1.UserRole.STAFF_MANAGER,
            userType: client_1.UserType.INTERNAL,
            department: "Information Technology",
            password: "Password123!",
        },
        {
            email: "employee.finance@example.com",
            firstName: "Finance",
            lastName: "Employee",
            role: client_1.UserRole.END_USER,
            userType: client_1.UserType.INTERNAL,
            department: "Finance",
            password: "Password123!",
        },
        {
            email: "head.finance@example.com",
            firstName: "Finance",
            lastName: "Head",
            role: client_1.UserRole.STAFF_MANAGER,
            userType: client_1.UserType.INTERNAL,
            department: "Finance",
            password: "Password123!",
        },
        {
            email: "user.internal@example.com",
            firstName: "Internal",
            lastName: "User",
            role: client_1.UserRole.END_USER,
            userType: client_1.UserType.INTERNAL,
            department: "HR",
            password: "Password123!",
        },
        {
            email: "user.external@example.com",
            firstName: "External",
            lastName: "User",
            role: client_1.UserRole.END_USER,
            userType: client_1.UserType.EXTERNAL,
            department: null,
            password: "Password123!",
        },
    ];
    for (const u of users) {
        const saved = await upsertUser(u);
        console.log(`Upserted: ${saved.email} (role=${saved.role}, type=${saved.userType})`);
    }
    console.log("Seeding complete.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-users.js.map