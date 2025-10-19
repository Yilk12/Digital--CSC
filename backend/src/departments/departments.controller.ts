import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { DepartmentsService } from "./departments.service"
import { CreateDepartmentDto } from "./dto/create-department.dto"
import { UpdateDepartmentDto } from "./dto/update-department.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Departments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @ApiOperation({ summary: "Create a new department" })
  @ApiResponse({ status: 201, description: "Department created successfully" })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Post()
  create(createDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDto)
  }

  @ApiOperation({ summary: "Get all departments with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR, UserRole.STAFF_MANAGER, UserRole.SUPPORT_AGENT)
  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.departmentsService.findAll(page, limit, search)
  }

  @ApiOperation({ summary: 'Get department by ID' })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR, UserRole.STAFF_MANAGER, UserRole.SUPPORT_AGENT)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findById(id);
  }

  @ApiOperation({ summary: "Update department" })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Patch(":id")
  update(@Param('id') id: string, updateDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDto)
  }

  @ApiOperation({ summary: 'Deactivate department' })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.deactivate(id);
  }
}
