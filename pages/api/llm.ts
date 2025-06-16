import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  const { message, context } = req.body
  
  // Build context prompt
  let contextPrompt = 'You are a philosophical guide in an interactive visualization of philosophy through history. '
  
  if (context?.philosopher) {
    contextPrompt += `The user is currently exploring ${context.philosopher.name}, `
    contextPrompt += `a ${context.philosopher.era} philosopher known for work in ${context.philosopher.primaryDomain}. `
    
    if (context.philosopher.influences?.length > 0) {
      contextPrompt += `They were influenced by: ${context.philosopher.influences.join(', ')}. `
    }
  }
  
  contextPrompt += 'Provide insightful, educational responses about philosophy, focusing on connections between ideas and thinkers across time.'
  
  try {
    // Call your LLM API here (OpenAI, Anthropic, etc.)
    // For now, return a mock response
    const response = generatePhilosophicalResponse(message, context, contextPrompt)
    
    res.status(200).json({ response })
  } catch (error) {
    console.error('LLM API error:', error)
    res.status(500).json({ error: 'Failed to generate response' })
  }
}

interface PhilosopherContext {
  philosopher?: {
    name: string
    era: string
    primaryDomain: string
    influences?: string[]
  }
  currentView?: string
  visiblePhilosophers?: string[]
}

function generatePhilosophicalResponse(message: string, context: PhilosopherContext | null, contextPrompt: string): string {
  // This would be replaced with actual LLM API call
  // Example usage with OpenAI:
  // const response = await openai.createChatCompletion({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: contextPrompt },
  //     { role: "user", content: message }
  //   ]
  // })
  // return response.data.choices[0].message.content
  
  // For now, return a mock response that uses the context
  if (context?.philosopher) {
    return `[Context: ${contextPrompt.substring(0, 50)}...] Regarding ${context.philosopher.name}: This philosopher's work in ${context.philosopher.primaryDomain} during the ${context.philosopher.era} era represents a significant contribution to human thought. Would you like to explore their connections to other philosophers or dive deeper into their key ideas?`
  }
  
  return "I'm here to guide you through the philosophical nexus. You can ask about specific philosophers, explore connections between thinkers, or discuss philosophical concepts across different eras."
} 