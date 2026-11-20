@echo off
chcp 65001 >nul
cd /d "%~dp0"
title AOF Akilli Calisma Kocu Baslatiliyor...

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [UYARI] Bilgisayarinizda Node.js kurulu degil.
  echo Acilan sayfadan LTS surumunu indirip kurduktan sonra BASLAT.cmd dosyasini tekrar calistirin.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

if not exist ".next\standalone\server.js" (
  if not exist "node_modules" (
    echo Ilk kurulum: bagimliliklar yukleniyor, lutfen bekleyin...
    call npm install
    if errorlevel 1 (
      echo HATA: Bagimlilik yukleme basarisiz oldu.
      pause
      exit /b 1
    )
  )
  echo Uygulama derleniyor, lutfen bekleyin...
  call npm run desktop:prepare
  if errorlevel 1 (
    echo HATA: Uygulama derlenemedi.
    pause
    exit /b 1
  )
)

node scripts\launch-app.mjs
if errorlevel 1 (
  echo HATA: Uygulama baslatilamadi.
  pause
  exit /b 1
)
