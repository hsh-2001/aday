import { buildSchema, graphql } from "graphql";
import { getHeader, readBody } from "h3";
import { rootValue } from "../graphql/resolvers.js";
import { typeDefs } from "../graphql/schema.js";
import { getUserFromAuthorization } from "../utils/auth.js";

const schema = buildSchema(typeDefs);

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const result = await graphql({
      schema,
      source: body?.query,
      rootValue,
      contextValue: {
        user: getUserFromAuthorization(getHeader(event, "authorization")),
      },
      variableValues: body?.variables,
      operationName: body?.operationName,
    });

    if (result.errors?.length) {
      console.error(
        "GraphQL errors:",
        result.errors.map((error) => ({
          message: error.message,
          path: error.path,
          originalError: error.originalError?.message,
        })),
      );
    }

    return result;
  } catch (error) {
    console.error("GraphQL route failed:", error);

    return {
      errors: [
        {
          message: error instanceof Error ? error.message : "GraphQL route failed.",
        },
      ],
    };
  }
});
