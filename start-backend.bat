@echo off
echo Starting Nearby-Nearby Backend...
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload