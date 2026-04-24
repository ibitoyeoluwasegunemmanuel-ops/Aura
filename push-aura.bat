@echo off
setlocal EnableDelayedExpansion

REM ==========================================================
REM  AURA - one-click push script
REM  Clones your GitHub repo, drops aura-core into it,
REM  commits, and pushes a feature branch.
REM  Rotate the token right after this finishes.
REM ==========================================================

echo.
echo === AURA push helper ===
echo.
echo This will:
echo   1. Clone ibitoyeoluwasegunemmanuel-ops/Aura into a temp folder
echo   2. Copy aura-core from Claude's outputs into it
echo   3. Commit and push branch feat/aura-core-jarvis-loop
echo.

REM Absolute path to aura-core on this machine
set "SRC_DIR=C:\Users\Ibitoye oluwasegun E\AppData\Roaming\Claude\local-agent-mode-sessions\4d001d81-0db1-4dd1-b8af-abdbbb3031b7\224b3a48-b7f3-4280-a89c-7dfcf3dab5a8\local_ea7a7131-77b5-440a-bff7-82ac9ab839f9\outputs\aura-core"

if not exist "%SRC_DIR%" (
    echo.
    echo ERROR: Could not find aura-core folder at:
    echo   %SRC_DIR%
    echo.
    pause
    exit /b 1
)

REM Check git is installed
where git >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: git is not installed or not on PATH.
    echo Install from https://git-scm.com/download/win then re-run.
    pause
    exit /b 1
)

set /p TOKEN=Paste your GitHub token (ghp_...):

if "%TOKEN%"=="" (
    echo No token provided. Exiting.
    pause
    exit /b 1
)

set "REPO_URL=https://%TOKEN%@github.com/ibitoyeoluwasegunemmanuel-ops/Aura.git"
set "WORKDIR=%TEMP%\aura-push-%RANDOM%"

echo.
echo Cloning repo to %WORKDIR% ...
git clone "%REPO_URL%" "%WORKDIR%"
if errorlevel 1 (
    echo.
    echo Clone failed. Check:
    echo   - Token is valid
    echo   - You have internet
    pause
    exit /b 1
)

echo.
echo Copying aura-core into repo ...
xcopy /E /I /Y "%SRC_DIR%" "%WORKDIR%\aura-core" > nul
if errorlevel 1 (
    echo Copy failed.
    pause
    exit /b 1
)

cd /d "%WORKDIR%"

echo.
echo Configuring git identity for this commit ...
git config user.email "ibitoyesegun5@gmail.com"
git config user.name  "ibitoyeoluwasegunemmanuel-ops"

echo.
echo Creating branch and committing ...
git checkout -b feat/aura-core-jarvis-loop
git add aura-core
git commit -m "feat: aura-core - Jarvis loop (voice, planner, 13 tools, memory, undo, parallel)"

echo.
echo Pushing ...
git push -u origin feat/aura-core-jarvis-loop
if errorlevel 1 (
    echo.
    echo Push failed. Common causes:
    echo   - Token lacks repo scope
    echo   - Token has been revoked
    echo   - Branch already exists on remote
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  DONE. Branch pushed: feat/aura-core-jarvis-loop
echo.
echo  Open this URL to create the PR:
echo  https://github.com/ibitoyeoluwasegunemmanuel-ops/Aura/pull/new/feat/aura-core-jarvis-loop
echo.
echo  NOW GO REVOKE THE TOKEN:
echo  https://github.com/settings/tokens
echo ============================================================
echo.

REM Clean up the temp clone
cd /d "%USERPROFILE%\Desktop"
rmdir /s /q "%WORKDIR%" 2>nul

pause
