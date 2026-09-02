import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { ReportsResolver } from "./reports.resolver";
import { ReportsService } from "./reports.service";

@Module({
  imports: [StoresModule],
  providers: [
    ReportsResolver,
    ReportsService
  ]
})
export class ReportsModule {}
