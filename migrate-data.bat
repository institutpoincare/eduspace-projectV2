@echo off
echo ===============================================
echo     MIGRATION DES DONNEES EDUSPACE
echo ===============================================
echo.
echo Ce script va copier vos donnees de /data/ vers /server/data/
echo Les donnees existantes seront preservees (fusion intelligente)
echo.
pause

echo.
echo Migration en cours...
node migrate-data.js

echo.
echo ===============================================
echo     MIGRATION TERMINEE
echo ===============================================
echo.
echo Vous pouvez maintenant demarrer le serveur avec:
echo     start_server.bat
echo.
pause
