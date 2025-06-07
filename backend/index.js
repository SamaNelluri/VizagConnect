// File: index.js
require('dotenv').config(); // Load env variables from .env file if present

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nandhiniannikalla322005:ius3b1DqJo3XnePQ@cluster0.gpzk2sp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL in production
  credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// MongoDB Connection with options and event listeners
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Optional: Listen to connection events for more info
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected!');
});
mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected!');
});

// Import Routes
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/request'); // Add request routes here

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/request', requestRoutes);  // Mount the request routes

// Test API Route
app.get('/', (req, res) => {
  res.send('✅ Backend is running!');
});

// 404 Handler (after all routes)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Global Error Handler (4 arguments required for express to detect it)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Graceful Shutdown Handler
const shutdownServer = async (signal) => {
  console.log(`\n🔴 Received ${signal}. Server shutting down...`);

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed.');
    } else {
      console.log('✅ MongoDB connection not active or already closed.');
    }

    server.close(() => {
      console.log('✅ Express server closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds if not closed properly
    setTimeout(() => {
      console.error('❌ Force exit after 10 seconds.');
      process.exit(1);
    }, 10000);

  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdownServer('SIGINT'));
process.on('SIGTERM', () => shutdownServer('SIGTERM'));
