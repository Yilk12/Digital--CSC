import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UsersService } from "../users/users.service"
import { LoginDto } from "./dto/login.dto"
import { RegisterDto } from "./dto/register.dto"
import * as bcrypt from "bcryptjs"
import { PrismaService } from "../prisma/prisma.service"
import { PasswordPolicyService } from "../password-policy/password-policy.service"
import { ChangePasswordDto } from "./dto/change-password.dto"

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  // --- VALIDATE EMAIL ---
  async validateEmail(email: string) {
    const user = await this.usersService.findByEmail(email)
    return { exists: !!user }
  }


   // --- VALIDATE USER ---
  async validateUser(email: string, password: string) {
    // Fetch minimal user fields including password hash for validation
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        userType: true,
        departmentId: true,
        isActive: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    })

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isActive || user.accountStatus === 'DISABLED') {
        return null
      }
      const { password: _pw, ...result } = user
      return result
    }
    return null
  }

  
  // --- REGISTER ---
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException("User already exists")
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12)
    const user = await this.usersService.create({
      ...registerDto,
      isActive: true,
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      phone: user.phone,
      department: user.departmentId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  // --- LOGIN ---
async login(loginDto: LoginDto) {
  // Fetch full user with password and department relation for login validation
  const user = await this.prisma.user.findUnique({
    where: { email: loginDto.email },
    include: {
      department: { select: { id: true, name: true } },
    },
  });

  if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
    throw new UnauthorizedException("Invalid credentials");
  }

  if (!user.isActive) {
    throw new UnauthorizedException("Account is deactivated");
  }

  if (user.accountStatus === 'DISABLED') {
    throw new UnauthorizedException("Account is disabled");
  }

  // Use department relation to get department name directly
  const departmentName: string | null = user.department?.name ?? null;

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    userType: user.userType,
    departmentId: user.departmentId,
  };
  const access_token = this.jwtService.sign(payload);

  try {
    console.log("[AuthService] User login success:", {
      id: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      departmentId: user.departmentId,
      departmentName,
    });
  } catch {}

  return {
    access_token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userType: user.userType,
      departmentId: user.departmentId,
      departmentName, // ✅ added here
    },
  };
}


  // --- LOGOUT ---
  async logout() {
    return { message: "Logged out successfully" }
  }

  // --- CHANGE PASSWORD ---
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Find user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
        accountStatus: true,
      },
    });

  

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (!user.isActive || user.accountStatus === 'DISABLED') {
      throw new UnauthorizedException("Account is deactivated or disabled");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password
    );

    if (isSamePassword) {
      throw new Error("New password cannot be the same as current password");
    }

    // Validate new password against password policy
    await this.validatePasswordAgainstPolicy(changePasswordDto.newPassword);

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update user password
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
      },
    });

    // Log password change activity (you might want to add this to an audit log)
    console.log(`Password changed for user: ${user.email}`);

    return {
      message: "Password changed successfully",
      user: updatedUser,
    };
  }

  // --- VALIDATE PASSWORD AGAINST POLICY ---
  private async validatePasswordAgainstPolicy(password: string): Promise<void> {
    // Get current password policy
    const policy = await this.passwordPolicyService.getPolicy();

    // Validate minimum length
    if (password.length < policy.minLength) {
      throw new Error(
        `Password must be at least ${policy.minLength} characters long`
      );
    }

    // Validate uppercase requirement
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error(
        "Password must contain at least one uppercase letter"
      );
    }

    // Validate lowercase requirement
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error(
        "Password must contain at least one lowercase letter"
      );
    }

    // Validate digit requirement
    if (policy.requireDigit && !/\d/.test(password)) {
      throw new Error(
        "Password must contain at least one number"
      );
    }

    // Validate special character requirement
    if (policy.requireSpecialcharSymbol && !/[^A-Za-z0-9]/.test(password)) {
      throw new Error(
        "Password must contain at least one special character"
      );
    }
  }
}
