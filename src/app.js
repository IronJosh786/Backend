import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// To get data from request

app.use(express.json({limit: '16kb'})) // from json
app.use(express.urlencoded({extended: true, limit: '16kb'})) // from url
app.use(express.static("public")) // static files like pdf, image to store in temp
app.use(cookieParser()) // for secure CRUD operations from server to browser

// importing routes

import userRouter from './routes/user.route.js'

// declaring routes

app.use('/api/v1/users', userRouter)

export { app }