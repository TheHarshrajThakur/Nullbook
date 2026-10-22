# IntelliNote AI — Offline Intelligent Notepad and Code Generator

An intelligent Windows desktop workspace that understands the logical meaning of what you write and automatically converts natural-language requirements into working code in your chosen language — running **100% offline and private** on your local machine.

---

## 1. Core Capabilities

1. **Intelligent Note-Taking:**
   - Unified workspace with Write Mode, Code Mode, and automatic intent detection.
   - Preserves original requirements alongside generated solutions.
   - Autosave with instant crash recovery drafts.
2. **Natural-Language-to-Code Generation:**
   - Supports Python, JavaScript, Java, C, and C++ (extensible architecture).
   - Driven by local language models via Ollama (candidate: `Qwen2.5-Coder`).
   - Revision history preserves every generated code version without erasing prior drafts.
   - Syntax validation across all supported languages and sandboxed test execution.
3. **Automatic Categorisation:**
   - Hybrid classifier combining rule-based heuristics, semantic embedding similarity, and an active user feedback learning store.
   - Auto-tags notes and marks ambiguous content as `Uncategorized` below confidence thresholds.
4. **Intelligent Offline Search:**
   - **Keyword Search:** Exact terms, identifiers, and syntax via SQLite FTS5 with BM25 ranking.
   - **Semantic Search:** Vector embeddings + cosine similarity for conceptual discovery.
   - **Filtered Search:** Categorical, language, and tag-based filtering with matched snippet highlighting.
5. **Offline Voice Dictation & Commands:**
   - Local speech-to-text with no remote cloud APIs.
   - Dictation mode: transcribes natural speech into note content.
   - Command mode: strict allowlist parser ("Create new note", "Search for...", "Generate code", "Switch language to C++", "Delete note" with safety confirmations).

---

## 2. Offline-First Architecture

```mermaid
graph TD
    subgraph Desktop [Electron Windows Desktop Client]
        MainProc[Electron Main Process]
        Preload[Secure Context Bridge & IPC]
        UI[React + Vite Workspace UI]
    end

    subgraph Backend [Local Python FastAPI Microservice]
        RouterNotes[Notes & Revisions Router]
        RouterAI[Code Generation & Intent Router]
        RouterSearch[FTS5 + Semantic Hybrid Search]
        RouterCat[Hybrid Categorization Service]
        RouterVal[Syntax Validator & Sandbox]
        RouterVoice[Voice Allowlist & Whisper Engine]
    end

    subgraph Storage [Local Offline Persistence]
        SQLiteDB[(SQLite Database)]
        FTS5Index[(SQLite FTS5 Full-Text Index)]
        VectorIndex[(Local Vector Embeddings)]
        Revisions[(Code Version History)]
    end

    subgraph Offline_AI [Local AI Runtimes]
        Ollama[Local Ollama Daemon (Port 11434)]
        QwenModel[Qwen2.5-Coder / Configured Model]
        EmbedModel[Nomic-Embed-Text / Local Embeddings]
        WhisperEngine[Local Whisper Engine]
    end

    UI --> Backend
    MainProc --> Backend
    Backend --> Storage
    Backend --> Offline_AI
```

---

## 3. System Requirements & Hardware Guidelines

| System Tier | Hardware Profile | Recommended Coding Model | Embedding Model |
|---|---|---|---|
| **Entry Level** | 8 GB RAM, Integrated GPU | `qwen2.5-coder:0.5b` (~400 MB) | `nomic-embed-text` (~270 MB) |
| **Standard (Recommended)** | 16 GB RAM, Iris Xe / GTX 1650 | `qwen2.5-coder:1.5b` (~980 MB) | `nomic-embed-text` (~270 MB) |
| **High Performance** | 16-32 GB RAM, RTX 3060+ | `qwen2.5-coder:3b` or `7b` | `nomic-embed-text` |

> **Graceful Degradation:** If the local AI daemon is not running or a model is not yet installed, IntelliNote AI opens instantly, preserving all notes, SQLite full-text search, categories, and editing capabilities.

---

## 4. Setup and Installation

### Prerequisites
- Windows 10/11 (64-bit)
- Python 3.10+ (tested with Python 3.13 / 3.14)
- Node.js v20+ & npm

### Step 1: Install Python Backend Dependencies
```bash
# In the project root:
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Configure Local AI (Ollama)
1. Download Ollama for Windows from [https://ollama.com](https://ollama.com).
2. Pull the recommended coding and embedding models:
   ```bash
   ollama pull qwen2.5-coder:1.5b
   ollama pull nomic-embed-text
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```

---

## 5. Running the Application

### Option A: Complete Desktop Application (Electron)
```bash
# In the project root:
npm install
npm start
```
*Electron will automatically launch the local FastAPI backend, wait for health check, and display the native workspace window.*

### Option B: Standalone Web/Development Mode
1. **Start Backend Server:**
   ```bash
   .\.venv\Scripts\python.exe backend/run_server.py
   ```
   *Backend runs at `http://127.0.0.1:8765`.*

2. **Start Frontend Dev Server:**
   ```bash
   cd frontend
   npm run dev
   ```
   *Open browser at `http://127.0.0.1:5173`.*

---

## 6. Running Automated Tests

Run backend integration test suite:
```bash
.\.venv\Scripts\python.exe -m pytest backend/tests -v
```

The test suite validates:
- [x] SQLite database schema, CRUD operations, and FTS5 synchronization.
- [x] Code revision preservation and restoration.
- [x] Intent detection (distinguishing code requirements from ordinary notes).
- [x] Hybrid categorization and user feedback learning.
- [x] FTS5 keyword and filtered search.
- [x] Syntax checking for Python, JavaScript, and compiler diagnostics.
- [x] Sandboxed execution time limits and memory protection.
- [x] Strict voice command allowlist parsing and confirmation safeguards.

---

## 7. Packaging for Windows (Installer)

To build the standalone Windows installer (`.exe` via NSIS):
```bash
npm run build:frontend
npm run package:win
```
The resulting installer will be located in the `release/` directory.

---

## 8. Security & Privacy Guarantees

- **Zero Cloud Leakage:** All notes, generated code, embeddings, and database indexes reside strictly in local files (`data/intellinote.db`). No telemetry or telemetry tokens are transmitted.
- **Sandboxed Execution:** Code execution is strictly separated from generation, never triggers automatically, and enforces a 5-second process timeout, memory caps, and temporary directory wipes.
- **Electron Hardening:** Renderer operates with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
