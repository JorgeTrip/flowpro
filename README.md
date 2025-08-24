# FlowPro - Utilidades de Gestión Empresarial

**© 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados**

FlowPro es una suite de herramientas empresariales desarrollada en Next.js que ayuda a optimizar la gestión de inventarios y análisis de demanda.

## 🚀 Características

### Módulo de Estimación de Demanda
- **Análisis de Demanda vs. Stock**: Compara las ventas del año anterior con el stock actual
- **Carga de Archivos Excel**: Soporte para archivos `.xlsx` y `.xls`
- **Mapeo de Columnas**: Configuración flexible para diferentes formatos de datos
- **Visualización de Resultados**: Gráficos interactivos y tablas detalladas
- **Sugerencias Inteligentes**: Recomendaciones automáticas de compra basadas en el análisis

### Módulo de Reporte de Ventas
- **Análisis por Rubro**: Visualización detallada de ventas por categoría
- **Desempeño por Zona**: Comparativa de ventas entre diferentes zonas geográficas
- **Tablas Interactivas**: Funcionalidades avanzadas de filtrado y ordenamiento
  - Filtros por período (todos, con datos, específicos)
  - Selector múltiple de meses
  - Alternancia entre importe y cantidad
  - Exportación a CSV personalizada
- **Gráficos Avanzados**:
  - Efectos 3D con sombras SVG
  - Gradientes y bordes redondeados
  - Tooltips informativos
  - Formato compacto para números grandes

### Características de la Interfaz
- **Tema Claro/Oscuro**: Cambio dinámico entre modos con tonos de gris personalizados
- **Diseño Responsivo**: Optimizado para desktop y móvil
- **Navegación Modular**: Sidebar con módulos organizados por categorías
- **Feedback Visual**: Indicadores de carga y estados de error

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15.5.0 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Estado Global**: Zustand con persistencia
- **Procesamiento Excel**: ExcelJS
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Drag & Drop**: React Dropzone

## 📋 Requisitos

- Node.js 18+ 
- npm, yarn, pnpm o bun

## 🚀 Instalación y Desarrollo

1. **Clonar el repositorio**
```bash
git clone https://github.com/JorgeTrip/flowpro.git
cd flowpro
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting con ESLint
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── components/             # Componentes reutilizables
│   │   ├── layout/            # Header, Sidebar, Footer, etc.
│   │   └── business/          # Componentes de lógica de negocio
│   ├── estimar-demanda/       # Módulo de estimación de demanda
│   │   ├── components/        # Componentes específicos del módulo
│   │   └── page.tsx           # Página principal del módulo
│   ├── reporte-de-ventas/     # Módulo de reporte de ventas
│   │   ├── components/        # Componentes del reporte
│   │   │   ├── charts/       # Gráficos interactivos
│   │   │   └── tables/       # Tablas con filtros avanzados
│   │   └── page.tsx          # Página principal del reporte
│   ├── lib/                   # Utilidades y lógica de negocio
│   ├── stores/                # Estado global con Zustand
│   └── globals.css            # Estilos globales
```

## 🎯 Módulos Disponibles

### Estimación de Demanda
1. **Paso 1**: Cargar archivo de ventas del año anterior (Excel)
2. **Paso 2**: Cargar archivo de stock actual (Excel)
3. **Paso 3**: Configurar mapeo de columnas (ID Producto, Cantidad)
4. **Paso 4**: Ejecutar análisis y revisar resultados

### Reporte de Ventas
1. **Selección de Período**:
   - Filtros por rango de fechas
   - Selección de meses específicos
   - Filtrado por disponibilidad de datos

2. **Visualización de Datos**:
   - Gráficos interactivos con zoom y tooltips
   - Tablas con ordenamiento y filtrado avanzado
   - Alternancia entre diferentes métricas (importe/cantidad)

3. **Exportación**:
   - Generación de reportes en CSV
   - Configuración de columnas a exportar
   - Mantenimiento de formato y estilos

### Formato de Archivos Excel

Los archivos deben contener al menos:
- **Columna de ID de Producto**: Identificador único del producto
- **Columna de Cantidad**: Cantidad vendida o en stock

## 🎨 Personalización de Temas

La aplicación incluye un sistema de temas personalizable:
- **Modo Claro**: Tonos de gris suaves para reducir la fatiga visual
- **Modo Oscuro**: Esquema oscuro tradicional
- **Transiciones Suaves**: Cambios animados entre temas

## 🚀 Deployment

### Netlify (Recomendado)
```bash
npm run build
# Los archivos se generan en .next/
```

### Vercel
```bash
vercel --prod
```

## 🤝 Contribución

Este es un proyecto propietario. Para consultas sobre colaboración, contactar al desarrollador.

## 📄 Licencia

© 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados.

## 📞 Contacto

Para soporte técnico o consultas comerciales, contactar al desarrollador principal.
