import express from 'express'
import cors from 'cors'
import cookiesParser from 'cookie-parser'


const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}))
app.use(express.json({   // here body-parser not required becus now express can handle the json response from body.
    limit : '2MB'  // optional 
}));
app.use(express.urlencoded({extended : true, limit : "2MB"}))  // here body-parser not required becus now express can handle the json response from body.

app.use(express.static("public"))

app.use(cookiesParser())

// app66151add8571543d6795a70b66151add8571543d6795a70b.set('email-verfed', path.join(__dirname, 'views'));
// app.set("view engine", "ejs");

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"



// routes declaration
app.use('/api/v1/users', userRouter)
app.use('/api/v1/videos', videoRouter)



export {
    app,
}