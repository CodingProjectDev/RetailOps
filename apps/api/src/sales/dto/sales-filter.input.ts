import { Field, Float, GraphQLISODateTime, InputType } from "@nestjs/graphql";

@InputType()
export class SalesFilterInput {
  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  cashierId?: string;

  @Field(() => String, { nullable: true })
  paymentMethod?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  from?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  to?: Date;

  @Field(() => Float, { nullable: true })
  minTotal?: number;

  @Field(() => Float, { nullable: true })
  maxTotal?: number;
}
