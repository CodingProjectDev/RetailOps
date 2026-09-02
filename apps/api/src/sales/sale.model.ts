import { Field, Float, GraphQLISODateTime, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class SaleModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  receiptNumber: string;

  @Field(() => String)
  status: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  total: number;

  @Field(() => GraphQLISODateTime)
  completedAt: Date;
}

@ObjectType()
export class SaleItemHistoryModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  productId: string;

  @Field(() => String)
  productName: string;

  @Field(() => String)
  barcode: string;

  @Field(() => String)
  sku: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  refundedQuantity: number;

  @Field(() => Int)
  remainingRefundableQuantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  lineTotal: number;
}


@ObjectType()
export class RefundItemHistoryModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  saleItemId: string;

  @Field(() => String)
  productName: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  amount: number;

  @Field(() => Boolean)
  restock: boolean;
}

@ObjectType()
export class RefundHistoryModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  refundNumber: string;

  @Field(() => Float)
  amount: number;

  @Field(() => String)
  reason: string;

  @Field(() => String)
  createdByName: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => [RefundItemHistoryModel])
  items: RefundItemHistoryModel[];
}

@ObjectType()
export class SaleHistoryModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  receiptNumber: string;

  @Field(() => String)
  cashierId: string;

  @Field(() => String)
  cashierName: string;

  @Field(() => String)
  status: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  discount: number;

  @Field(() => Float)
  total: number;

  @Field(() => String)
  paymentMethod: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  completedAt?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  voidedAt?: Date | null;

  @Field(() => String, { nullable: true })
  voidReason?: string | null;

  @Field(() => String, { nullable: true })
  voidedByName?: string | null;

  @Field(() => Float)
  refundedAmount: number;

  @Field(() => [RefundHistoryModel])
  refunds: RefundHistoryModel[];

  @Field(() => [SaleItemHistoryModel])
  items: SaleItemHistoryModel[];
}

@ObjectType()
export class SalesCashierModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;
}
