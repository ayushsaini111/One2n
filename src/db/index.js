import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB=async () => {
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODM_URI}${DB_NAME}`)
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);
        console.log("MongoDB connected successfully !!");
    } catch (error) {
        console.log(`MongoDB connection error: ${error}`);
        console.log(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
}
// D:\one2n\src\constant.js
export {connectDB}