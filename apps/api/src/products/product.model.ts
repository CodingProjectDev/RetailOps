import { Field, Float, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ProductModel {
  @Field()
  id: string;

  @Field()
  barcode: string;

  @Field()
  sku: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field()
  categoryId: string;

  @Field()
  categoryName: string;

  @Field(() => Float)
  costPrice: number;

  @Field(() => Float)
  sellingPrice: number;

  @Field(() => Int)
  minimumStock: number;

  @Field()
  taxable: boolean;

  @Field()
  active: boolean;

  @Field(() => Int)
  stock: number;
}

@ObjectType()
export class CategoryModel {
  @Field()
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class InventoryMovementModel {
  @Field()
  id: string;

  @Field()
  productId: string;

  @Field()
  type: string;

  @Field(() => Int)
  quantityChange: number;

  @Field(() => Int)
  previousQuantity: number;

  @Field(() => Int)
  newQuantity: number;

  @Field(() => String, { nullable: true })
  reason?: string | null;

  @Field()
  createdByName: string;

  @Field()
  createdAt: Date;
}