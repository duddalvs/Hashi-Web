@echo off
title Hashi - mantenha esta janela aberta
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.12 ou superior para iniciar o hashi.
  pause
  exit /b 1
)
echo Mantenha esta janela aberta enquanto usar o Hashi. Pode minimiza-la.
echo.
node scripts\open-hashi.cjs %*
if errorlevel 1 (
  pause
  exit /b 1
)
