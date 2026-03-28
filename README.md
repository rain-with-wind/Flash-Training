# Flash Training (Flash-train)

A small full-stack project for practicing speech, code, and interview skills with AI feedback. It contains a FastAPI backend providing evaluation and record storage, and a React + Vite frontend for interactive practice sessions, history, and profile pages.

---

## Project Structure

- backend/
  - `api_server.py` — FastAPI application exposing endpoints for skills, speech transcription/evaluation, code evaluation, interview evaluation, and practice record CRUD.
  - `core/` — domain logic modules (speech evaluator, code evaluator, interview agent, skill utilities).
  - `data/` — JSON data files used for skills and persisted practice records (`micro_skills.json`, `practice_records.json`).
  - `logs/`, `uploads/` — runtime folders for logs and uploaded audio.
  - `requirements.txt` — Python dependencies.

- frontend/
  - React + TypeScript app bootstrapped with Vite.
  - `src/pages/PracticeSession.tsx` — recording, transcription, calling evaluators, and saving practice records.
  - `src/pages/PracticeHistory.tsx` — list, filter, and manage saved practice records (supports delete and replay).
  - `src/pages/Profile.tsx` — user stats, recent records, streak calculation.
  - `src/lib/api.ts` — typed wrappers around backend API endpoints.
  - `src/types/index.ts` — shared TypeScript types.

---

## Features

- AI-generated practice tasks for speech and interview practice
- Client-side recording and server-side transcription (SpeechRecognition + Pydub)
- Speech evaluation and multi-agent interview evaluation
- Code evaluation endpoint for programming tasks
- Save practice records to `backend/data/practice_records.json` with a stable `record_id`
- History UI with newest-first sorting, replay into Practice view, and deletion
- Profile page shows total practice count, total focused duration, average score, and consecutive streak days

---

## Local Setup

Prereqs:
- Python 3.10+ (recommended)
- Node 18+ / npm or pnpm

Backend
1. Create a Python virtual environment and activate it:
   - python -m venv .venv
   - .\.venv\Scripts\activate
2. Install backend dependencies:
   - pip install -r backend/requirements.txt
3. Run the API server (from project root or backend/):
   - uvicorn backend.api_server:app --reload --port 8000

Frontend
1. Install dependencies:
   - cd frontend
   - npm install
2. Start dev server:
   - npm run dev
3. Open http://localhost:5173 in your browser.

Notes:
- The frontend expects the backend at `http://localhost:8000/api`; change `VITE_API_BASE_URL` in `.env` if needed.
- After backend code changes, restart the server to pick up changes.
- If you use audio transcription locally, install `ffmpeg` (required by `pydub`) and ensure it's in your PATH (e.g., `choco install ffmpeg` on Windows, `brew install ffmpeg` on macOS).

---

## API Highlights

- POST `/api/practice/record` — save a practice record (returns `record_id`)
- GET `/api/practice/records/{user_id}` — list records for a user (auto-generates `record_id` for old entries)
- DELETE `/api/practice/record/{record_id}` — delete a record
- GET `/api/skills` — list available skills
- POST `/api/speech/transcribe` — transcribe uploaded audio
- POST `/api/speech/evaluate` — evaluate speech draft
- POST `/api/code/evaluate` — evaluate code
- POST `/api/interview/evaluate` — evaluate interview answer

---

## Testing & Debugging Tips

- Use `curl.exe` (Windows) or the browser to avoid PowerShell encoding issues that can produce garbled characters when posting JSON.
- Check `backend/logs` and console output for server-side errors.
- Use the dev "强制保存(调试)" button in PracticeSession for manual saves while debugging.

---

## Contributing & Roadmap

Planned improvements:
- Soft-delete / undo for record deletions
- Add authentication & per-user isolation
- Improve UI for delete confirmation (modal) and mobile layout
- Add unit/integration tests for API endpoints

If you'd like, I can add issue templates and a CONTRIBUTING guide.

---

## License


---
---
---


# Flash Training（中文说明）

