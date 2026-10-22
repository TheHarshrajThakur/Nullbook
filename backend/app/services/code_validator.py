import ast
import os
import shutil
import subprocess
import tempfile
from typing import Dict, Any, Optional

class CodeValidator:
    @staticmethod
    def validate_syntax(code: str, language: str) -> Dict[str, Any]:
        """Validate code syntax across Python, JavaScript, Java, C, and C++."""
        clean_code = code.strip()
        if not clean_code:
            return {
                "status": "not_validated",
                "message": "No code provided for validation.",
                "error_line": None,
                "error_column": None,
                "details": None
            }

        lang = language.lower()

        if lang == "python":
            return CodeValidator._validate_python(clean_code)
        elif lang in ("javascript", "js"):
            return CodeValidator._validate_javascript(clean_code)
        elif lang in ("c", "cpp", "c++"):
            return CodeValidator._validate_c_cpp(clean_code, lang)
        elif lang == "java":
            return CodeValidator._validate_java(clean_code)
        else:
            return {
                "status": "validation_unavailable",
                "message": f"Syntax validation is not supported for {language}.",
                "error_line": None,
                "error_column": None,
                "details": None
            }

    @staticmethod
    def _validate_python(code: str) -> Dict[str, Any]:
        """Validate Python syntax using standard AST parsing."""
        try:
            ast.parse(code)
            return {
                "status": "syntax_check_passed",
                "message": "Python syntax check passed successfully.",
                "error_line": None,
                "error_column": None,
                "details": "AST parsed cleanly without syntax errors."
            }
        except SyntaxError as e:
            return {
                "status": "syntax_check_failed",
                "message": f"Syntax Error: {e.msg}",
                "error_line": e.lineno,
                "error_column": e.offset,
                "details": f"Line {e.lineno}, Col {e.offset}: {e.text or ''}".strip()
            }
        except Exception as e:
            return {
                "status": "syntax_check_failed",
                "message": str(e),
                "error_line": None,
                "error_column": None,
                "details": str(e)
            }

    @staticmethod
    def _validate_javascript(code: str) -> Dict[str, Any]:
        """Validate JavaScript syntax via node --check if node is available."""
        node_bin = shutil.which("node")
        if not node_bin:
            return {
                "status": "validation_unavailable",
                "message": "Node.js runtime not found on PATH for JavaScript syntax check.",
                "error_line": None,
                "error_column": None,
                "details": None
            }

        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tf:
            tf.write(code)
            temp_path = tf.name

        try:
            proc = subprocess.run(
                [node_bin, "--check", temp_path],
                capture_output=True,
                text=True,
                timeout=5.0
            )
            if proc.returncode == 0:
                return {
                    "status": "syntax_check_passed",
                    "message": "JavaScript syntax check passed successfully.",
                    "error_line": None,
                    "error_column": None,
                    "details": "Node.js --check reported no syntax errors."
                }
            else:
                err_text = proc.stderr.strip()
                return {
                    "status": "syntax_check_failed",
                    "message": "JavaScript syntax check failed.",
                    "error_line": None,
                    "error_column": None,
                    "details": err_text
                }
        except Exception as e:
            return {
                "status": "validation_unavailable",
                "message": f"Error running Node.js check: {e}",
                "error_line": None,
                "error_column": None,
                "details": str(e)
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    @staticmethod
    def _validate_c_cpp(code: str, lang: str) -> Dict[str, Any]:
        """Validate C/C++ syntax using gcc/g++ or clang if available."""
        compiler = shutil.which("g++" if lang in ("cpp", "c++") else "gcc") or shutil.which("clang")
        if not compiler:
            return {
                "status": "validation_unavailable",
                "message": f"C/C++ compiler not detected on system (gcc/clang). Validation unavailable.",
                "error_line": None,
                "error_column": None,
                "details": None
            }

        suffix = ".cpp" if lang in ("cpp", "c++") else ".c"
        with tempfile.NamedTemporaryFile("w", suffix=suffix, delete=False, encoding="utf-8") as tf:
            tf.write(code)
            temp_path = tf.name

        try:
            proc = subprocess.run(
                [compiler, "-fsyntax-only", temp_path],
                capture_output=True,
                text=True,
                timeout=5.0
            )
            if proc.returncode == 0:
                return {
                    "status": "syntax_check_passed",
                    "message": f"{lang.upper()} syntax check passed.",
                    "error_line": None,
                    "error_column": None,
                    "details": f"{compiler} -fsyntax-only verified code cleanly."
                }
            else:
                return {
                    "status": "syntax_check_failed",
                    "message": f"{lang.upper()} syntax check failed.",
                    "error_line": None,
                    "error_column": None,
                    "details": proc.stderr.strip()
                }
        except Exception as e:
            return {
                "status": "validation_unavailable",
                "message": str(e),
                "error_line": None,
                "error_column": None,
                "details": str(e)
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    @staticmethod
    def _validate_java(code: str) -> Dict[str, Any]:
        """Validate Java syntax using javac if available."""
        javac = shutil.which("javac")
        if not javac:
            return {
                "status": "validation_unavailable",
                "message": "Java compiler (javac) not detected on system.",
                "error_line": None,
                "error_column": None,
                "details": None
            }

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_file = os.path.join(temp_dir, "Main.java")
            with open(temp_file, "w", encoding="utf-8") as f:
                f.write(code)

            try:
                proc = subprocess.run(
                    [javac, "-nowarn", temp_file],
                    capture_output=True,
                    text=True,
                    timeout=8.0
                )
                if proc.returncode == 0:
                    return {
                        "status": "syntax_check_passed",
                        "message": "Java syntax check passed.",
                        "error_line": None,
                        "error_column": None,
                        "details": "javac successfully compiled the source."
                    }
                else:
                    return {
                        "status": "syntax_check_failed",
                        "message": "Java syntax check failed.",
                        "error_line": None,
                        "error_column": None,
                        "details": proc.stderr.strip()
                    }
            except Exception as e:
                return {
                    "status": "validation_unavailable",
                    "message": str(e),
                    "error_line": None,
                    "error_column": None,
                    "details": str(e)
                }
