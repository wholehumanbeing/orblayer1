export const typeDefs = `#graphql
  type Philosopher {
    id: ID!
    name: String!
    birthYear: Int!
    deathYear: Int
    era: String!
    primaryDomain: String!
    spiralDynamicsStage: String
    
    domains: [DomainConnection!]!
    influencedBy: [Philosopher!]!
    influenced: [Philosopher!]!
    contemporaries: [ContemporaryConnection!]!
    positions: [PhilosophicalPosition!]!
  }
  
  type Domain {
    name: String!
    description: String!
    philosophers: [Philosopher!]!
  }
  
  type DomainConnection {
    domain: Domain!
    strength: Float!
    summary: String!
  }
  
  type ContemporaryConnection {
    philosopher: Philosopher!
    overlapYears: Int!
  }
  
  type PhilosophicalPosition {
    dimension: String!
    position: String!
    argument: String!
    philosopher: Philosopher!
  }
  
  type InfluenceTrace {
    path: [Philosopher!]!
    totalDistance: Int!
    connections: [InfluenceConnection!]!
  }
  
  type InfluenceConnection {
    from: Philosopher!
    to: Philosopher!
    strength: Float
  }
  
  type Query {
    philosopher(id: ID!): Philosopher
    allPhilosophers(
      era: String
      domain: String
      birthYearMin: Int
      birthYearMax: Int
    ): [Philosopher!]!
    
    domains: [Domain!]!
    
    trace(fromId: ID!, toId: ID!): InfluenceTrace
    
    philosophersByTimeRange(startYear: Int!, endYear: Int!): [Philosopher!]!
    
    search(query: String!): [Philosopher!]!
  }
` 