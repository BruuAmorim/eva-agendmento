@echo off
cd /d "%~dp0"
echo ========================================
echo   EvAgendamento - Sistema SaaS
echo ========================================
echo.
echo Iniciando sistema completo...
echo.

echo [1/2] Iniciando Backend API...
start "Backend API" cmd /k "cd /d %~dp0 && node server.js"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Servidor Web...
start "Frontend Server" cmd /k "cd /d %~dp0 && node serve.js"

echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo ========================================
echo.
echo URLs de acesso:
echo - Login:     http://localhost:8080/css/index.html
echo - Admin:     http://localhost:8080/admin/dashboard
echo - Usuario:   http://localhost:8080/app/agendamentos
echo.
echo Contas de teste:
echo Admin:  brunadevv@gmail.com / admin123
echo User:   usuarioteste@gmail.com / Mudar@123
echo.
echo Pressione qualquer tecla para fechar...
pause > nul