一个用于练习演讲、代码和面试技能并得到 AI 反馈的小型全栈项目。后端使用 FastAPI 提供评估与记录存储，前端使用 React + Vite 提供交互式练习、历史记录与个人主页。

---

## 项目结构

- backend/
  - `api_server.py` — FastAPI 应用，暴露技能、语音转写/评估、代码评估、面试评估和练习记录的 CRUD 接口。
  - `core/` — 域逻辑模块（语音评估、代码评估、面试 agent、技能工具等）。
  - `data/` — 使用的 JSON 数据文件（如 `micro_skills.json`、`practice_records.json`）。
  - `logs/`, `uploads/` — 运行时的日志和上传音频存放目录。
  - `requirements.txt` — Python 依赖。

- frontend/
  - React + TypeScript（Vite）前端。
  - `src/pages/PracticeSession.tsx` — 录音、转写、调用评估并保存记录。
  - `src/pages/PracticeHistory.tsx` — 列表、筛选并管理保存的练习记录（支持删除和回放）。
  - `src/pages/Profile.tsx` — 用户统计、近期记录、打卡连胜计算。
  - `src/lib/api.ts` — 后端 API 的类型化封装。
  - `src/types/index.ts` — 共享的 TypeScript 类型定义。

---

## 功能特性

- 基于 AI 生成的演讲与面试练习题
- 客户端录音，服务端转写（SpeechRecognition + Pydub）
- 演讲评分与多智能体面试评估
- 提供代码评估的后端接口（用于编程题）
- 将练习记录保存到 `backend/data/practice_records.json`，每条记录包含稳定的 `record_id`
- 历史记录 UI 按时间倒序显示、可回放到练习页面，并支持删除
- 个人中心展示练习总数、专注时长、平均得分、连续打卡天数

---

## 本地启动（快速指南）

准备工作：
- Python 3.10+
- Node 18+ 与 npm 或 pnpm

后端（Backend）
1. 创建并激活虚拟环境：
   - python -m venv .venv
   - .\.venv\Scripts\activate
2. 安装依赖：
   - pip install -r backend/requirements.txt
3. 启动服务（在项目根或 backend/ 目录运行）：
   - uvicorn backend.api_server:app --reload --port 8000

前端（Frontend）
1. 安装依赖：
   - cd frontend
   - npm install
2. 启动开发服务器：
   - npm run dev
3. 在浏览器打开 http://localhost:5173

注意：
- 前端默认请求后端地址为 `http://localhost:8000/api`，如需修改请在 `.env` 中配置 `VITE_API_BASE_URL`。
- 修改后端代码后请重启服务以加载变更。
- 如果在本地使用音频转写，请先安装 `ffmpeg`（`pydub` 依赖）并确保其在系统 PATH 中（Windows 可用 `choco install ffmpeg`，macOS 可用 `brew install ffmpeg`）。

---

## 主要 API 概览

- POST `/api/practice/record` — 保存练习记录（返回 `record_id`）
- GET `/api/practice/records/{user_id}` — 获取某用户的练习记录（会为老记录自动分配 `record_id`）
- DELETE `/api/practice/record/{record_id}` — 删除一条记录
- GET `/api/skills` — 列出可用技能
- POST `/api/speech/transcribe` — 上传音频并转写
- POST `/api/speech/evaluate` — 对文本草稿进行演讲评估
- POST `/api/code/evaluate` — 代码评估
- POST `/api/interview/evaluate` — 面试回答评估

---

## 调试与注意事项

- 在 Windows 推荐使用 `curl.exe` 或浏览器进行 API 测试，避免 PowerShell 的编码导致 JSON 中文字符被破坏。
- 查看 `backend/logs` 或后端控制台日志来定位服务器错误。
- 前端 PracticeSession 页面有一个开发用的“强制保存(调试)”按钮，便于在本地调试时手动保存记录。

---

## 贡献与路线图

计划中的增强：
- 支持回滚/撤销删除（回收站）
- 引入用户认证与每用户隔离
- 改进删除确认（使用模态对话框）和移动端布局
- 为 API 添加单元/集成测试


---

## 许可证
