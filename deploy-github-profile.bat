@echo off
chcp 65001 >nul
cd /d "%~dp0"

set USER=XCmiaow
set TOKEN=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
set REPO=XCmiaow

echo.
echo ========================================
echo   Deploy GitHub Profile README
echo ========================================
echo.

:: Create the repo via API (if not exists)
echo [1/3] Creating github.com/XCmiaow/XCmiaow repo...
powershell -NoProfile -Command "try{$r=Invoke-RestMethod -Uri https://api.github.com/user/repos -Method Post -Headers @{Authorization='token %TOKEN%';'Content-Type'='application/json'} -Body (@{name='%REPO%';description='Profile README';auto_init=$true;private=$false}|ConvertTo-Json);Write-Host '  OK - repo created'}catch{Write-Host '  OK - repo exists or created'}"

:: Clone, replace README, push
echo [2/3] Cloning and updating README...
rmdir /s /q "%TEMP%\%REPO%" 2>nul
cd "%TEMP%"
git clone https://%USER%:%TOKEN%@github.com/%USER%/%REPO%.git >nul 2>&1
cd "%TEMP%\%REPO%"
copy /y "%~dp0github-profile-README.md" README.md >nul

echo [3/3] Pushing...
git add .
git commit -m "Initial profile README with badges, stats, projects" >nul
git push origin main

if %errorlevel% equ 0 (
  echo.
  echo ========================================
  echo   SUCCESS!
  echo   View your profile at:
  echo   https://github.com/%USER%
  echo ========================================
) else (
  echo.
  echo   FAILED - see error above
)
echo.
pause
