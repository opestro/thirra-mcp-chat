#!/usr/bin/env node

// Simple test script to verify MCP server functionality
import { spawn } from 'child_process';

console.log('Testing Cloudflare RAG MCP Server...');

// Set environment variables for testing
const env = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: 'e61c0c9130c9e6736e8259692d2b0d8c',
  CLOUDFLARE_RAG_NAME: 'merris-rag-testing',
  CLOUDFLARE_API_TOKEN: 'test_token' // This will fail API calls but test the server structure
};

const server = spawn('node', ['build/index.js'], {
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

server.stdin.write(JSON.stringify(initRequest) + '\n');

// Send tools/list request
const toolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

setTimeout(() => {
  server.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 100);

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

setTimeout(() => {
  server.kill();
  console.log('\nTest completed. Check the output above for MCP server responses.');
}, 2000);
