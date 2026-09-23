//require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js"

dotenv.config({
    path: './.env'
})

;(async () => {
    try{
        await connectDB()

        const port = process.env.PORT || 8000
        app.on("error", (error) => {
            console.log("EXPRESS ERROR: ", error)
            throw error
        })
        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`)
        })
    }catch(error) {
        console.log("MONGODB connection failed !!!", error)
    }
})()
