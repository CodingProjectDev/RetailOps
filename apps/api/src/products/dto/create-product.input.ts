import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field()
  barcode: string;

  @Field()
  sku: string;

  @Field(() => String, { nullable: true })
  brand?: string | null;

  @Field()
  categoryId: string;

  @Field(() => Float)
  costPrice: number;

  @Field(() => Float)
  sellingPrice: number;

  @Field(() => Int, { defaultValue: 5 })
  minimumStock: number;

  @Field(() => Int, { defaultValue: 0 })
  startingQuantity: number;

  @Field(() => Boolean, { defaultValue: true })
  taxable: boolean;

  @Field(() => Boolean, { defaultValue: true })
  active: boolean;
}