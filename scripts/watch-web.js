#!/usr/bin/env node

/**
 * Watch web files and rebuild on changes
 * This allows hot reload while serving from a single port (8080)
 */

const { spawn } = require('child_process');
const { watch } = require('fs');
const path = require('path');

const webDir = path.join(__dirname, '..', 'web');
const watchDirs = ['app', 'components', 'lib', 'public', 'styles'].map(dir =>
  path.join(webDir, dir)
);

let isBuilding = false;
let shouldRebuild = false;

function build() {
  if (isBuilding) {
    shouldRebuild = true;
    return;
  }

  isBuilding = true;
  console.log('\n🔨 [WEB] Frontend file changed, rebuilding...');

  const buildProcess = spawn('npm', ['run', 'build:web'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  buildProcess.on('close', (code) => {
    isBuilding = false;
    if (code === 0) {
      console.log('✅ [WEB] Frontend rebuild complete!\n');
    } else {
      console.error('❌ [WEB] Frontend build failed\n');
    }

    if (shouldRebuild) {
      shouldRebuild = false;
      setTimeout(build, 100);
    }
  });
}

// Debounce function
let timeout;
function debouncedBuild() {
  clearTimeout(timeout);
  timeout = setTimeout(build, 500);
}

console.log('👀 [WEB] Watching for frontend changes...');
console.log(`    Watching: ${watchDirs.join(', ')}\n`);

// Watch each directory
watchDirs.forEach(dir => {
  try {
    watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename && (
        filename.endsWith('.tsx') ||
        filename.endsWith('.ts') ||
        filename.endsWith('.jsx') ||
        filename.endsWith('.js') ||
        filename.endsWith('.css')
      )) {
        debouncedBuild();
      }
    });
  } catch (err) {
    // Directory might not exist, that's okay
  }
});

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 [WEB] Stopping frontend watch...');
  process.exit(0);
});
