import { TaskType } from "@google/generative-ai"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { ChatGroq } from "@langchain/groq"
import { QdrantVectorStore } from "@langchain/qdrant"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import dotenv from "dotenv"
import express from "express"
import fs from "fs"
import { PDFParse } from "pdf-parse"


dotenv.config()

const app = express()

const port = 5000

app.use(express.json())

app.get("/", (req, res) => {
    return res.json({ message: "hello from level4" })
})


const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    maxTokens: 100,
    maxRetries: 2
})

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    title: "Document title",
})


const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: "grocery-store",
})


const upload = async () => {
    const pdfPath = "./knowledge.pdf"
    const buffer = fs.readFileSync(pdfPath)
    const pdfResult = new PDFParse({ data: buffer })
    const result = await pdfResult.getText()
    const text = result.text

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    })

    const docs = await splitter.createDocuments([text])
    await vectorStore.addDocuments(docs)
}


app.post("/ai", async (req, res) => {
    const { input } = req.body

    const docs = await vectorStore.similaritySearch(input, 5)

    const context = docs.map((d) => d.pageContent).join("/n")

    const response = await llm.invoke([
        new SystemMessage(`You are a RAG AI assistant.

    STRICT RULES:
    - Answer ONLY from context
    - Do not use outside knowledge
    - If answer not found say:
        "I don't know from uploaded PDF."

    Context:
    ${context}`
        ),

        new HumanMessage(input)
    ])

    console.log(response.content)
    return res.status(200).json({ ai: response.content })
})


app.listen(port, () => {
    console.log(`Server Started on port: ${port}`)
})
