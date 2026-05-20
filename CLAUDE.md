# SketchSpark - AI-Powered Whiteboard

SketchSpark is a collaborative whiteboard application that leverages AI to help users create and generate diagrams effortlessly.

## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn-ui
- **Canvas Engine**: Fabric.js
- **AI Integration**: 
  - Google Gemini (via `src/lib/graphviz.ts` & `src/lib/mistral.ts`) for diagram generation (Fabric.js JSON).
  - Cohere (via `src/lib/cohere.ts`) for canvas-aware chat.

## Core Architecture
- `src/components/Canvas.tsx`: The heart of the application. Manages the Fabric.js canvas, drawing tools, keyboard shortcuts, and auto-save to `localStorage`.
- `src/components/AIAssistant.tsx`: Interface for AI interactions.
  - **Generate Mode**: Prompts Gemini to produce a JSON structure of Fabric.js objects.
  - **Chat Mode**: Sends canvas description and user prompt to Cohere for textual assistance.
- `src/components/DiagramPreview.tsx`: Allows users to review and potentially modify AI-generated diagrams before adding them to the canvas.
- `src/lib/graphviz.ts`: Low-level integration with Google Gemini API.
- `src/lib/mistral.ts`: High-level logic for prompting Gemini to generate diagram JSON.
- `src/lib/cohere.ts`: Integration with Cohere Chat API.

## Key Concepts
- **Fabric.js JSON**: The AI generates diagrams as JSON arrays of objects (rect, circle, text, line, path) which are then loaded into the Fabric.js canvas.
- **Canvas Description**: The AI Assistant provides a summary of the current canvas objects (e.g., "Canvas contains: 2 rects, 1 circle") to provide context to the LLMs.
- **Theme Awareness**: The application supports light and dark modes, and the AI is instructed to use light colors (like white) for text when the background is dark.

## Development Guidelines
- **Drawing Tools**: New shapes should be added to the `Tool` type in `Canvas.tsx` and handled in `createShape` and `handleMouseDown`/`MouseMove`/`MouseUp`.
- **AI Prompting**: Diagram generation prompts are located in `src/lib/mistral.ts`. Ensure the output format strictly follows the Fabric.js JSON structure.
- **Styling**: Use Tailwind CSS and shadcn-ui components.
- **Canvas State**: Canvas data is saved to `localStorage` under the key `canvasData`.