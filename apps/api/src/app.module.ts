import { Module } from "@nestjs/common";
import {
  ApolloDriver,
  ApolloDriverConfig
} from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import type {
  Request,
  Response
} from "express";
import { AuthModule } from "./auth/auth.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { DailyClosingModule } from "./closing/daily-closing.module";
import { HealthResolver } from "./health.resolver";
import { PrismaModule } from "./prisma/prisma.module";
import { PlatformAdminModule } from "./platform-admin/platform-admin.module";
import { ProductsModule } from "./products/products.module";
import { PurchasingModule } from "./purchasing/purchasing.module";
import { ReportsModule } from "./reports/reports.module";
import { SalesModule } from "./sales/sales.module";
import { ShiftsModule } from "./shifts/shifts.module";
import { StoresModule } from "./stores/stores.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({
        req,
        res
      }: {
        req: Request;
        res: Response;
      }) => ({
        req,
        res
      })
    }),
    PrismaModule,
    PlatformAdminModule,
    AuthModule,
    BusinessesModule,
    UsersModule,
    StoresModule,
    ProductsModule,
    PurchasingModule,
    ReportsModule,
    DailyClosingModule,
    SalesModule,
    ShiftsModule
  ],
  providers: [
    HealthResolver
  ]
})
export class AppModule {}
