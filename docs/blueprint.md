# **App Name**: Puls AI - Physics Problem Solver

## Core Features:

### Mode 1: Analyze Your Solution
- **Problem Input**: Users can input physics problems via text or image upload
- **Solution Upload**: Users can upload multiple images of their attempted solutions
- **AI Analysis**: Analyzes the user's solution for errors using Groq's Llama 4 Scout AI model
- **Feedback**: Provides targeted feedback on mistakes
- **Rating**: Assigns a score out of 10 points, with tolerance for numerical approximations
- **Correct Solution**: Displays the correct solution for comparison

### Mode 2: Solve Directly
- **Problem Input**: Users can input physics problems via text or image upload
- **Context Specification**: Optional field for specifying which exercise to solve if multiple are present
- **AI Solution Generation**: Generates complete step-by-step solutions
- **Detailed Explanations**: Provides explanations for each step of the solution
- **Formula Display**: Shows all formulas used with explanations
- **Final Answer**: Displays final answer with proper units

## Technical Implementation:

- **AI Model**: Groq API with Llama 4 Scout (meta-llama/llama-4-scout-17b-16e-instruct)
- **Language**: All interactions and responses in Romanian
- **Image Support**: Vision-capable model processes images of problems and handwritten solutions
- **Error Tolerance**: Applies reasonable tolerance for numerical approximations in solutions
- **Request Throttling**: Implemented to manage API rate limits

## Style Guidelines:

- Primary color: Dark blue (#1A237E) for a professional and trustworthy feel.
- Secondary color: Light gray (#EEEEEE) for backgrounds and content separation.
- Accent: Teal (#00BCD4) for interactive elements and highlights.
- Clean, sans-serif fonts for easy readability of physics equations and explanations.
- Use clear, consistent icons to represent different physics concepts and actions.
- A clean, structured layout with clear sections for problem input, solution display, and error feedback.

## API Integration:

- **Groq API**: Used for AI processing via OpenAI-compatible Chat Completions API
- **Environment Variables**: 
  - `GROQ_API_KEY`: Required for API access
  - `GROQ_MODEL`: Optional, defaults to llama-4-scout-17b-16e-instruct
- **Request Processing**: Server-side API routes handle AI processing with proper error handling

## Original User Request:
Hello i want you to help me create an app that verifies physics problems when you add a photo of a physics problem and behind it to be a table with answears and the ai to give the result of the paper sheet based on the table of results, then if you get something wrong the ai should tell you where you were mistaken and go wrong
  