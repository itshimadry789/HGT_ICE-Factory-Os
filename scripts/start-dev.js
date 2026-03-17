#!/usr/bin/env node

const { execSync } = require('child_process');
const { spawn } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function killPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      log(`✓ Killed process on port ${port}`, 'yellow');
      return true;
    }
  } catch (error) {
    // Port is not in use, which is fine
    return false;
  }
  return false;
}

// Clean up ports
log('\n🧹 Cleaning up ports...', 'blue');
const port3000 = killPort(3000);
const port3001 = killPort(3001);

function startServers() {
  log('\n🚀 Starting development servers...\n', 'green');

  // Start backend and frontend using concurrently
  const concurrently = spawn('npx', ['concurrently', '-k', '-n', 'backend,frontend', '-c', 'blue,green', 'npm run dev:backend', 'npm run dev:frontend'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  concurrently.on('close', (code) => {
    log(`\n\nProcess exited with code ${code}`, code === 0 ? 'green' : 'red');
    process.exit(code);
  });

  concurrently.on('error', (error) => {
    log(`\n\nError starting servers: ${error.message}`, 'red');
    process.exit(1);
  });

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    log('\n\n🛑 Shutting down servers...', 'yellow');
    concurrently.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    log('\n\n🛑 Shutting down servers...', 'yellow');
    concurrently.kill('SIGTERM');
  });
}

if (port3000 || port3001) {
  log('   Waiting 2 seconds for ports to be released...', 'yellow');
  setTimeout(() => {
    startServers();
  }, 2000);
} else {
  startServers();
}

