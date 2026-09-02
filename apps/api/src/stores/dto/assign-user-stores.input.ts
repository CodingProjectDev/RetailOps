import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class AssignUserStoresInput {
  @Field()
  userId: string;

  @Field(() => [String])
  storeIds: string[];
}
