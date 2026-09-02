import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { DailyClosingResolver } from "./daily-closing.resolver";
import { DailyClosingService } from "./daily-closing.service";

@Module({
  imports: [StoresModule],
  providers: [
    DailyClosingResolver,
    DailyClosingService
  ]
})
export class DailyClosingModule {}
