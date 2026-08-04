import dns from "dns"
import dotenv from "dotenv"
import express from "express"
import Redis from "ioredis"
import connectDB from "./lib/db.js"
import User from "./model/user.model.js"

dotenv.config()

dns.setServers(["1.1.1.1", "8.8.8.8"])

const port = process.env.PORT || 5000

const app = express()

const redis = new Redis(process.env.REDIS_URL)

app.use(express.json())

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Hello from Redis."
    })
})


app.post("/create", async (req, res) => {
    const { name, email, password } = req.body

    const user = await User.create({
        name, email, password
    })

    return res.json(user)
})


// Without Redis
app.get("/get", async (req, res) => {
    const user = await User.find({})

    return res.json(user)
})


// With Redis
app.get("/get-with-redis", async (req, res) => {
    const cached = await redis.get("user:all")

    if (cached) {
        const user = JSON.parse(cached)
        return res.json(user)
    }

    const user = await User.find({})
    await redis.set("user:all", JSON.stringify(user))

    return res.json(user)
})


app.listen(port, () => {
    connectDB()
    console.log(`Server is running on port: ${port}`)
})
