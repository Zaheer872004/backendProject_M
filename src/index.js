import dotenv from 'dotenv'
import  connectDB from './db/index.js'

dotenv.config({
    path : './.env'
})


connectDB();


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