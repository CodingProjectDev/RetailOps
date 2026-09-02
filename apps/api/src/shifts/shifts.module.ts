import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { ShiftsResolver } from "./shifts.resolver";
import { ShiftsService } from "./shifts.service";

@Module({
  imports: [StoresModule],
  providers: [
    ShiftsResolver,
    ShiftsService
  ]
})
export class ShiftsModule {}
