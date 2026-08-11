import { GoogleGenAI } from "@google/genai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import dotenv from "dotenv"
import express from "express"
import { ChatGroq } from "@langchain/groq"
import { Annotation, MessagesAnnotation, StateGraph } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { TavilySearch } from "@langchain/tavily"


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


// WITH LANGCHAIN - LANGGRAPH
const tool = new TavilySearch({
    maxResults: 2,
    topic: "general"
})

const tools = [tool]
const toolNode = new ToolNode(tools)


const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    maxTokens: 100,
    maxRetries:2
}).bindTools(tools)


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


const callLLM = async (state) => {
    console.log("State:", state)

    const response = await llm.invoke([
        {
            role: "system",
            content: `You are Jarvis AI assistant.
            Use conversation memory first.

            Only use tools when the answer requires
            external real- time information like:
            weather, news, web search, stock prices etc.

            Do NOT call tools for simple conversation,
            memory - based questions, greetings,
            or personal context`
        },
        ...state.messages
    ])

    return { messages: [response] }
}

const shouldContinue = async (state) => {
    const lastMessage = state.messages[state.messages.length - 1]
    if (lastMessage.tool_calls.length > 0) {
        return "tools"
    }
    else {
        "__end__"
    }
}

const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", callLLM)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .compile()


app.post("/langgraph-ai", async (req, res) => {
    const { input } = req.body

    const response = await graph.invoke({
        messages: [{
            role: "user",
            content: input
        }
    ]})
    console.log(response)

    return res.status(200).json({ "Langgraph-ai": response.messages[response.messages.length - 1].content })
})




app.listen(port, () => {
    console.log(`Server Started on port: ${port}`)
})
