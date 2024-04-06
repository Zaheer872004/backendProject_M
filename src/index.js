import dotenv from 'dotenv'
import  connectDB from './db/index.js'
import { app } from './app.js'
dotenv.config({
    path: './.env'
})

const PORT = process.env.PORT;
    


connectDB()
.then(() => {
    app.on("error",(error) => {
        console.log(`Something went wrong in express app`);
        throw error
    })
    app.listen( PORT || 4000, ()=>{
        console.log(`Server started at http://localhost:${ PORT }`);
    })
})
.catch((error) => {
    console.log(`MongoDB connection failed !!!`, error);
})

























/*//!
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error)=>{  // this comes from express
            console.log("error");
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is lisining on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.err("Error",error);
        throw error;
    }    
})()
*/