import { inject } from '@angular/core';
import { ApolloLink, InMemoryCache } from '@apollo/client';
import { HttpLink } from 'apollo-angular/http';
import { from, switchMap } from 'rxjs';
import { runtimeConfig } from './runtime-config';

/**
 * Mock mode: a link that lazy-loads the in-browser GraphQL executor (schema + seed data live in a
 * separate chunk, so real-mode bundles never ship them).
 * Real mode: plain HTTP to the Spring GraphQL endpoint.
 */
export function apolloOptions() {
  const link =
    runtimeConfig.apiMode === 'mock'
      ? new ApolloLink((operation) =>
          from(import('../mock/mock-link')).pipe(
            switchMap((m) => m.mockSchemaLink().request(operation)),
          ),
        )
      : inject(HttpLink).create({ uri: `${runtimeConfig.apiBaseUrl}/graphql` });

  return {
    link,
    cache: new InMemoryCache({
      typePolicies: {
        // Nested value objects without ids are merged into their parent.
        Applicant: { keyFields: false },
        Broker: { keyFields: false },
        PropertyDetails: { keyFields: false },
      },
    }),
    defaultOptions: {
      query: { fetchPolicy: 'network-only' as const },
      watchQuery: { fetchPolicy: 'cache-and-network' as const },
    },
  };
}
