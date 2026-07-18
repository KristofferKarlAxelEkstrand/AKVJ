import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node archive-task.js <task-id>");
  process.exit(1);
}

let taskId = args[0];
if (taskId.startsWith('[APPROVED]-')) {
  taskId = taskId.substring(11);
}
taskId = taskId.replace('.md', '');
const idMatch = taskId.match(/^([0-9]+[a-z]?)/);
if (idMatch) {
  taskId = idMatch[1];
}

const tasksDir = path.join(import.meta.dirname, '..', 'tasks');
const doneDir = path.join(tasksDir, 'done');

if (!fs.existsSync(doneDir)) {
  fs.mkdirSync(doneDir, { recursive: true });
}

const files = fs.readdirSync(tasksDir);
const targetFile = files.find(file => {
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

if (!targetFile) {
  console.error(`Could not find task file matching ID: ${taskId} in ${tasksDir}`);
  process.exit(1);
}

try {
  const sourcePath = path.join(tasksDir, targetFile);
  const destPath = path.join(doneDir, targetFile);

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
