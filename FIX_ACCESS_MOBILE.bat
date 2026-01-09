@echo off
:: BatchGotAdmin
:-------------------------------------
REM  --> Verification des droits d'administrateur
    IF "%PROCESSOR_ARCHITECTURE%" EQU "amd64" (
>nul 2>&1 "%SYSTEMROOT%\SysWOW64\cacls.exe" "%SYSTEMROOT%\SysWOW64\config\system"
) ELSE (
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
)

REM --> Si pas d'admin, on demande l'elevation
if '%errorlevel%' NEQ '0' (
    echo Demande de privileges administrateur...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------

cls
color 0A
echo.
echo ===============================================
echo   DEBLOCAGE DU PARE-FEU WINDOWS (PORT 3001)
echo ===============================================
echo.
echo 1. Suppression des anciennes regles...
netsh advfirewall firewall delete rule name="EduSpace Port 3001" >nul 2>&1

echo 2. Creation de la nouvelle regle...
netsh advfirewall firewall add rule name="EduSpace Port 3001" dir=in action=allow protocol=TCP localport=3001 profile=any

echo.
echo ===============================================
echo             SUCCES ! C'EST DEBLOQUE
echo ===============================================
echo.
echo Vous pouvez maintenant reessayer sur le telephone :
echo.
echo     http://192.168.100.27:3001
echo.
pause
