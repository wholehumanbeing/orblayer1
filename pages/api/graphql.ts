import { createYoga } from 'graphql-yoga'
import { Neo4jGraphQL } from '@neo4j/graphql'
import neo4j from 'neo4j-driver'
import { typeDefs } from '@/lib/graphql/typeDefs'

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
)

const neoSchema = new Neo4jGraphQL({ 
  typeDefs, 
  driver,
  features: {
    filters: {
      String: {
        MATCHES: true
      }
    }
  }
})

const schema = await neoSchema.getSchema()

export default createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response }
})

export const config = {
  api: {
    bodyParser: false
  }
} 