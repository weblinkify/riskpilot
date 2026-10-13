import { SchemaLink } from '@apollo/client/link/schema';
import { createMockSchema } from './mock-graphql';
import { mockDb } from './mock-db';

let link: SchemaLink | null = null;

/** Apollo link that executes operations in the browser against the backend schema + mock resolvers. */
export function mockSchemaLink(): SchemaLink {
  link ??= new SchemaLink({ schema: createMockSchema(mockDb()) });
  return link;
}
