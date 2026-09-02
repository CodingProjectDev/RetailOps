import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { GqlAuthGuard } from "./guards/gql-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: 60 * 60 * 8 }
    })
  ],
  providers: [AuthResolver, AuthService, GqlAuthGuard, RolesGuard],
  exports: [JwtModule, GqlAuthGuard, RolesGuard]
})
export class AuthModule {}
