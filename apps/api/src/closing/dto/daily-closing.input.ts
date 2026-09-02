import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class DailyClosingInput {
  @Field(() => String)
  storeId: string;

  @Field(() => String)
  date: string;
}
