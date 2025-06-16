import { ApolloClient, InMemoryCache } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from './graphql/typeDefs'

// Sample philosopher data for development
const mockPhilosophers = [
  {
    id: '1',
    name: 'Socrates',
    birthYear: -470,
    deathYear: -399,
    era: 'Ancient',
    primaryDomain: 'ethics',
    spiralDynamicsStage: 'Blue',
    domains: [
      { domain: { name: 'ethics' }, strength: 0.9 },
      { domain: { name: 'epistemology' }, strength: 0.8 }
    ],
    influencedBy: [],
    influenced: [{ id: '2', name: 'Plato', primaryDomain: 'metaphysics' }]
  },
  {
    id: '2',
    name: 'Plato',
    birthYear: -428,
    deathYear: -348,
    era: 'Ancient',
    primaryDomain: 'metaphysics',
    spiralDynamicsStage: 'Orange',
    domains: [
      { domain: { name: 'metaphysics' }, strength: 0.95 },
      { domain: { name: 'politics' }, strength: 0.7 }
    ],
    influencedBy: [{ id: '1', name: 'Socrates' }],
    influenced: [{ id: '3', name: 'Aristotle', primaryDomain: 'logic' }]
  },
  {
    id: '3',
    name: 'Aristotle',
    birthYear: -384,
    deathYear: -322,
    era: 'Ancient',
    primaryDomain: 'logic',
    spiralDynamicsStage: 'Orange',
    domains: [
      { domain: { name: 'logic' }, strength: 0.95 },
      { domain: { name: 'ethics' }, strength: 0.8 },
      { domain: { name: 'politics' }, strength: 0.75 }
    ],
    influencedBy: [{ id: '2', name: 'Plato' }],
    influenced: []
  }
]

const resolvers = {
  Query: {
    allPhilosophers: (_: any, args: any) => {
      console.log('[Mock Apollo] Returning mock philosophers data')
      return mockPhilosophers
    },
    philosopher: (_: any, { id }: { id: string }) => {
      return mockPhilosophers.find(p => p.id === id)
    },
    trace: (_: any, { fromId, toId }: { fromId: string, toId: string }) => {
      console.log('[Mock Apollo] Mock trace requested from', fromId, 'to', toId)
      return {
        path: mockPhilosophers.filter(p => [fromId, toId].includes(p.id)),
        totalDistance: 1,
        connections: []
      }
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

export const mockApolloClient = new ApolloClient({
  link: new SchemaLink({ schema }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})

console.log('[Mock Apollo Client] Created with sample data') 