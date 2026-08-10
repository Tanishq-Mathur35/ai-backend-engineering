import { GoogleGenAI } from "@google/genai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import dotenv from "dotenv"
import express from "express"
import { ChatGroq } from "@langchain/groq"

dotenv.config()

const app = express()

app.use(express.json())

const port = 5000

app.get("/", (req, res) => {
    return res.json({ message: "Hello from Backend + AI." })
})

// WITHOUT LANGCHAIN
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
})

app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
            {
                role: "model",
                parts: [{ text: "You are a assistant and your name is Jarvis. If you dont know the answer then dont give incorrect answer." }]
            },
            {
                role: "user",
                parts: [{ text: input }]
            }
        ]
    })

    return res.status(200).json({ "ai": response.text })
})


// WITH LANGCHAIN
const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    maxTokens: 100,
    maxRetries:2
})

app.post("/langchain-ai", async (req, res) => {
    const { input } = req.body

    const response = await llm.invoke([
        {
            role: "system",
            content:"You are a assistant and your name is Jarvis. If you dont know the answer then dont give incorrect answer."
        },
        {
            role: "human",
            content:input
        }
    ])

    return res.status(200).json({ "langchain-ai": response.content })
})


app.listen(port, () => {
    console.log(`Server Started on port: ${port}`)
})
