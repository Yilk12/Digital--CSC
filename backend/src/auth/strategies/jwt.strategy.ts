import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service"; // adjust path

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "dev-insecure-secret-change-me",
    });
  }

  async validate(payload: any) {
    // Fetch the user from DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        userType: true,
        departmentId: true, 
      },
    });

    if (!user) throw new UnauthorizedException();

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      departmentId: user.departmentId,
    };
  }
}
