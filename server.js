import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdn.jsdelivr.net", "https://apis.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https://*"],
            connectSrc: ["'self'", "https://*"],
            frameSrc: ["'self'", "https://*"],
        },
    },
}));
app.use(cors({
    origin: ['http://localhost:3000', 'https://studio-1560217422-e282c.web.app'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: { error: 'Too many requests , please try again after after some time' },
    standardHeaders: true,
    legacyHeaders: false,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Fallback logic for Groq initialization in case the API key is missing
let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (error) {
    console.error("Failed to initialize Groq client:", error.message);
}

// Chat API - Securely calls Groq
app.post('/api/chat', apiLimiter, async (req, res) => {
    try {
        const { messages, model, mode } = req.body;

        if (!groq) {
            return res.status(500).json({ error: 'Groq API Key is missing or invalid on the server.' });
        }

        // Define system prompts
        let systemPrompt = "You are a helpful, intelligent AI assistant. Under absolutely no circumstances should you answer questions, provide information, or engage in discussions regarding sexual topics, explicit content, violence, self-harm, or illegal acts. If asked about these topics, you must politely but firmly refuse to answer and state that you cannot assist with such requests. You must stick strictly to your designated role.";

        if (mode === 'code') {
            systemPrompt += " You are currently in CODE mode. You act as an expert software engineer. Provide clean, efficient, and well-documented code. Focus on best practices and avoid unnecessary explanations.";
        } else if (mode === 'research') {
            systemPrompt += " You are currently in RESEARCH mode. You act as an expert researcher and academic analyst. Provide detailed, well-structured, and factual information. Cite reliable sources when possible and remain objective.";
        }

        // Format messages for Groq Vision
        let hasImage = false;
        const formattedMessages = messages.map(msg => {
            if (msg.imageUrl) {
                hasImage = true;
                return {
                    role: msg.role,
                    content: [
                        { type: "text", text: msg.content || "Please analyze this image." },
                        { type: "image_url", image_url: { url: msg.imageUrl } }
                    ]
                };
            }
            return {
                role: msg.role,
                content: msg.content
            };
        });

        // Prepend system prompt to messages array
        const finalMessages = [
            { role: 'system', content: systemPrompt },
            ...formattedMessages
        ];

        let finalModel = model || "llama-3.3-70b-versatile";
        if (hasImage) {
            finalModel = "llama-3.2-11b-vision-preview";
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: finalMessages,
            model: finalModel,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const reply = chatCompletion.choices[0]?.message?.content;
        res.json({ reply });

    } catch (error) {
        console.error('Groq API error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
