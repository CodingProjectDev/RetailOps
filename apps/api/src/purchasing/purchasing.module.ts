import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { PurchasingResolver } from "./purchasing.resolver";
import { PurchasingService } from "./purchasing.service";

@Module({
  imports: [StoresModule],
  providers: [
    PurchasingResolver,
    PurchasingService
  ]
})
export class PurchasingModule {}
