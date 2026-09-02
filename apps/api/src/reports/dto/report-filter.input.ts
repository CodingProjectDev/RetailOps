import { Field, GraphQLISODateTime, InputType } from "@nestjs/graphql";

@InputType()
export class ReportFilterInput {
  @Field(() => String)
  storeId: string;

  @Field(() => GraphQLISODateTime)
  from: Date;

  @Field(() => GraphQLISODateTime)
  to: Date;
}
