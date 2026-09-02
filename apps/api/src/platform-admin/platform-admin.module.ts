
import {
  Module
} from "@nestjs/common";
import {
  PlatformAdminGuard
} from "./guards/platform-admin.guard";
import {
  PlatformAdminResolver
} from "./platform-admin.resolver";
import {
  PlatformAdminService
} from "./platform-admin.service";

@Module({
  providers: [
    PlatformAdminResolver,
    PlatformAdminService,
    PlatformAdminGuard
  ]
})
export class PlatformAdminModule {}
