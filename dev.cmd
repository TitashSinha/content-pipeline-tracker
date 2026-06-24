@echo off
REM Launches the full stack (Express API on :4000 + Vite app on :5190).
REM Pin BACKEND_PORT so a launcher that injects PORT (e.g. the preview runner)
REM can't steer the API onto the Vite port — the proxy expects the API on :4000.
cd /d "B:\Projects\Content Pipeline Tracker V2"
set BACKEND_PORT=4000
npm run dev
