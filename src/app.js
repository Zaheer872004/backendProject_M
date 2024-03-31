import express from 'express'
import cors from 'cors'
import cookiesParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))
app.use(express.json({   // here body-parser not required becus now express can handle the json response from body.
    limit : '16kb'  // optional 
}));
app.use(express.urlencoded({extended : true, limit : "16kb"}))  // here body-parser not required becus now express can handle the json response from body.

app.use(express.static("public"))

app.use(cookiesParser())


// routes import
import userRouter from "./routes/user.routes.js";




// routes declaration
app.use('/api/v1/users', userRouter)



export {
    app,
}