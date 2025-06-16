import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

// Add logging to track Apollo Client initialization
console.log('[Apollo Client] Initializing Apollo Client configuration')

const httpLink = createHttpLink({
  uri: '/api/graphql',
  credentials: 'same-origin',
})

// Add error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error('[Apollo Client] GraphQL error:', {
        message,
        locations,
        path,
        operation: operation.operationName
      })
    })
  }

  if (networkError) {
    console.error('[Apollo Client] Network error:', {
      message: networkError.message,
      name: networkError.name,
      stack: networkError.stack,
      operation: operation.operationName
    })
    
    // Check if it's a connection error
    if ('statusCode' in networkError) {
      console.error('[Apollo Client] HTTP status code:', (networkError as any).statusCode)
    }
  }
})

// Add request logging
const loggingLink = setContext((_, { headers }) => {
  console.log('[Apollo Client] Making GraphQL request')
  return {
    headers: {
      ...headers,
    }
  }
})

export const apolloClient = new ApolloClient({
  link: errorLink.concat(loggingLink.concat(httpLink)),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          allPhilosophers: {
            merge(existing = [], incoming) {
              console.log('[Apollo Client] Merging philosophers data:', { 
                existingCount: existing.length, 
                incomingCount: incoming.length 
              })
              return incoming
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: true,
})

console.log('[Apollo Client] Apollo Client instance created successfully') 