import { Controller, Post, Body, UseGuards, Req } from "@nestjs/common"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { Roles } from "./decorators/roles.decorator"
import { RolesGuard } from "./guards/roles.guard"
import { UserRole } from "@prisma/client"
import { Request } from "express"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "User registration" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiBody({
    type: RegisterDto,
    examples: {
      default: {
        summary: "Valid registration",
        value: {
          email: "user@csc.gov.et",
          firstName: "John",
          lastName: "Doe",
          password: "password123",
          role: "END_USER",
          userType: "INTERNAL",
          phone: "+251911234567",
          department: "Human Resources",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  // Alias: /auth/signup -> same as register for unified flow compatibility
  @ApiOperation({ summary: "User signup (alias of register)" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("signup")
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  // Email existence check for email-first flow
  @ApiOperation({ summary: "Check if email exists" })
  @ApiResponse({ status: 200, description: "Returns { exists: boolean }" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { email: { type: "string", example: "user@csc.gov.et" } },
      required: ["email"],
    },
  })
  @Post("check-email")
  async checkEmail(@Body() body: { email: string }) {
    return this.authService.checkEmail(body.email)
  }

  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful, returns JWT" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiBody({
    type: LoginDto,
    examples: {
      default: {
        summary: "Valid credentials",
        value: { email: "user@csc.gov.et", password: "password123" },
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @ApiOperation({ summary: "Refresh JWT token" })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "Returns a refreshed JWT" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  async refresh(@Req() req: Request) {
    const user: any = (req as any).user
    const userId = user?.sub || user?.id
    return this.authService.refreshToken(userId)
  }

  @ApiOperation({ summary: "Create guest user and return JWT" })
  @ApiResponse({ status: 201, description: "Guest user created and token issued" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("guest")
  async createGuest() {
    return this.authService.createGuest()
  }
}