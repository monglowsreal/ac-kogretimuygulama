@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js kurulu degil. Once https://nodejs.org adresinden Node.js LTS kurun.
  pause
  exit /b 1
)

node scripts\create-shortcut.mjs
if errorlevel 1 (
  echo Kisayol olusturulamadi.
  pause
  exit /b 1
)
timeout /t 2 >nul
