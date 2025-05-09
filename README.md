# Puls AI - Physics Problem Solver

Puls AI is a Next.js web application designed to help users solve and understand physics problems with the assistance of Artificial Intelligence. 

## Features

-   **Problem Input Flexibility**: Users can describe their physics problem either by typing the text directly or by uploading an image of the problem statement.
-   **Solution Submission**: Users can upload one or more images of their attempted solution to the physics problem.
-   **AI-Powered Analysis**: The application leverages Genkit and Google's Gemini AI model to:
    -   Provide a step-by-step correct solution to the submitted problem.
    -   Analyze the user's uploaded solution for errors.
    -   Offer constructive feedback on the user's attempt.
    -   Provide a rating for the user's solution, taking into account numerical approximations.
-   **Romanian Language Support**: All interactions and AI responses are in Romanian.
-   **Modern Tech Stack**: Built with Next.js (App Router), TypeScript, Tailwind CSS, and ShadCN UI components for a responsive and modern user experience.

## How It Works

1.  **Submit Problem**: The user enters the problem text or uploads an image of the problem.
2.  **Submit Solution**: The user uploads images of their handwritten or typed solution.
3.  **AI Analysis**: The backend, using Genkit, processes the inputs and sends them to the Gemini model.
4.  **Get Feedback**: The AI returns a detailed analysis including the correct solution, error breakdown in the user's attempt, and a score.

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

    Create a `.env` file in the root of the project by copying the example file (if one exists, otherwise create it from scratch):

    ```
    cp .env.example .env 
    ```
    *(If `.env.example` doesn't exist, create `.env` manually.)*

    Open the `.env` file and add your Google Generative AI API key:

    ```env
    GOOGLE_GENAI_API_KEY=YOUR_GEMINI_API_KEY
    ```
    Replace `YOUR_GEMINI_API_KEY` with your actual API key from Google AI Studio.

### Running the Application

The application consists of two main parts that need to be run: the Genkit development server (for AI functionalities) and the Next.js development server (for the frontend).

1.  **Start the Genkit development server:**

    Open a new terminal window/tab in the project root and run:
    ```bash
    npm run genkit:dev
    ```
    Or using yarn:
    ```bash
    yarn genkit:dev
    ```
    This will typically start the Genkit server, often on port 3400 (or as configured). Keep this terminal running.

2.  **Start the Next.js development server:**

    Open another new terminal window/tab in the project root and run:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    This will start the Next.js application, usually on `http://localhost:9002` (as per the `package.json` script).

3.  **Access the application:**

    Open your web browser and navigate to `http://localhost:9002` (or the port specified in your terminal).

You should now have Puls AI running locally!
