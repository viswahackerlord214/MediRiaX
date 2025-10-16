import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { connectDB } from "./database/dbconnection.js";
import messageRouter from "./router/messageRouter.js";
import userRouter from "./router/userRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";

import cloudinary from "cloudinary";

import errorMiddleware from "./middlewares/errorMiddleware.js";

const app = express();
config({ path: "./config/config.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });


// Middlewares
app.use(cors({  // To allow cross-origin requests
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))

app.use(cookieParser());// To parse cookies

app.use(express.json());// To parse JSON

app.use(express.urlencoded({ extended: true }));// To parse URL-encoded data

// To upload files
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));

//Routes
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/appointment", appointmentRouter);

//database connection
connectDB();


//always use error middleware in the end 
app.use(errorMiddleware);

export default app;
