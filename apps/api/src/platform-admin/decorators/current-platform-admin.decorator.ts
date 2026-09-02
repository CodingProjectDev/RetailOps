
import {
  createParamDecorator,
  ExecutionContext
} from "@nestjs/common";
import {
  GqlExecutionContext
} from "@nestjs/graphql";

export const CurrentPlatformAdmin =
  createParamDecorator(
    (
      _data: unknown,
      context: ExecutionContext
    ) => {
      const gql =
        GqlExecutionContext.create(
          context
        );

      return gql
        .getContext()
        .req
        .platformAdmin;
    }
  );
