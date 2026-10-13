import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Generates TypeScript types + typed documents from the backend's GraphQL schema.
 * Output is committed; CI runs `npm run codegen:check` and fails if it is out of date.
 */
const config: CodegenConfig = {
  overwrite: true,
  schema: '../backend/src/main/resources/graphql/schema.graphqls',
  documents: 'src/app/graphql/**/*.graphql',
  generates: {
    // Full schema types (used by the in-browser mock resolvers).
    'src/app/graphql/schema-types.generated.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsTypes: true,
        avoidOptionals: true,
        maybeValue: 'T | null',
        scalars: { ID: 'string' },
        useTypeImports: true,
      },
    },
    // Operation result/variable types + TypedDocumentNodes (used by the app).
    'src/app/graphql/generated.ts': {
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        enumsAsTypes: true,
        avoidOptionals: { field: true, inputValue: false, object: true, defaultValue: true },
        maybeValue: 'T | null',
        scalars: { ID: 'string' },
        useTypeImports: true,
      },
    },
    'src/app/graphql/schema.generated.ts': {
      plugins: ['./tools/codegen-typedefs-plugin.cjs'],
    },
  },
  hooks: { afterAllFileWrite: ['prettier --write'] },
};

export default config;
