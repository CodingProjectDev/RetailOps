import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { SalesResolver } from "./sales.resolver";
import { SalesService } from "./sales.service";

@Module({
  imports: [StoresModule],
  providers: [
    SalesResolver,
    SalesService
  ]
})
export class SalesModule {}
