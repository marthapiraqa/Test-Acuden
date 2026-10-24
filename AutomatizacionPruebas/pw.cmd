@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0pw.ps1" %*
exit /b %errorlevel%
