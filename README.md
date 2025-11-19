# Puls AI - Physics Problem Solver

Puls AI is a Next.js web application designed to help users solve and understand physics problems with the assistance of Artificial Intelligence. 

## Features

-   **Problem Input Flexibility**: Users can describe their physics problem either by typing the text directly or by uploading an image of the problem statement.
-   **Dual Modes**:
    -   **Analyze Solution**: Upload your attempted solution and receive AI feedback on errors, correct solution, and a rating.
    -   **Solve Direct**: Get step-by-step solutions to physics problems without submitting your own attempt.
-   **AI-Powered Analysis & Solving**:
    -   Analyze mode still uses Groq's Llama 4 Scout AI model to inspect user solutions.
    -   The direct solving experience now streams responses from the ElevenLabs PULS AI agent via their JavaScript SDK.
    -   Analyze uploaded solutions for errors and provide targeted feedback.
    -   Generate complete step-by-step solutions to physics problems.
    -   Offer detailed explanations for each step of the solution.
    -   Provide formulas used and final answers with proper units.
    -   Offer ratings for submitted solutions, taking into account numerical approximations.
-   **Romanian Language Support**: All interactions and AI responses are in Romanian.
-   **Modern Tech Stack**: Built with Next.js (App Router), TypeScript, Tailwind CSS, and ShadCN UI components for a responsive and modern user experience.

## How It Works

**Mode 1: Analyze Your Solution**
1.  Enter the problem text or upload an image of the problem.
2.  Upload one or more images of your handwritten or typed solution.
3.  The AI analyzes your solution and provides feedback.
4.  Receive a detailed analysis including the correct solution, error breakdown, and a rating out of 10 points.

**Mode 2: Solve Directly**
1.  Enter the problem text or upload an image of the problem.
2.  (Optional) Specify additional context if the image contains multiple exercises.
3.  The AI generates a complete step-by-step solution with detailed explanations.

This project aims to provide an interactive learning tool for physics students, allowing them to get instant feedback and guidance on their problem-solving skills.

## How to Run the Project

Follow these steps to get the project up and running on your local machine.

### Prerequisites

-   Node.js (version 18.x or later recommended)
-   npm or yarn

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/puls-ai.git
    cd puls-ai
    ```
    *(Replace `your-username` with your actual GitHub username or the appropriate repository URL if it's hosted elsewhere.)*

2.  **Install dependencies:**

    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and configure the AI credentials:

    ```env
    GROQ_API_KEY=your_groq_api_key_here
    ```
    Replace `your_groq_api_key_here` with your actual API key from [Groq Console](https://console.groq.com/).
    
    **Optional:** The application can be configured to use a specific model. By default, it uses `meta-llama/llama-4-scout-17b-16e-instruct`. You can override this by adding:
    ```env
    GROQ_MODEL=your_preferred_model
    ```

    For the ElevenLabs-powered solving flow you also need the public agent identifier:

    ```env
    NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxxx
    ```

    - For public ElevenLabs agents the `agentId` is all you need.
    - If you migrate to private agents, expose either a short-lived signed URL or WebRTC conversation token through your own backend and pass it from the client to `Conversation.startSession` as described in the [official ElevenLabs docs](https://elevenlabs.io/docs/agents-platform/libraries/java-script).

### Running the Application

The application runs as a single Next.js server with API routes handling the AI processing.

1.  **Start the Next.js development server:**

    In the project root directory, run:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    This will start the Next.js application on `http://localhost:9002` (as per the `package.json` script).

2.  **Access the application:**

    Open your web browser and navigate to `http://localhost:9002` (or the port specified in your terminal).

You should now have Puls AI running locally!

## Technology Stack

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **AI Processing**:
  - Groq API (Llama 4 Scout) for solution analysis workflows
  - ElevenLabs Agents JS SDK for real-time conversations in the solving workflow
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI (Radix UI primitives)
- **Markdown Rendering**: react-markdown with remark and rehype plugins for physics equations
