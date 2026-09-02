import {
  Field,
  Float,
  GraphQLISODateTime,
  Int,
  ObjectType
} from "@nestjs/graphql";

@ObjectType()
export class DailyClosingPaymentModel {
  @Field(() => String)
  paymentMethod: string;

  @Field(() => Float)
  grossSales: number;

  @Field(() => Float)
  refunds: number;

  @Field(() => Float)
  netSales: number;

  @Field(() => Int)
  transactions: number;
}

@ObjectType()
export class DailyClosingShiftModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  shiftNumber: string;

  @Field(() => String)
  cashierName: string;

  @Field(() => String)
  status: string;

  @Field(() => Float)
  openingCash: number;

  @Field(() => Float)
  expectedCash: number;

  @Field(() => Float, { nullable: true })
  closingCash?: number | null;

  @Field(() => Float, { nullable: true })
  cashDifference?: number | null;

  @Field(() => Float)
  grossSales: number;

  @Field(() => Float)
  netSales: number;

  @Field(() => Float)
  cashSales: number;

  @Field(() => Float)
  cardSales: number;

  @Field(() => Float)
  otherSales: number;

  @Field(() => Float)
  totalRefunds: number;

  @Field(() => Float)
  cashRefunds: number;

  @Field(() => Int)
  transactions: number;

  @Field(() => Int)
  itemsSold: number;

  @Field(() => GraphQLISODateTime)
  openedAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closedAt?: Date | null;

  @Field(() => String, { nullable: true })
  forceCloseReason?: string | null;
}

@ObjectType()
export class DailyClosingReportModel {
  @Field(() => String)
  businessDate: string;

  @Field(() => String)
  timeZone: string;

  @Field(() => Boolean)
  readyToClose: boolean;

  @Field(() => Float)
  grossSales: number;

  @Field(() => Float)
  refunds: number;

  @Field(() => Float)
  netSales: number;

  @Field(() => Int)
  transactions: number;

  @Field(() => Int)
  itemsSold: number;

  @Field(() => Float)
  openingCash: number;

  @Field(() => Float)
  expectedCash: number;

  @Field(() => Float)
  actualCash: number;

  @Field(() => Float)
  cashVariance: number;

  @Field(() => Float)
  shortage: number;

  @Field(() => Float)
  overage: number;

  @Field(() => Int)
  shiftCount: number;

  @Field(() => Int)
  openShiftCount: number;

  @Field(() => Int)
  closedShiftCount: number;

  @Field(() => Int)
  forceClosedShiftCount: number;

  @Field(() => [DailyClosingPaymentModel])
  payments: DailyClosingPaymentModel[];

  @Field(() => [DailyClosingShiftModel])
  shifts: DailyClosingShiftModel[];
}
