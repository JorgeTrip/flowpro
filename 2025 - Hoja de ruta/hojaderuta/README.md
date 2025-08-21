# Hoja de Ruta

Aplicación web para generar hojas de ruta optimizadas a partir de archivos Excel con direcciones de entrega. La aplicación agrupa pedidos por razón social, calcula la ruta más eficiente para conectar todas las direcciones y proporciona un resumen detallado de los pedidos e importes.

## Características

- Carga de archivos Excel con información de pedidos
- Agrupación de pedidos por razón social
- Generación de ruta optimizada utilizando OpenStreetMap
- Cálculo de distancia total del recorrido (por calles, no en línea recta)
- Resumen de importes por razón social y total
- Exportación de la hoja de ruta en formato PDF y Excel
- Interfaz responsiva que funciona en dispositivos móviles y de escritorio

## Tecnologías utilizadas

- HTML, CSS, JavaScript
- React.js para la interfaz de usuario
- Leaflet.js para la visualización de mapas
- OSRM (Open Source Routing Machine) para el cálculo de rutas
- SheetJS para el procesamiento de archivos Excel
- Axios para las peticiones HTTP

## Requisitos previos

Para ejecutar este proyecto localmente, necesitas tener instalado:

- Node.js (v14.0.0 o superior)
- npm (v6.0.0 o superior)

## Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tu-usuario/hojaderuta.git
cd hojaderuta
```

2. Instala las dependencias:

```bash
npm install
```

3. Inicia el servidor de desarrollo:

```bash
npm start
```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Formato del archivo Excel

El archivo Excel debe contener las siguientes columnas:

- `FECHA DE EMISION`: Fecha de emisión del pedido
- `COD.VENDEDOR`: Código del vendedor
- `CODIGO CLIENTE`: Código del cliente
- `RAZON SOCIAL`: Nombre o razón social del cliente
- `DIRECCION DE ENTREGA`: Dirección de entrega del pedido
- `LOCALIDAD`: Localidad de la dirección de entrega
- `TIPO COMPROBANTE`: Tipo de comprobante (FAC, REM, etc.)
- `NRO. COMPROBANTE`: Número de comprobante
- `TOTAL A COBRAR`: Importe total a cobrar
- `CANTIDAD DE BULTOS`: Cantidad de bultos o paquetes
- `HORARIO_ENTREGA`: Horario de entrega
- `DESC_COND`: Descripción de la condición de pago

Puedes encontrar un archivo de ejemplo en la carpeta `public/ejemplo_pedidos.csv` que puedes convertir a Excel.

## Uso

1. Abre la aplicación en tu navegador
2. Haz clic en "Seleccionar archivo" o arrastra un archivo Excel al área designada
3. La aplicación procesará los datos y generará una ruta optimizada
4. Se mostrará el mapa con la ruta y un resumen de los pedidos
5. Puedes exportar la hoja de ruta en formato PDF o Excel

## Despliegue en GitHub y Netlify

### Subir a GitHub

1. Crea un nuevo repositorio en GitHub
2. Inicializa Git en tu proyecto local (si aún no lo has hecho):

```bash
git init
git add .
git commit -m "Primer commit"
```

3. Conecta tu repositorio local con el remoto:

```bash
git remote add origin https://github.com/tu-usuario/hojaderuta.git
git branch -M main
git push -u origin main
```

### Desplegar en Netlify

1. Crea una cuenta en [Netlify](https://www.netlify.com/) si aún no tienes una
2. Haz clic en "New site from Git"
3. Selecciona GitHub como proveedor de Git
4. Autoriza a Netlify para acceder a tus repositorios
5. Selecciona el repositorio que acabas de crear
6. Configura las opciones de despliegue:
   - Build command: `npm run build`
   - Publish directory: `build`
7. Haz clic en "Deploy site"

Netlify generará automáticamente una URL para tu sitio. Puedes personalizar esta URL en la configuración del sitio.

## Estructura del proyecto

- `/public`: Archivos estáticos
  - `index.html`: Plantilla HTML principal
  - `ejemplo_pedidos.csv`: Archivo de ejemplo para pruebas
  - `_redirects`: Configuración de redirecciones para Netlify
  - `_headers`: Configuración de encabezados HTTP para Netlify
- `/src`: Código fuente
  - `/components`: Componentes React
    - `FileUploader.js`: Componente para cargar archivos
    - `RouteMap.js`: Componente para mostrar el mapa y la ruta
    - `Summary.js`: Componente para mostrar el resumen de pedidos
  - `/services`: Servicios para API y procesamiento de datos
    - `excelService.js`: Servicio para procesar archivos Excel
    - `routeService.js`: Servicio para calcular rutas
    - `exportService.js`: Servicio para exportar datos
  - `/utils`: Funciones de utilidad
    - `helpers.js`: Funciones auxiliares generales
    - `config.js`: Configuración de la aplicación
    - `errorHandler.js`: Manejo de errores
    - `corsProxy.js`: Utilidades para manejar problemas de CORS
  - `/styles`: Archivos CSS
    - `App.css`: Estilos para el componente App
    - `FileUploader.css`: Estilos para el componente FileUploader
    - `RouteMap.css`: Estilos para el componente RouteMap
    - `Summary.css`: Estilos para el componente Summary
    - `index.css`: Estilos globales
  - `App.js`: Componente principal de la aplicación
  - `index.js`: Punto de entrada de la aplicación

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Si tienes alguna pregunta o sugerencia, no dudes en contactarme.
