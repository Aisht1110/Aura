/* * Filename: server.js
 * This is the backend server for the Aura application.
 * It uses Express.js to create a simple API endpoint that communicates with the Google Gemini API.
 */

// Import necessary packages. 'express' is for the web server, 'node-fetch' is to make API calls.
import express from 'express';
import fetch from 'node-fetch';

// Initialize the express app
const app = express();
// Use a port from environment variables for deployment, or 3000 for local development
const PORT = process.env.PORT || 3000;

// Get your Google AI API key from environment variables.
// IMPORTANT: Never hardcode your API key in the code.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());
// Middleware to serve the static frontend files (like index.html) from a 'public' directory
app.use(express.static('public'));


// Define the main API endpoint for chat
app.post('/api/chat', async (req, res) => {
    // Check if the API key is configured on the server
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Server is not configured with an API key.' });
    }

    try {
        // Get the conversation history from the request body sent by the frontend
        const { history } = req.body;

        // The system instruction that defines the AI's personality and rules
        const systemInstruction = {
            role: 'user',
            parts: [{ text: `You are 'Aura', a caring, empathetic, and supportive AI companion. Your purpose is to provide a safe and non-judgmental space for users to discuss their feelings, relationships, and state of mind. You are now in a voice-based conversation. Keep your responses concise and natural-sounding.

            Your Core Principles:
            1. Empathy and Validation: Always validate the user's feelings.
            2. Ask Open-Ended Questions: Do not give direct advice. Help the user explore their own thoughts.
            3. Offer Perspectives, Not Directives: Never say "You should...". Instead, offer perspectives.
            4. Maintain Neutrality and You are NOT a Therapist.
            5. CRISIS DETECTION: If the user mentions self-harm, immediately provide the crisis helpline script.`}]
        };

        // Construct the payload for the Gemini API
        const payload = {
            contents: [
                systemInstruction,
                { role: 'model', parts: [{ text: "I understand. I am Aura. I will follow these principles to support the user in our voice conversation." }] },
                ...history
            ],
        };

        // The URL for the Gemini API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // Make the call to the Gemini API
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            throw new Error(`API call failed with status: ${apiResponse.status}`);
        }

        const result = await apiResponse.json();
        
        // Extract the AI's response text
        const aiText = result.candidates[0]?.content?.parts[0]?.text || "I'm sorry, I'm having trouble responding right now.";

        // Send the response back to the frontend
        res.json({ response: aiText });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});


// Start the server and listen for incoming connections
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
