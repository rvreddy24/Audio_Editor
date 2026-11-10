@echo off
cd /d "D:\Audio Editor"

netstat -ano | findstr :5000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    start "SoundCraft Studio Engine" /min node server/index.js
    ping -n 3 127.0.0.1 >nul
)

start http://localhost:5000
