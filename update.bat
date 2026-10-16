@echo off
REM Nhan doi click: dong bo page.js + commit + push. Chay trong D:\tammi-project\tammi-dashboard
cd /d "%~dp0"
node sync-page.js
git add -A
for /f %%t in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"') do set TS=%%t
git commit -m "update %TS%" || echo Khong co gi moi de commit.
git push
echo.
echo Xong! May thay tu len trong vai gio (gap thi purge 1 phat + bao thay Ctrl+F5).
pause
