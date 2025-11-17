import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { initializeDatabase } from "./config/db.js";

import playerRoutes from "./routes/playerRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import testPresetRoutes from "./routes/testPresetRoutes.js";

// So I can use .env for environment variables
dotenv.config();
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

//Middleware
// Express.json parses the request body as JSON
app.use(express.json());
// Prevent Cross-Origin Resource Sharing (CORS) errors
app.use(cors());
// Helmet helps secure the app by setting various HTTP headers
app.use(helmet());
// Morgan will log my requests to the console
app.use(morgan("dev"));

//Routes
app.use("/api/players", playerRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/test-presets", testPresetRoutes);

// Only begin server once database is initialized successfully
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log("Server is running on port " + PORT);
    });
  });