import neo4j from 'neo4j-driver'
import fs from 'fs/promises'
import path from 'path'

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  )
)

async function clearDatabase(session) {
  await session.run('MATCH (n) DETACH DELETE n')
  console.log('Database cleared')
}

async function createConstraints(session) {
  // Create uniqueness constraints
  await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (p:Philosopher) REQUIRE p.id IS UNIQUE')
  await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (d:Domain) REQUIRE d.name IS UNIQUE')
  await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE')
  
  // Create indexes for performance
  await session.run('CREATE INDEX IF NOT EXISTS FOR (p:Philosopher) ON (p.birthYear)')
  await session.run('CREATE INDEX IF NOT EXISTS FOR (p:Philosopher) ON (p.era)')
}

async function ingestPhilosopher(session, data) {
  // Create philosopher node
  const createQuery = `
    CREATE (p:Philosopher {
      id: $id,
      name: $name,
      birthYear: $birthYear,
      deathYear: $deathYear,
      era: $era,
      primaryDomain: $primaryDomain,
      spiralDynamicsStage: $spiralDynamicsStage
    })
    RETURN p
  `
  
  await session.run(createQuery, {
    id: data.id,
    name: data.name,
    birthYear: data.birthYear,
    deathYear: data.deathYear || null,
    era: data.era,
    primaryDomain: data.primaryDomain,
    spiralDynamicsStage: data.spiralDynamicsStage || null
  })
  
  // Create domain relationships
  for (const [domain, summary] of Object.entries(data.domainSummaries || {})) {
    await session.run(`
      MATCH (p:Philosopher {id: $philosopherId})
      MERGE (d:Domain {name: $domain})
      CREATE (p)-[:WORKED_IN {strength: $strength, summary: $summary}]->(d)
    `, {
      philosopherId: data.id,
      domain: domain.charAt(0).toUpperCase() + domain.slice(1),
      strength: data.domainStrengths?.[domain] || 50,
      summary: summary
    })
  }
  
  // Store influence relationships to process after all philosophers are created
  return data.influences || []
}

async function createInfluenceRelationships(session, philosopherId, influences) {
  for (const influencerId of influences) {
    await session.run(`
      MATCH (influenced:Philosopher {id: $influencedId})
      MATCH (influencer:Philosopher {id: $influencerId})
      CREATE (influencer)-[:INFLUENCED]->(influenced)
    `, {
      influencedId: philosopherId,
      influencerId: influencerId
    })
  }
}

async function main() {
  const session = driver.session()
  
  try {
    await clearDatabase(session)
    await createConstraints(session)
    
    // Read all philosopher JSON files from DATA directory
    const dataDir = path.join(process.cwd(), 'DATA')
    const files = await fs.readdir(dataDir)
    const jsonFiles = files.filter(f => f.endsWith('.json'))
    
    const influenceMap = new Map()
    
    // First pass: create all philosopher nodes
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(dataDir, file), 'utf-8')
      const data = JSON.parse(content)
      
      console.log(`Ingesting ${data.name}...`)
      const influences = await ingestPhilosopher(session, data)
      
      if (influences.length > 0) {
        influenceMap.set(data.id, influences)
      }
    }
    
    // Second pass: create influence relationships
    for (const [philosopherId, influences] of influenceMap.entries()) {
      await createInfluenceRelationships(session, philosopherId, influences)
    }
    
    // Create contemporary relationships based on overlapping lifespans
    await session.run(`
      MATCH (p1:Philosopher)
      MATCH (p2:Philosopher)
      WHERE p1.id < p2.id
        AND p1.birthYear <= p2.deathYear
        AND p2.birthYear <= p1.deathYear
      WITH p1, p2, 
        CASE 
          WHEN p1.deathYear IS NULL OR p2.deathYear IS NULL THEN 0
          ELSE 
            CASE 
              WHEN p1.deathYear < p2.deathYear THEN p1.deathYear - p2.birthYear
              ELSE p2.deathYear - p1.birthYear
            END
        END AS overlapYears
      CREATE (p1)-[:CONTEMPORARY_OF {overlapYears: overlapYears}]->(p2)
      CREATE (p2)-[:CONTEMPORARY_OF {overlapYears: overlapYears}]->(p1)
    `)
    
    console.log('Data ingestion complete!')
    
  } finally {
    await session.close()
    await driver.close()
  }
}

main().catch(console.error) 