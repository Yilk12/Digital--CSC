import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import  { UsersService } from "./users.service"
import { CreateUserDto } from "./dto/create-user.dto"
import  { UpdateUserDto } from "./dto/update-user.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @Roles(UserRole.ADMIN)
  @Post()
  create(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto)
  }

  @ApiOperation({ summary: "Get all users with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "role", required: false, enum: UserRole })
  @ApiQuery({ name: "search", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR, UserRole.STAFF_MANAGER)
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(page, limit, role, search)
  }

  @ApiOperation({ summary: "Get user statistics" })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR, UserRole.STAFF_MANAGER)
  @Get("stats")
  getUserStats() {
    return this.usersService.getUserStats()
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: "Update user" })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Patch(":id")
  update(@Param('id') id: string, updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto)
  }

  @ApiOperation({ summary: 'Deactivate user' })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
