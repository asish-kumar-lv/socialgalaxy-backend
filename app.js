import express from "express";
import { config } from "dotenv";
import cors from "cors";
import connectDb from "./config/connectDb.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";

config();
const port = process.env.PORT;
const DB_URL = process.env.DB_URL;

const app = express();
connectDb(DB_URL);
app.use(express.json());
app.use(cors());
app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.get("/", (req, res) => res.send("hello"));

app.listen(port, () => console.log("server started at", port));
