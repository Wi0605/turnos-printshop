# 🖨️ Print Shop - Sistema de Turnos Inteligente

Sistema web en tiempo real para gestión y llamada de turnos en locales de impresión digital, copiado, diseño y acabados. Construido con **Node.js**, **Express**, **Socket.IO** y **Tailwind CSS**.

---

## 🚀 Características

- **Tótem de Autoservicio (`/`)**: Pantalla táctil o de kiosko donde los clientes eligen la categoría de su trámite y obtienen su turno (A, B, C, D).
- **Pantalla de TV (`/tv`)**: Vista optimizada para televisores y monitores de sala (16:9) con llamada en tamaño gigante, animación brillante de atención, timbre polifónico nativo (Web Audio API), síntesis de voz en español, cola de espera y reloj en vivo.
- **Panel de Operario (`/operario`)**: Interfaz para el personal con opciones de llamar siguiente, re-llamar al TV y finalizar atención.
- **Sincronización en Tiempo Real**: WebSocket bidireccional mediante Socket.IO sin demoras ni recargas.
- **Listo para Docker**: Contenedorizado con Docker y Docker Compose para despliegue inmediato.

---

## 📋 Categorías de Servicio

| Prefijo | Servicio | Color |
| :--- | :--- | :--- |
| **A** | Copias e Impresiones Rápidas | Cyan |
| **B** | Diseño / Modificaciones / Vectores | Índigo |
| **C** | Gran Formato / Planos CAD / Vinilos | Ámbar |
| **D** | Encuadernación / Plastificados / Acabados | Esmeralda |

---

## 🛠️ Instalación y Uso Local

### Requisitos
- Node.js (v18+) y npm

### Pasos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start
```

El servidor iniciará en: **`http://localhost:3000`**

---

## 🐳 Uso con Docker

```bash
# Construir y levantar contenedor
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

---

## 🖥️ Rutas del Sistema

- **Tótem de Clientes**: `http://localhost:3000/` o `http://localhost:3000/totem`
- **Pantalla TV**: `http://localhost:3000/tv` o `http://localhost:3000/pantalla`
- **Panel de Operario**: `http://localhost:3000/operario`
