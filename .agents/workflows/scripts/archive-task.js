import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node archive-task.js [workflow] <task-id>");
  process.exit(1);
}

const [workflow, rawTaskId] = args.length >= 2 ? [args[0], args[1]] : [DEFAULT_WORKFLOW, args[0]];
let taskId = rawTaskId;
if (taskId.startsWith('[APPROVED]-')) {
  taskId = taskId.substring(11);
}
taskId = taskId.replace('.md', '');
const idMatch = taskId.match(/^([0-9]+[a-z]*)/);
if (idMatch) {
  taskId = idMatch[1];
}

const tasksDir = path.join(REPO_ROOT, '.agents/workflows', workflow, 'tasks');
const todoDir = path.join(tasksDir, 'todo');
const workingDir = path.join(tasksDir, 'working-on');
const doneDir = path.join(tasksDir, 'done');

for (const dir of [todoDir, workingDir, doneDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function findTaskFile(dir) {
  if (!fs.existsSync(dir)) {
    return null;
  }
  const files = fs.readdirSync(dir);
  return files.find(file => {
    if (!file.endsWith('.md')) {
      return false;
    }
    if (file === `${taskId}.md`) {
      return true;
    }
    if (file.startsWith(`${taskId}-`)) {
      return true;
    }
    return false;
  });
}

const sourceDirs = [todoDir, workingDir, doneDir];
let sourceDir = null;
let targetFile = null;
for (const dir of sourceDirs) {
  targetFile = findTaskFile(dir);
  if (targetFile) {
    sourceDir = dir;
    break;
  }
}

if (!targetFile || !sourceDir) {
  console.error(`Could not find task file matching ID: ${taskId}`);
  process.exit(1);
}

try {
  const sourcePath = path.join(sourceDir, targetFile);
  const destPath = path.join(doneDir, targetFile);

  if (sourcePath === destPath) {
    console.log(`${targetFile} is already in tasks/done/`);
    process.exit(0);
  }

  // Update status to done if YAML frontmatter exists
  let content = fs.readFileSync(sourcePath, 'utf8');
  if (content.startsWith('---')) {
    content = content.replace(/status:\s*\S+/, 'status: done');
    fs.writeFileSync(sourcePath, content);
  }

  fs.renameSync(sourcePath, destPath);
  console.log(`Successfully moved ${targetFile} to tasks/done/ and marked as done`);
} catch (error) {
  console.error(`Error moving file: ${error.message}`);
  process.exit(1);
}
