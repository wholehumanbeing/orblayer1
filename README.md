# The Philosophical Nexus

An interactive 3D visualization of philosophy through history, showcasing the relationships and influences between philosophers across time and domains.

## Features

- **3D Spiral Visualization**: Philosophers positioned chronologically on an interactive spiral
- **Multiple View Modes**: Switch between Orb (spiral) and Helix (timeline) views
- **Domain Color Coding**: Visual representation of philosophical domains (ethics, politics, metaphysics, epistemology, aesthetics)
- **Influence Connections**: Dynamic visualization of how philosophers influenced each other
- **Fractillion Trace System**: Animated particle traces showing philosophical influence paths
- **AI Philosophical Guide**: Context-aware chat interface for exploring philosophical concepts
- **Filters & Search**: Filter by era, domain, and search for specific philosophers
- **Performance Optimizations**: GPU instancing, LOD system, and quality settings

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **3D Graphics**: Three.js with GPU instancing
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **API**: GraphQL with Apollo Client
- **Animations**: Framer Motion, GSAP

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/philosophical-nexus.git
cd philosophical-nexus
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# GraphQL API endpoint
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql

# LLM API (optional - for AI chat feature)
OPENAI_API_KEY=your_openai_api_key
# or
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture Overview

### Directory Structure

```
orblayer1/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── types/             # TypeScript type definitions
│       └── philosopher.d.ts
├── components/             # React components
│   ├── Globe.tsx          # Main 3D visualization
│   ├── Sidebar.tsx        # Filter sidebar
│   ├── PhilosopherPanel.tsx
│   └── ...
├── src/
│   ├── components/        # Additional components
│   │   └── LLMPanel.tsx   # AI chat interface
│   ├── lib/
│   │   ├── three/         # Three.js utilities
│   │   │   ├── FractillionTrace.ts
│   │   │   └── layouts.ts
│   │   └── graphql/       # GraphQL queries
│   │       └── queries.ts
│   └── store/             # Zustand stores
│       ├── philosopherStore.ts
│       ├── filterStore.ts
│       └── sceneStore.ts
├── pages/
│   └── api/              # API routes
│       └── llm.ts        # LLM endpoint
└── DATA/                 # Philosopher data files

```

### Key Components

#### Globe.tsx
The main 3D visualization component that:
- Renders philosophers as nodes on a spiral/helix
- Handles user interactions (click, hover, navigation)
- Manages Three.js scene, camera, and renderer
- Integrates the FractillionTrace system
- Implements performance optimizations

#### FractillionTrace.ts
Advanced particle system for visualizing philosophical influences:
- Creates animated particle paths between philosophers
- Color-coded by influence strength
- Temporal curve calculations based on time periods
- Efficient particle pooling for performance

#### LLMPanel.tsx
AI-powered chat interface that:
- Provides context-aware philosophical guidance
- Integrates with selected philosopher data
- Maintains conversation history
- Supports real-time responses

### State Management

The application uses Zustand for state management with three main stores:

1. **philosopherStore**: Manages philosopher data and selection
2. **filterStore**: Handles filtering by era, domain, and search
3. **sceneStore**: Controls visualization settings (view mode, quality, speed)

## Usage Guide

### Navigation
- **Mouse**: Click and drag to rotate the view
- **Scroll**: Zoom in/out
- **Click**: Select a philosopher to view details

### Keyboard Shortcuts
- **Space**: Pause/Resume animation
- **L**: Toggle legend
- **?**: Show help modal

### Features

#### Viewing Philosopher Details
Click on any philosopher node to:
- View their biographical information
- See their philosophical contributions by domain
- Explore their influences and who they influenced
- Discover contemporaries

#### Trace Philosophical Influences
When viewing a philosopher:
- Click "Show Influences" to visualize connection paths
- Animated particles show the flow of ideas
- Color intensity indicates influence strength

#### AI Philosophical Guide
- Click the chat button (bottom right) to open
- Ask questions about philosophy, specific philosophers, or concepts
- The AI provides context-aware responses based on your current view

## Performance Optimization

The application implements several optimization strategies:

1. **GPU Instancing**: All philosopher nodes rendered in a single draw call
2. **Level of Detail (LOD)**: Reduced detail for distant objects
3. **Frustum Culling**: Only render visible philosophers
4. **Quality Settings**: High/Medium/Low graphics options
5. **Particle Pooling**: Efficient memory management for traces

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Write descriptive commit messages
- Add comments for complex logic

## Future Enhancements

- [ ] VR/AR support for immersive exploration
- [ ] Collaborative features for educational use
- [ ] Extended philosopher database
- [ ] Advanced AI integration with source citations
- [ ] Export visualization as images/videos
- [ ] Mobile optimization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for excellent documentation
- Stanford Encyclopedia of Philosophy for philosophical data
- All contributors and testers

---

Built with ❤️ by the Philosophical Nexus Team
