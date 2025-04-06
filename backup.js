// Simple backup script for the pomodoro timer project
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const backupDir = path.join(__dirname, 'backups');
const excludeDirs = ['node_modules', '.next', 'backups'];

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `backup-${timestamp}`;
const backupPath = path.join(backupDir, backupName);

// Create backup directory
fs.mkdirSync(backupPath);

// Helper function to copy files recursively
function copyFilesRecursive(source, target) {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  // Read source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  // Copy each entry
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    // Skip excluded directories
    if (excludeDirs.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursive copy for directories
      copyFilesRecursive(sourcePath, targetPath);
    } else {
      // Direct copy for files
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Perform the backup
try {
  console.log(`Creating backup: ${backupName}`);
  
  // Copy all files
  copyFilesRecursive(__dirname, backupPath);
  
  // Create a git status file to record current state
  try {
    const gitStatus = execSync('git status', { encoding: 'utf8' });
    fs.writeFileSync(path.join(backupPath, '_GIT_STATUS.txt'), gitStatus);
  } catch (e) {
    console.log('Could not save git status (git may not be initialized)');
  }
  
  console.log(`Backup completed successfully at: ${backupPath}`);
} catch (error) {
  console.error('Backup failed:', error);
} 