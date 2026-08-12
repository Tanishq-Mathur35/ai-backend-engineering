import { ChatGroq } from "@langchain/groq"
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

const upload = async () => {

    const pdfPath = "./knowledge.pdf"

    const buffer = fs.readFileSync(pdfPath)

    const pdfResult = new PDFParse({ data: buffer })

    console.log(pdfResult)
}
upload()


app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await llm.invoke(
        input
    )
    return res.status(200).json({ "ai:": response.content })
})


app.listen(port, () => {
    console.log(`Server Started on port: ${port}`)
})
