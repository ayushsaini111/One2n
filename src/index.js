import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config(
    {
        path: "./env"
    });

connectDB()
.then(() => {
    app.on("error", (error) => {
        console.log(`Error in server: ${error}`);
    });
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.log(`MONGODB connection failed ||: ${error}`);
})