import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express();

const requestLimit = process.env.REQUEST_BODY_LIMIT || "5mb";

app.use(cors ({
    origin: process.env.CORS_ORIGIN 
}))

app.use(express.json({limit: requestLimit}))
app.use(express.urlencoded({extended: true, limit: requestLimit}))
app.use(express.static("public"))
app.use(cookieParser())



// Import routes
import userRouter from './routes/user.routes.js';



// routes declaration
app.use("/api/v1/users/", userRouter)

app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.statusCode || error.status || 500).json({
        message: error.message || "Internal server error",
    });
});

// http://localhost:5000/api/v1/users/register

export { app };