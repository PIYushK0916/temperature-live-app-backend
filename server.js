/**
 * Temperature Monitor Backend Server
 * Real-time temperature monitoring with WebSocket updates
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFileWatcher } from './fileWatcher.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3001;
const TEMPERATURE_FILE = path.join(__dirname, 'temperature.txt');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  methods: ['GET', 'POST']
}));

app.use(express.json());

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Temperature monitor server is running' });
});

// API endpoint to update temperature file
app.post('/api/temperatures', async (req, res) => {
  try {
    const { temperatures } = req.body;
    
    if (!Array.isArray(temperatures)) {
      return res.status(400).json({ error: 'temperatures must be an array' });
    }
    
    // Validate temperature format
    const validTemperatures = temperatures.filter(temp => {
      const trimmed = temp.trim();
      return /^-?\d+(\.\d+)?[CF]$/i.test(trimmed);
    });
    
    if (validTemperatures.length === 0) {
      return res.status(400).json({ 
        error: 'No valid temperatures provided',
        hint: 'Format: 32C or 100F'
      });
    }
    
    // Write to file
    const content = validTemperatures.join('\n') + '\n';
    const fs = await import('fs/promises');
    await fs.writeFile(TEMPERATURE_FILE, content, 'utf-8');
    
    console.log(`📝 Updated temperature file with ${validTemperatures.length} entries`);
    
    res.json({ 
      success: true, 
      count: validTemperatures.length,
      message: 'Temperatures updated successfully'
    });
  } catch (error) {
    console.error('Error updating temperatures:', error);
    res.status(500).json({ error: 'Failed to update temperatures' });
  }
});

// API endpoint to get current temperatures
app.get('/api/temperatures', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(TEMPERATURE_FILE, 'utf-8');
    const temperatures = content.trim().split('\n').filter(t => t.trim());
    
    res.json({ temperatures });
  } catch (error) {
    console.error('Error reading temperatures:', error);
    res.status(500).json({ error: 'Failed to read temperatures' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  socket.on('request-data', () => {
    console.log('📊 Client requested initial data');
  });
});

// Initialize file watcher
const watcher = initFileWatcher(TEMPERATURE_FILE, io);

// Start server
httpServer.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌡️  Temperature Monitor Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Monitoring: ${TEMPERATURE_FILE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await watcher.close();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
