import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { UserRole } from "@prisma/client"
import { ROLES_KEY } from "../decorators/roles.decorator"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no roles are required, allow
    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    // Block unauthenticated requests
    if (!user) {
      return false
    }

    // Enforce that the user's role matches at least one of the required roles
    const role: UserRole | undefined = user.role || user?.user?.role
    if (!role) return false
    return requiredRoles.includes(role)
  }
}
