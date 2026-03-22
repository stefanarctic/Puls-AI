# Puls-AI: Tech Stack & Architecture Documentation

## Project Overview

**Puls-AI** is a Next.js web application designed to help students solve and understand physics problems using Artificial Intelligence. The application provides two main modes:

1. **Analyze Solution Mode**: Users upload their attempted solutions and receive AI-powered feedback, error analysis, and ratings.
2. **Solve Direct Mode**: Users submit physics problems and receive complete step-by-step solutions with detailed explanations.

All interactions and AI responses are in Romanian, making it an educational tool tailored for Romanian-speaking physics students.

---

## Technology Stack

### Frontend Framework & Core
- **Next.js 15.2.3** (App Router)
  - Server-side rendering and API routes
  - File-based routing with the App Router architecture
  - Server Actions for form handling and data mutations
- **React 18.3.1** with TypeScript 5
  - Type-safe component development
  - Modern React hooks and patterns
- **TypeScript** - Full type safety across the application

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **ShadCN UI** - Component library built on Radix UI primitives:
  - `@radix-ui/react-label`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-toast`
  - `@radix-ui/react-tooltip`
- **Lucide React** - Icon library
- **class-variance-authority** & **clsx** - Conditional styling utilities
- **tailwind-merge** & **tailwindcss-animate** - Tailwind utilities

### AI & Backend Processing
- **Groq API** - Primary AI inference platform (actively used)
  - Model: `meta-llama/llama-4-scout-17b-16e-instruct` (default, configurable)
  - OpenAI-compatible Chat Completions API
  - Multimodal support (text + images)
  - Direct API calls via custom `groqChat()` wrapper
- **Genkit 1.0.4** - Used only for Zod schema validation
  - Only imports `z` (Zod) from Genkit for type-safe schemas
  - **Not used for AI processing** - Groq is called directly
  - Note: There's an unused Genkit flow (`detect-error-and-provide-feedback.ts`) with Google AI, but it's not part of the active codebase
- **Custom Request Throttling** - In-memory queue with exponential backoff
  - Prevents rate limiting (429 errors)
  - Configurable retry logic with jitter

### Markdown & Math Rendering
- **react-markdown 9.1.0** - Markdown rendering in React
- **remark-gfm** - GitHub Flavored Markdown support
- **remark-math** - Math equation parsing
- **rehype-katex** - KaTeX math rendering
- **rehype-raw** - Raw HTML support

### Development Tools
- **genkit-cli** - Development server for Genkit flows
- **patch-package** - Dependency patching
- **PostCSS** - CSS processing
- **ESLint** - Code linting (Next.js default)

---

## Architecture & How It Works

### High-Level Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend +    │
│   API Routes)   │
└────────┬────────┘
         │
         ├───► Server Actions (actions.ts)
         │         │
         │         ├───► AI Flows
         │         │      │
         │         │      ├───► solve-physics-problem.ts (uses Groq)
         │         │      └───► analyze-physics-problem.ts (uses Groq)
         │         │
         │         └───► Request Throttle
         │                  │
         │                  └───► Groq API Client (groq.ts)
         │                           │
         │                           └───► Groq API (External)
         │
         Note: Genkit is only used for Zod schemas, not AI processing
         │
         └───► API Routes (/api/*)
                  │
                  ├───► /api/solve
                  └───► /api/analyze
```

### Request Flow

#### 1. Solve Problem Flow
```
User Input (Text/Image)
    ↓
Frontend Component (page.tsx)
    ↓
POST /api/solve
    ↓
handleSolveProblem (actions.ts)
    ↓
solvePhysicsProblem (flow)
    ↓
Request Throttle Queue
    ↓
groqChat (Groq API Client)
    ↓
Groq API (Llama 4 Scout)
    ↓
JSON Response Parsing
    ↓
Structured Output (SolveContractOutput):
  - problemSummary, givenData, numericalResults
  - formulasUsed (string[]), explanation, correctSolution, finalAnswer
```

#### 2. Analyze Solution Flow
```
User Input (Problem + Solution Images)
    ↓
Frontend Component
    ↓
POST /api/analyze
    ↓
handleAnalyzeProblem (actions.ts)
    ↓
analyzePhysicsProblem (flow)
    ↓
Request Throttle Queue
    ↓
groqChat (Groq API Client)
    ↓
Groq API (Llama 4 Scout)
    ↓
JSON Response Parsing
    ↓
Structured Output (AnalyzeContractOutput):
  - rating (string or { obtained, max }), problemSummary, feedbackSummary
  - givenData, numericalResults, formulasUsed, explanation, correctSolution
  - errorAnalysis, finalAnswer, studentWorkReflection (optional)
```

### Key Components

#### 1. **AI Flows** (`src/ai/flows/`)
- **solve-physics-problem.ts**: Generates complete solutions for physics problems
  - Input: Problem text/image, optional context
  - Output: SolveContractOutput (problemSummary, givenData, numericalResults, formulasUsed, explanation, correctSolution, finalAnswer)
  - Uses robust JSON parsing with multiple fallback strategies
  - Handles placeholder detection and content validation

