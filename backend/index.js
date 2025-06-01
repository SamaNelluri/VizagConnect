// File: index.js
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nandhiniannikalla322005:ius3b1DqJo3XnePQ@cluster0.gpzk2sp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// ✅ Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

// ✅ MongoDB Connection
mongoose
    .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000
    })
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// ✅ Test API Route
app.get("/", (req, res) => {
    res.send("✅ Backend is running!");
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`);
});

const shutdownServer = async (signal) => {
    console.log(`\n🔴 Received ${signal}. Server shutting down...`);
   
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed.");
    } else {
        console.log("✅ MongoDB connection not active or already closed.");
    }

    server.close(() => {
        console.log("✅ Express server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", () => shutdownServer("SIGINT"));
process.on("SIGTERM", () => shutdownServer("SIGTERM"));

