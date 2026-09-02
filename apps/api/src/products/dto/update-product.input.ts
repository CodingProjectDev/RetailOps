import { Field, Float, InputType, Int } from "@nestjs/graphql";

@InputType()
export class UpdateProductInput {
  @Field()
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  barcode?: string;

  @Field(() => String, { nullable: true })
  sku?: string;

  @Field(() => String, { nullable: true })
  brand?: string;

  @Field(() => String, { nullable: true })
  categoryId?: string;

  @Field(() => Float, { nullable: true })
  costPrice?: number;

  @Field(() => Float, { nullable: true })
  sellingPrice?: number;

  @Field(() => Int, { nullable: true })
  minimumStock?: number;

  @Field(() => Boolean, { nullable: true })
  taxable?: boolean;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}