import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { UsersService } from "../users/users.service"
import { LoginDto } from "./dto/login.dto"
import  { RegisterDto } from "./dto/register.dto"
import * as bcrypt from "bcryptjs"
import { UserRole, UserType } from "@prisma/client"

@Injectable()
export class AuthService {
  async checkEmail(email: string) {
    const user = await this.usersService.findByEmail(email)
    return { exists: !!user }
  }
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user
      return result
    }
    return null
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) {
      throw new UnauthorizedException("Invalid credentials")
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated")
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      userType: user.userType,
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        userType: user.userType,
        department: user.department,
      },
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) {
      throw new ConflictException("User already exists")
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12)
    const user = await this.usersService.create({
      ...registerDto,
      isActive: true,
      password: hashedPassword,
    })

    // Return a clean user shape (no password)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      userType: user.userType,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId)
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid user")
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      userType: user.userType,
    }

    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  // Create a temporary guest user and return a signed JWT
  async createGuest() {
    // Generate a pseudo-unique email for the guest user
    const suffix = Math.random().toString(36).slice(2, 10)
    const timestamp = Date.now()
    const email = `guest_${timestamp}_${suffix}@guest.local`

    const passwordPlain = Math.random().toString(36).slice(2) // not used after creation
    const hashedPassword = await bcrypt.hash(passwordPlain, 10)

    const user = await this.usersService.create({
      email,
      firstName: "Guest",
      lastName: suffix,
      password: hashedPassword,
      role: UserRole.END_USER,
      userType: UserType.EXTERNAL,
      isActive: true,
    })

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      userType: user.userType,
    }

    return {
      access_token: this.jwtService.sign(payload),
      user,
    }
  }
}
