import fs from 'fs';
import os from 'os';
import path from 'path';

export class Stack {
  constructor(config) {
    const baseDir = config.get('stackBaseDirectory') || '/tmp';
    const user = os.userInfo().username;
    const wsName = config.get('specialWorkspace') || 'special:minimized';
    this.path = path.join(baseDir, `hypr-minimizer-stack-${user}-${wsName}`);
  }

  push(address, workspace) {
    const entry = JSON.stringify({ address, workspace });
    fs.appendFileSync(this.path, entry + '\n');
  }

  pop() {
    const lines = this.readStack();
    if (lines.length === 0) return null;
    const entry = JSON.parse(lines.pop());
    this.writeStack(lines);
    return entry;
  }

  remove(address) {
    const lines = this.readStack().filter(a => {
      try { return JSON.parse(a).address !== address; }
      catch { return a !== address; }
    });
    this.writeStack(lines);
  }

  readStack() {
    try {
      const data = fs.readFileSync(this.path, 'utf-8');
      return data.trim().split('\n').filter(Boolean);
    } catch { return []; }
  }

  writeStack(lines) {
    fs.writeFileSync(this.path, lines.join('\n') + (lines.length > 0 ? '\n' : ''));
  }
}

export default Stack;
