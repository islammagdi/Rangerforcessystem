@echo off
title Military System

cd /d "C:\Local Disk (D)\Rangerforcessystem"

start "Dev Server" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

start http://localhost:5173