/**
 * File Watcher Module
 * Monitors temperature.txt for changes and emits updates via Socket.IO
 */

import chokidar from 'chokidar';
import fs from 'fs/promises';
import { parseTemperatureFile } from './utils/temperatureParser.js';

/**
 * Read and parse the temperature file
 */
async function readTemperatureFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const temperatures = parseTemperatureFile(content);
    return temperatures;
  } catch (error) {
    console.error('Error reading temperature file:', error.message);
    return [];
  }
}

/**
 * Initialize file watcher
 * @param {string} filePath - Path to the temperature file
 * @param {Object} io - Socket.IO server instance
 */
export function initFileWatcher(filePath, io) {
  console.log(`📂 Watching file: ${filePath}`);
  
  // Create watcher instance
  const watcher = chokidar.watch(filePath, {
    persistent: true,
    ignoreInitial: false, // Trigger on initial add
    awaitWriteFinish: {
      stabilityThreshold: 100, // Wait for file writes to finish
      pollInterval: 50
    }
  });
  
  // Handle file changes
  watcher.on('add', async (path) => {
    console.log('📄 File detected:', path);
    const temperatures = await readTemperatureFile(path);
    io.emit('temperatures-update', temperatures);
    console.log(`✅ Emitted ${temperatures.length} temperatures to clients`);
  });
  
  watcher.on('change', async (path) => {
    console.log('🔄 File changed:', path);
    const temperatures = await readTemperatureFile(path);
    io.emit('temperatures-update', temperatures);
    console.log(`✅ Emitted ${temperatures.length} temperatures to clients`);
  });
  
  watcher.on('unlink', (path) => {
    console.log('🗑️ File removed:', path);
    io.emit('temperatures-update', []);
    console.log('✅ Emitted empty array to clients');
  });
  
  watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });
  
  return watcher;
}
