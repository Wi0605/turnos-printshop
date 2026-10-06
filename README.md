# 🖨️ Anillando Cali - Sistema Inteligente de Turnos

Sistema web en tiempo real para gestión, llamada y visualización de turnos en locales de impresión digital, copiado, diseño, gran formato y terminados. Desarrollado con **Node.js**, **Express**, **Socket.IO** y **Tailwind CSS**, con la identidad visual corporativa de [Anillando Cali](https://anillandocali.com/).

---

## 🚀 Características Principales

- **🏢 Soporte Multi-Módulo (1 al 5)**: Permite a los operarios configurar cuántos módulos van a trabajar en el día (de 1 a 5) y seleccionar en cuál se encuentran. El TV anuncia claramente a qué módulo debe acercarse el cliente.
- **🖥️ Pantalla de TV en Sala (`/tv`)**:
  - Diseño widescreen optimizado para monitores y televisores (16:9) con tipografía gigante visible desde lejos.
  - Número de turno en tamaño gigante con indicador grande del módulo de atención.
  - Alerta visual parpadeante y animación luminosa de llamado.
  - Timbre nativo tipo aeropuerto/banco (Web Audio API sin dependencias externas).
  - Anuncio por voz en español con Web Speech API (*"Turno A 1, pasar al Módulo 3"*).
  - Tablero en vivo con el estado de los puestos de atención activos (**1 al 5**).
  - Lista de turnos en espera e historial de últimos llamados con letras ampliadas.
- **👥 Tótem de Clientes (`/`)**:
  - Pantalla táctil para que los clientes seleccionen su servicio y reciban su código.
  - Indicador preferencial para adultos mayores y prioridad.
  - Retorno automático a pantalla de inicio tras 7 segundos.
- **💼 Panel de Operario (`/operario`)**:
  - Configuración inicial de cuántos módulos operarán hoy (1 a 5) y selector activo de puesto.
  - Posibilidad de **atender cualquier turno específico** de la fila con un clic.
  - Botón de **Llamar siguiente general** (con prioridad automática para adultos mayores).
  - Botón de **Llamar siguiente por categoría**.
  - Botón **Re-llamar en TV** (hace sonar y parpadear la pantalla nuevamente).
  - Creación manual de turnos en mostrador.
- **⚡ Tiempo Real**: Comunicación bidireccional instantánea con WebSockets (Socket.IO).

---

## 📋 Categorías de Servicio

| Prefijo | Emoji | Servicio | Descripción | Prioridad |
| :---: | :---: | :--- | :--- | :---: |
| **A** | ⚡ | **Copias e Impresión Rápida** | Trámites rápidos en B/N y color, copias, escaneos | Estándar |
| **B** | 📐 | **Gran Formato** | Pendones, vinilos, planos CAD, lonas | Estándar |
| **C** | 🎨 | **Diseño / Ajustes** | Modificación de archivos o vectores (un poco más lento) | Estándar |
| **P** | 🧓 | **Atención Prioritaria** | Clientes mayores de edad, embarazo o movilidad reducida | **ALTA** |
| **T** | 📚 | **Terminados** | Encuadernación, anillados, plastificado y acabados | Estándar |

---

## 🎨 Identidad Visual (Anillando Cali)

Inspirado en la paleta oficial de [anillandocali.com](https://anillandocali.com/):
- **Azul Petróleo / Slate Teal**: `#3B4E59` (Color corporativo principal)
- **Rojo Vibrante**: `#E13032` (Acentos de llamado y prioridad)
- **Melocotón / Dorado Cálido**: `#FFBC7D` (Contraste y destaques)
- **Fondo Oscuro Pizarra**: `#192227` / `#212C33` (Modo TV de alto contraste)

---

## 🛠️ Instalación y Uso Local

### Requisitos
- Node.js (v18 o superior) y npm

### Pasos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start
```

El sistema estará disponible en: **`http://localhost:3000`**

---

## 🐳 Uso con Docker

```bash
# Construir y arrancar contenedor
docker-compose up -d --build

# Ver logs en vivo
docker-compose logs -f
```

---

## 🖥️ Rutas del Sistema

- **Tótem de Clientes**: `http://localhost:3000/` o `http://localhost:3000/totem`
- **Pantalla TV**: `http://localhost:3000/tv` o `http://localhost:3000/pantalla`
- **Panel de Operario**: `http://localhost:3000/operario`
