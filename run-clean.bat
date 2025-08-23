@echo off
echo Limpiando cache de Next.js...
if exist .next (
    rd /s /q .next
    echo Cache de Next.js eliminado.
) else (
    echo No se encontro cache de Next.js.
)

echo Iniciando servidor de desarrollo...
npm run dev
