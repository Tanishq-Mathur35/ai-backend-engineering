import dotenv from "dotenv"
import express from "express"

dotenv.config()

const port = process.env.PORT || 5000

const app = express()

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Hello from Docker pahse 2."
    })
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})
