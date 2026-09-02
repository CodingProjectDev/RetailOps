import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class PaymentBreakdownModel {
  @Field(() => String)
  paymentMethod: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Int)
  transactions: number;
}

@ObjectType()
export class TopProductReportModel {
  @Field(() => String)
  productId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  sku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class CategoryReportModel {
  @Field(() => String)
  category: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class DailySalesReportModel {
  @Field(() => String)
  date: string;

  @Field(() => Float)
  netSales: number;

  @Field(() => Int)
  transactions: number;

  @Field(() => Int)
  itemsSold: number;
}

@ObjectType()
export class SalesReportModel {
  @Field(() => Float)
  grossSales: number;

  @Field(() => Float)
  refunds: number;

  @Field(() => Float)
  netSales: number;

  @Field(() => Float)
  taxCollected: number;

  @Field(() => Float)
  discounts: number;

  @Field(() => Int)
  transactions: number;

  @Field(() => Int)
  itemsSold: number;

  @Field(() => Float)
  averageTransaction: number;

  @Field(() => [PaymentBreakdownModel])
  payments: PaymentBreakdownModel[];

  @Field(() => [TopProductReportModel])
  topProducts: TopProductReportModel[];

  @Field(() => [CategoryReportModel])
  categories: CategoryReportModel[];

  @Field(() => [DailySalesReportModel])
  dailySales: DailySalesReportModel[];
}
