
import {
  Field,
  InputType
} from "@nestjs/graphql";

@InputType()
export class CreatePlatformBusinessOwnerInput {
  @Field()
  businessName: string;

  @Field()
  ownerName: string;

  @Field()
  ownerEmail: string;

  @Field()
  temporaryPassword: string;
}
