@echo off
setlocal enabledelayedexpansion
echo.
echo ==========================================
echo  EJECUTANDO NPM RUN BUILD
echo ==========================================
echo.
echo Iniciando build... (esto puede tomar unos minutos)
echo Por favor espera mientras se ejecuta el proceso...
echo.

REM Crear archivo temporal para el log
set "logfile=build-log-%RANDOM%.txt"

REM Ejecutar npm run build y guardar salida en archivo
echo Ejecutando: npm run build
echo.

REM Mostrar progreso con barra visual mientras se ejecuta
start /b npm run build > "%logfile%" 2>&1
set "buildpid=%ERRORLEVEL%"

REM Inicializar variables para la barra de progreso
set "progress=0"
set "maxprogress=100"
set "step=5"

REM Mostrar barra de progreso mientras el proceso corre
:progress_loop
REM Verificar si el archivo de log tiene contenido (indica que el build terminó)
if exist "%logfile%" (
    for %%A in ("%logfile%") do set "filesize=%%~zA"
    if !filesize! gtr 100 goto build_finished
)

REM Verificar si hay procesos de Node.js corriendo
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" >nul
if !errorlevel! neq 0 (
    REM No hay procesos Node.js, verificar si el build terminó
    timeout /t 1 /nobreak >nul
    if exist "%logfile%" (
        for %%A in ("%logfile%") do set "filesize=%%~zA"
        if !filesize! gtr 100 goto build_finished
    )
    REM Si no hay log aún, continuar esperando
)

REM Calcular la barra de progreso (no reiniciar)
set /a "progress+=step"
if !progress! gtr !maxprogress! set "progress=95"

REM Crear la barra visual
set "bar="
set /a "filled=progress/2"
set /a "empty=50-filled"

for /l %%i in (1,1,!filled!) do set "bar=!bar!#"
for /l %%i in (1,1,!empty!) do set "bar=!bar!-"

REM Limpiar pantalla y mostrar la barra con porcentaje
cls
echo.
echo ==========================================
echo  EJECUTANDO NPM RUN BUILD
echo ==========================================
echo.
echo Iniciando build... (esto puede tomar unos minutos)
echo Por favor espera mientras se ejecuta el proceso...
echo.
echo Ejecutando: npm run build
echo.
echo Progreso:
echo [!bar!] !progress!%%
echo.
if !progress! gtr 80 (
    echo Estado: Finalizando compilacion...
) else if !progress! gtr 50 (
    echo Estado: Optimizando codigo...
) else (
    echo Estado: Compilando proyecto...
)

timeout /t 2 /nobreak >nul
goto progress_loop

:build_finished

REM Mostrar barra completa al finalizar
cls
echo.
echo ==========================================
echo  EJECUTANDO NPM RUN BUILD
echo ==========================================
echo.
echo Progreso:
echo [##################################################] 100%%
echo.
echo Estado: Build completado!

REM Esperar un momento adicional para asegurar que termine
timeout /t 1 /nobreak >nul

REM Verificar si el archivo de log existe y tiene contenido
if not exist "%logfile%" (
    echo ERROR: No se pudo crear el archivo de log
    echo Intentando ejecutar directamente...
    npm run build
    set "buildresult=!ERRORLEVEL!"
    goto show_result
)

REM Mostrar el contenido del log en pantalla
echo.
echo ==========================================
echo RESULTADO DEL BUILD:
echo ==========================================
type "%logfile%"

REM Determinar si fue exitoso basado en el contenido del log
findstr /i "error\|failed\|compilation failed" "%logfile%" >nul
if !errorlevel! equ 0 (
    set "buildresult=1"
) else (
    findstr /i "compiled successfully\|build completed" "%logfile%" >nul
    if !errorlevel! equ 0 (
        set "buildresult=0"
    ) else (
        set "buildresult=1"
    )
)

:show_result
echo.
echo ==========================================

REM Verificar si el comando fue exitoso
if !buildresult! EQU 0 (
    echo BUILD COMPLETADO EXITOSAMENTE
    echo.
    echo Copiando log al clipboard...
    
    REM Copiar el contenido del log al clipboard
    if exist "%logfile%" (
        type "%logfile%" | clip
        echo Log copiado desde archivo
    ) else (
        echo No hay log disponible para copiar
    )
    
    echo.
    echo ==========================================
    echo  LOG COPIADO AL CLIPBOARD
    echo ==========================================
    echo.
    echo El log completo del build ha sido copiado
    echo al portapapeles y esta listo para pegar.
    echo.
) else (
    echo BUILD FALLO ^(Codigo de error: !buildresult!^)
    echo.
    echo Copiando log de errores al clipboard...
    
    REM Copiar el log de errores al clipboard
    if exist "%logfile%" (
        type "%logfile%" | clip
        echo Log de errores copiado desde archivo
    ) else (
        echo No hay log de errores disponible para copiar
    )
    
    echo.
    echo ==========================================
    echo  LOG DE ERRORES COPIADO AL CLIPBOARD
    echo ==========================================
    echo.
    echo El log de errores ha sido copiado al
    echo portapapeles para analisis.
    echo.
)

echo Presiona cualquier tecla para salir...
pause >nul

REM Limpiar archivo temporal
if exist "%logfile%" del "%logfile%" >nul 2>&1

exit /b !buildresult!
