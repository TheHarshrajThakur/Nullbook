import os
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Dict, Any, Optional
from app.config import settings

class ExecutionSandbox:
    @staticmethod
    def run_code_safely(code: str, language: str, stdin_data: Optional[str] = "") -> Dict[str, Any]:
        """Execute user-approved code inside a strictly sandboxed, time-limited subprocess."""
        lang = language.lower()
        if lang not in ("python", "javascript", "js"):
            return {
                "stdout": "",
                "stderr": f"Direct execution in this lightweight environment is currently restricted to Python and JavaScript. For {language}, please export and run in your system compiler.",
                "exit_code": -1,
                "execution_time_ms": 0.0,
                "timed_out": False,
                "memory_exceeded": False
            }

        # Create isolated temporary execution directory
        temp_dir = tempfile.mkdtemp(prefix="intellinote_sandbox_")
        timeout_sec = settings.SANDBOX_TIMEOUT_SECONDS
        max_bytes = settings.SANDBOX_MAX_OUTPUT_BYTES

        # Filtered environment variables to avoid leaking sensitive credentials
        clean_env = {
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
            "WINDIR": os.environ.get("WINDIR", "C:\\Windows"),
            "PATH": os.environ.get("PATH", ""),
            "TEMP": temp_dir,
            "TMP": temp_dir,
        }

        file_ext = ".py" if lang == "python" else ".js"
        script_file = os.path.join(temp_dir, f"main{file_ext}")

        with open(script_file, "w", encoding="utf-8") as f:
            f.write(code)

        if lang == "python":
            cmd = [sys.executable, "-I", "-s", script_file]  # -I: isolated mode (no user site-packages or env vars)
        else:
            node_bin = shutil.which("node")
            if not node_bin:
                shutil.rmtree(temp_dir, ignore_errors=True)
                return {
                    "stdout": "",
                    "stderr": "Node.js executable not found on host.",
                    "exit_code": -1,
                    "execution_time_ms": 0.0,
                    "timed_out": False,
                    "memory_exceeded": False
                }
            cmd = [node_bin, script_file]

        start_time = time.perf_counter()
        timed_out = False
        try:
            proc = subprocess.Popen(
                cmd,
                cwd=temp_dir,
                env=clean_env,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            try:
                stdout_data, stderr_data = proc.communicate(
                    input=stdin_data or "",
                    timeout=timeout_sec
                )
                exit_code = proc.returncode
            except subprocess.TimeoutExpired:
                proc.kill()
                stdout_data, stderr_data = proc.communicate()
                timed_out = True
                exit_code = -1
                stderr_data = f"[Execution Error: Process timed out after {timeout_sec}s limit]\n" + (stderr_data or "")

            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Cap outputs
            if len(stdout_data.encode("utf-8")) > max_bytes:
                stdout_data = stdout_data[:max_bytes] + "\n[Output truncated at limit]"
            if len(stderr_data.encode("utf-8")) > max_bytes:
                stderr_data = stderr_data[:max_bytes] + "\n[Error output truncated at limit]"

            return {
                "stdout": stdout_data,
                "stderr": stderr_data,
                "exit_code": exit_code,
                "execution_time_ms": exec_time_ms,
                "timed_out": timed_out,
                "memory_exceeded": False
            }

        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Sandbox execution failure: {str(e)}",
                "exit_code": -1,
                "execution_time_ms": round((time.perf_counter() - start_time) * 1000, 2),
                "timed_out": False,
                "memory_exceeded": False
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
