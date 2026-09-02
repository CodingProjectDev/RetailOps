import {
  Field,
  Float,
  GraphQLISODateTime,
  Int,
  ObjectType
} from "@nestjs/graphql";

@ObjectType()
export class SupplierModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  contactName?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => Boolean)
  active: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}

@ObjectType()
export class PurchaseOrderItemModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  productId: string;

  @Field(() => String)
  productName: string;

  @Field(() => String)
  sku: string;

  @Field(() => String)
  barcode: string;

  @Field(() => Int)
  quantityOrdered: number;

  @Field(() => Int)
  quantityReceived: number;

  @Field(() => Int)
  remainingQuantity: number;

  @Field(() => Float)
  unitCost: number;

  @Field(() => Float)
  lineTotal: number;
}

@ObjectType()
export class PurchaseOrderModel {
  @Field(() => String)
  id: string;

  @Field(() => String)
  poNumber: string;

  @Field(() => String)
  supplierId: string;

  @Field(() => String)
  supplierName: string;

  @Field(() => String)
  status: string;

  @Field(() => Float)
  totalCost: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String)
  createdByName: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  orderedAt?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  receivedAt?: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  cancelledAt?: Date | null;

  @Field(() => String, { nullable: true })
  cancelReason?: string | null;

  @Field(() => [PurchaseOrderItemModel])
  items: PurchaseOrderItemModel[];
}
