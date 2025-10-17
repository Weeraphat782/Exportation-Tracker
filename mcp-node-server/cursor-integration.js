#!/usr/bin/env node

/**
 * Cursor MCP Integration Script for Node.js HTTP Server
 * This script acts as a bridge between Cursor's stdio MCP protocol
 * and our HTTP-based MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the HTTP server in background
const serverPath = path.join(__dirname, 'server.js');
const serverProcess = spawn('node', [serverPath], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true
});

// Give server time to start
setTimeout(() => {
  console.log('Node.js MCP HTTP Server started');
  console.log('Integration ready');
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill();
  process.exit(0);
});

// Keep process alive
process.stdin.resume();