- **analyze-physics-problem.ts**: Analyzes user-submitted solutions
  - Input: Problem text/image, solution images (array), optional context
  - Output: AnalyzeContractOutput (rating, problemSummary, feedbackSummary, givenData, numericalResults, formulasUsed, explanation, correctSolution, errorAnalysis, finalAnswer, studentWorkReflection)
  - Applies tolerance for numerical approximations

#### 2. **Groq API Client** (`src/ai/groq.ts`)
- **Primary AI provider** - All AI processing goes through this client
- OpenAI-compatible Chat Completions API wrapper
- Handles multimodal messages (text + images)
- Automatically detects vision-capable models
- Truncates long text while preserving images
- Configurable model selection via environment variables
- Direct calls from flows (not using Genkit's AI features)

#### 3. **Request Throttling** (`src/ai/request-throttle.ts`)
- In-memory queue system
- Enforces minimum interval between requests (1.5s default)
- Exponential backoff with jitter for retries
- Handles rate limit errors (429) and network errors
- Singleton pattern for shared queue across all flows

#### 4. **Server Actions** (`src/app/actions.ts`)
- Type-safe wrappers around AI flows
- Input validation
- Error handling with Romanian error messages
- Returns `ActionResult<T>` with data/error pattern

#### 5. **API Routes** (`src/app/api/`)
- **`/api/solve`**: Endpoint for solving problems directly
- **`/api/analyze`**: Endpoint for analyzing user solutions
- Both support CORS headers for cross-origin requests
- OPTIONS handlers for preflight requests
- Input validation and error handling

#### 6. **Frontend Pages**
- **`page.tsx`**: Main application page with dual-mode interface
- **`solve/page.tsx`**: Dedicated solve mode page
- **`api-client-example/page.tsx`**: Example client demonstrating API usage

### Data Flow & State Management

- **Client-side**: React hooks (`useState`, `useRef`) for form state
- **Server-side**: Server Actions and API routes handle processing
- **Image Handling**: Files converted to Data URIs (`data:image/...;base64,...`) for transmission
- **Response Format**: Structured JSON with typed schemas using Zod

### Error Handling

1. **Input Validation**: Zod schemas validate inputs at flow level
2. **API Errors**: Groq API errors caught and logged with detailed messages
3. **JSON Parsing**: Multiple fallback strategies for extracting JSON from AI responses
4. **Placeholder Detection**: Validates AI responses aren't generic placeholders
5. **User Feedback**: Romanian error messages displayed via toast notifications

### Environment Configuration

Required:
- `GROQ_API_KEY` - API key for Groq service

Optional:
- `GROQ_MODEL` - Override default model (defaults to `meta-llama/llama-4-scout-17b-16e-instruct`)
- `GOOGLE_GENAI_API_KEY` - For unused Genkit Google AI plugin (not used in active flows)

### Performance Considerations

1. **Request Throttling**: Prevents API rate limits
2. **Image Optimization**: Next.js Image component for optimized image rendering
3. **Server-Side Processing**: AI calls happen server-side to protect API keys
4. **Retry Logic**: Automatic retries with exponential backoff for transient failures
5. **Response Caching**: Not implemented (could be added for repeated queries)

### PULS Integration

- Site-ul PULS apelează `POST /api/analyze` din `ProblemSubmit.jsx`
- Răspunsul folosește `rating` ca obiect `{ obtained, max }` pentru citire directă în Firebase (fără regex)
- La actualizare PULS: citiți `rating.obtained` / `rating.max` în loc de parsare text

### Security

- API keys stored in environment variables (never exposed to client)
- Server-side only AI processing
- Input validation prevents injection attacks
- CORS configured for API routes
- Type-safe operations reduce runtime errors

---

## Development Workflow

### Running the Application
```bash
# Development server (port 9002)
npm run dev

# Genkit development server (for flow testing)
npm run genkit:dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Project Structure
```
src/
├── ai/
│   ├── types/
│   │   └── api-contract.ts # Unified API contract types (AnalyzeContractOutput, SolveContractOutput)
│   ├── flows/              # AI flow definitions
│   │   ├── solve-physics-problem.ts
│   │   └── analyze-physics-problem.ts
│   ├── groq.ts             # Groq API client
│   ├── request-throttle.ts # Rate limiting
│   └── ai-instance.ts      # Genkit instance (optional)
├── app/
│   ├── api/                # API routes
│   │   ├── solve/
│   │   └── analyze/
│   ├── actions.ts          # Server actions
│   ├── page.tsx            # Main page
│   └── solve/              # Solve mode page
└── components/             # UI components (ShadCN)
```

---

## Key Features & Capabilities

1. **Multimodal Input**: Accepts both text and images for problem input
2. **Multiple Solution Images**: Supports analyzing multiple images of a solution
3. **Robust JSON Parsing**: Multiple strategies to extract structured data from AI responses
4. **Romanian Language**: All prompts and responses in Romanian
5. **Detailed Explanations**: Step-by-step solutions with reasoning
6. **Error Tolerance**: Numerical approximation tolerance in grading
7. **Rate Limit Protection**: Built-in throttling prevents API quota exhaustion
8. **Type Safety**: Full TypeScript coverage with Zod schema validation

---

## Future Enhancements (Potential)

- Response caching for repeated queries
- User authentication and solution history
- Export solutions as PDF
- Support for multiple languages
- Batch processing of multiple problems
- Integration with physics formula databases
- Real-time streaming responses for better UX
