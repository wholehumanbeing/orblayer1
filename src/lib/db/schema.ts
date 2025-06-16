// Node Types
export const nodeTypes = {
  Philosopher: {
    properties: {
      id: 'String!',
      name: 'String!',
      birthYear: 'Int!',
      deathYear: 'Int',
      era: 'String!',
      birthLocation: 'Point',
      spiralDynamicsStage: 'String',
      primaryDomain: 'String!'
    }
  },
  Domain: {
    properties: {
      name: 'String!',
      description: 'String!'
    }
  },
  Concept: {
    properties: {
      name: 'String!',
      description: 'String'
    }
  },
  PhilosophicalPosition: {
    properties: {
      dimension: 'String!', // e.g., "beingVsBecoming"
      position: 'String!',
      argument: 'String!',
      philosopherId: 'String!'
    }
  }
}

// Relationship Types
export const relationshipTypes = {
  INFLUENCED: {
    properties: {
      strength: 'Float',
      specificIdeas: '[String]'
    }
  },
  WORKED_IN: {
    properties: {
      strength: 'Float!',
      summary: 'String!'
    }
  },
  ASSOCIATED_WITH: {
    properties: {}
  },
  HOLDS_POSITION: {
    properties: {
      justification: 'String'
    }
  },
  CONTEMPORARY_OF: {
    properties: {
      overlapYears: 'Int'
    }
  }
} 