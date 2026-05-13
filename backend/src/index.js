import dotenv from 'dotenv'
import { connectDB } from './db/index.js'
import { createSchema } from './db/schema.js'
import { app } from './app.js';

dotenv.config({
    path: './.env'
});

try {
    await connectDB();
    // Initialize database schema
    await createSchema();
    console.log("Database initialized successfully!");
    
    app.on("error", (error) => {
        console.log("Connection Error: ",error);
    })
    
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port ${process.env.PORT}`)
    })
} catch (error) {
    console.log("Database initialization failed !! ", error)
    process.exit(1);
}



// when using mysql or mongodb, we can use the below code to start the server after successful connection to the database

/* 
import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js';

dotenv.config({
    path: './env'
});

connectDB()
.then( () => {
    app.on("Error", (error) => {
        console.log("Connection Error: ",error);
    })
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running at port ${process.env.PORT}`)
    })
})
.catch((error) => {
    console.log("Server connection failed !! ",error)
}) */
















/* 
import express from 'express'

const app = express();

;(async () => {
    try {
        mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);

        app.on("Error", (error)=> {
            console.error("Error: ",error);
            throw error
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server listen on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("Error: ",error);
        throw error
    }
})() */


