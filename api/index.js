import express from "express";
import { config } from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import connectDb from "../config/connectDb.js";
import userRoutes from "../routes/userRoutes.js";
import postRoutes from "../routes/postRoutes.js";

config();
const port = process.env.PORT;
const DB_URL = process.env.DB_URL;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
connectDb(DB_URL);
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "../", "uploads")));

app.use("/api/user", userRoutes);
app.use("/api/post", postRoutes);
app.get("/", (req, res) => res.send("hello"));

app.listen(port, () => console.log("server started at", port));
