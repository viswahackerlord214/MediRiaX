import e from "express";
import mongoose from "mongoose";

export const connectDB = () => {
    mongoose
        .connect(process.env.MONGO_URI,{
            dbName: "MERN_HOSPITAL_MANAGEMENT",
        })
        .then(() => console.log("Database connected"))
        .catch((error) => console.log(error));
};
