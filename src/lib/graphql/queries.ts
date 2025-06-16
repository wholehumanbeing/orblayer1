import { gql } from '@apollo/client'

export const GET_ALL_PHILOSOPHERS = gql`
  query GetAllPhilosophers($era: String, $domain: String) {
    allPhilosophers(era: $era, domain: $domain) {
      id
      name
      birthYear
      deathYear
      era
      primaryDomain
      spiralDynamicsStage
      domains {
        domain {
          name
        }
        strength
      }
      influencedBy {
        id
        name
      }
    }
  }
`

export const GET_PHILOSOPHER_DETAIL = gql`
  query GetPhilosopherDetail($id: ID!) {
    philosopher(id: $id) {
      id
      name
      birthYear
      deathYear
      era
      primaryDomain
      spiralDynamicsStage
      domains {
        domain {
          name
          description
        }
        strength
        summary
      }
      influencedBy {
        id
        name
        primaryDomain
      }
      influenced {
        id
        name
        primaryDomain
      }
      contemporaries {
        philosopher {
          id
          name
        }
        overlapYears
      }
      positions {
        dimension
        position
        argument
      }
    }
  }
`

export const GET_INFLUENCE_TRACE = gql`
  query GetInfluenceTrace($fromId: ID!, $toId: ID!) {
    trace(fromId: $fromId, toId: $toId) {
      path {
        id
        name
        birthYear
        primaryDomain
      }
      totalDistance
      connections {
        from {
          id
          name
        }
        to {
          id
          name
        }
        strength
      }
    }
  }
` 