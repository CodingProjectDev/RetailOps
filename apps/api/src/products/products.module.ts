import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { ProductsResolver } from "./products.resolver";
import { ProductsService } from "./products.service";

@Module({
  imports: [StoresModule],
  providers: [
    ProductsResolver,
    ProductsService
  ], exports: [ProductsService]
})
export class ProductsModule {}
