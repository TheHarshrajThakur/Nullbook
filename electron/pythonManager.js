const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let pythonProcess = null;

function getPythonExecutable() {
  // Check virtualenv in project root
  const venvPythonWin = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
  const fs = require('fs');
  if (fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  return process.platform === 'win32' ? 'python.exe' : 'python3';
}

function startPythonBackend() {
  const pythonBin = getPythonExecutable();
  const scriptPath = path.join(__dirname, '..', 'backend', 'run_server.py');
  const cwd = path.join(__dirname, '..', 'backend');

  console.log(`[PythonManager] Starting backend with ${pythonBin} -> ${scriptPath}`);

  pythonProcess = spawn(pythonBin, [scriptPath], {
    cwd: cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Backend stdout]: ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Backend stderr]: ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[PythonManager] Backend exited with code ${code}`);
    pythonProcess = null;
  });

  return pythonProcess;
}

function stopPythonBackend() {
  if (pythonProcess) {
    console.log('[PythonManager] Stopping backend process...');
    pythonProcess.kill('SIGINT');
    setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill('SIGKILL');
      }
    }, 2000);
  }
}

function waitForBackend(retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get('http://127.0.0.1:8765/', (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (attempts < retries) {
          setTimeout(check, interval);
        } else {
          reject(new Error('Backend health check timed out'));
        }
      });
      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, interval);
        } else {
          reject(new Error('Backend connection failed'));
        }
      });
      req.end();
    };
    check();
  });
}

module.exports = {
  startPythonBackend,
  stopPythonBackend,
  waitForBackend,
};
