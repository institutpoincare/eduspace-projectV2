@echo off
echo ===============================================
echo     DEMARRAGE EDUSPACE - NOUVEAU SERVEUR
echo ===============================================
echo.
echo 1. Fermeture des processus Node.js existants...
taskkill /F /IM node.exe >nul 2>&1
echo    (OK)
echo.

echo 2. Installation des dependances (si besoin)...
if not exist "server\node_modules" (
    echo    Installation...
    cd server && cmd /c npm install && cd ..
)

echo.
echo 3. Lancement du Serveur Express (Port 3001)...
echo    Veuillez ne PAS fermer cette fenetre.
echo.

cd server
node server.js

pause
