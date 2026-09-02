import {
  Field,
  Float,
  GraphQLISODateTime,
  Int,
  ObjectType
} from "@nestjs/graphql";

@ObjectType()
export class ShiftModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  shiftNumber: string;

  @Field(() => String)
  cashierId: string;

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
  cashRefunds: number;

  @Field(() => Float)
  totalRefunds: number;

  @Field(() => Int)
  transactionCount: number;

  @Field(() => Int)
  itemsSold: number;

  @Field(() => GraphQLISODateTime)
  openedAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closedAt?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  forceCloseReason?: string | null;

  @Field(() => String, { nullable: true })
  forceClosedByName?: string | null;
}
