import { Module } from "@nestjs/common";
import { BusinessesResolver } from "./businesses.resolver";
import { BusinessesService } from "./businesses.service";

@Module({
  providers: [
    BusinessesResolver,
    BusinessesService
  ]
})
export class BusinessesModule {}
