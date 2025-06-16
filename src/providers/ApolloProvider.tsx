"use client"

import { ApolloProvider as BaseApolloProvider } from '@apollo/client'
import { apolloClient } from '@/src/lib/apollo-client'
import { mockApolloClient } from '@/src/lib/apollo-mock-client'
import { ReactNode, useEffect, useState } from 'react'

interface ApolloProviderWrapperProps {
  children: ReactNode
}

export function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  const [client, setClient] = useState(apolloClient)
  const [isUsingMock, setIsUsingMock] = useState(false)

  useEffect(() => {
    console.log('[ApolloProvider] Provider mounted, checking GraphQL endpoint...')
    
    // Test the GraphQL endpoint
    fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`GraphQL endpoint returned ${response.status}`)
      }
      console.log('[ApolloProvider] GraphQL endpoint is available')
    })
    .catch(error => {
      console.warn('[ApolloProvider] GraphQL endpoint not available, switching to mock data:', error.message)
      console.log('[ApolloProvider] This is likely because Neo4j is not configured. Using mock data for development.')
      setClient(mockApolloClient)
      setIsUsingMock(true)
    })
    
    return () => {
      console.log('[ApolloProvider] Provider unmounting')
    }
  }, [])

  useEffect(() => {
    if (isUsingMock) {
      console.log('[ApolloProvider] ⚠️  Using MOCK data - configure Neo4j for real data')
    }
  }, [isUsingMock])

  return (
    <BaseApolloProvider client={client}>
      {isUsingMock && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-md z-50 text-sm">
          ⚠️ Using mock data - Neo4j not configured
        </div>
      )}
      {children}
    </BaseApolloProvider>
  )
} 