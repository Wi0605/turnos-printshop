const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Rutas amigables
app.get('/tv', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tv.html')));
app.get('/pantalla', (req, res) => res.sendFile(path.join(__dirname, 'public', 'tv.html')));
app.get('/operario', (req, res) => res.sendFile(path.join(__dirname, 'public', 'operario.html')));
app.get('/totem', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Catálogo de Servicios Anillando Cali
const SERVICIOS = {
  P: {
    id: 'P',
    nombre: 'Atención Prioritaria',
    emoji: '🧓',
    desc: 'Adultos mayores, embarazo o movilidad reducida',
    color: '#e13032',
    prioridad: true,
    tiempoEstimado: 'Prioritario'
  },
  A: {
    id: 'A',
    nombre: 'Impresión Rápida',
    emoji: '⚡',
    desc: 'Trámites rápidos en B/N y color, copias, escaneos',
    color: '#0284c7',
    tiempoEstimado: 'Inmediato'
  },
  B: {
    id: 'B',
    nombre: 'Gran Formato',
    emoji: '🖼️',
    desc: 'Pendones, vinilos, retablos, lonas y avisos',
    color: '#d97706',
    tiempoEstimado: 'Estándar'
  },
  D: {
    id: 'D',
    nombre: 'Plotter CAD',
    emoji: '📐',
    desc: 'Impresión, copias y escáner de planos arquitectónicos e ingeniería',
    color: '#0891b2',
    tiempoEstimado: 'Estándar'
  },
  C: {
    id: 'C',
    nombre: 'Ajustes',
    emoji: '🎨',
    desc: 'Modificación rápida de archivos, medidas o vectores',
    color: '#6366f1',
    tiempoEstimado: 'Un poco más lento'
  },
  T: {
    id: 'T',
    nombre: 'Terminados',
    emoji: '📚',
    desc: 'Encuadernación, anillados, plastificado y laminados',
    color: '#059669',
    tiempoEstimado: 'Estándar'
  },
  O: {
    id: 'O',
    nombre: 'Otros Servicios',
    emoji: '✨',
    desc: 'MDF, sellos de cera, botones publicitarios, corte láser y más',
    color: '#8b5cf6',
    tiempoEstimado: 'Personalizado'
  }
};

let turnos = [];
let contadores = { P: 1, A: 1, B: 1, D: 1, C: 1, T: 1, O: 1 };
let turnoActual = null; // Último turno llamado en general
let totalModulos = 5; // Módulos activos para trabajar (1 a 5)
let modulosConfigurados = false; // Requiere que el operario confirme cuántos módulos van a trabajar
let modulos = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null
};
let ultimosTurnos = [];

const TIMEZONE = process.env.TZ || 'America/Bogota';

function formatearHora12(date = new Date()) {
  try {
    return date.toLocaleTimeString('en-US', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

function formatearFecha(date = new Date()) {
  try {
    return date.toLocaleDateString('es-CO', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

function emitirEstadoGeneral() {
  io.emit('actualizar_estado', {
    turnos,
    turnoActual,
    modulos,
    totalModulos,
    modulosConfigurados,
    ultimosTurnos,
    servicios: SERVICIOS
  });
}

io.on('connection', (socket) => {
  // Enviar estado actual al conectarse
  socket.emit('actualizar_estado', {
    turnos,
    turnoActual,
    modulos,
    totalModulos,
    modulosConfigurados,
    ultimosTurnos,
    servicios: SERVICIOS
  });

  // Operario configura la cantidad de módulos a trabajar (1 a 5)
  socket.on('configurar_modulos', (datos = {}) => {
    const cantidad = Math.max(1, Math.min(5, parseInt(datos.totalModulos, 10) || 5));
    totalModulos = cantidad;
    modulosConfigurados = true;
    const nuevosModulos = {};
    for (let i = 1; i <= totalModulos; i++) {
      nuevosModulos[i] = modulos[i] || null;
    }
    modulos = nuevosModulos;
    emitirEstadoGeneral();
  });

  // Cliente u Operario solicita un turno
  socket.on('solicitar_turno', (datos) => {
    const prefijo = datos.categoria && SERVICIOS[datos.categoria] ? datos.categoria : 'A';
    if (!contadores[prefijo]) contadores[prefijo] = 1;
    const numero = contadores[prefijo]++;
    const codigo = `${prefijo}-${String(numero).padStart(2, '0')}`;
    const infoServicio = SERVICIOS[prefijo] || SERVICIOS['A'];
    const timestamp = Date.now();

    const nuevoTurno = {
      id: timestamp + Math.floor(Math.random() * 1000),
      codigo,
      categoria: prefijo,
      servicio: infoServicio.nombre,
      emoji: infoServicio.emoji,
      color: infoServicio.color,
      prioridad: !!infoServicio.prioridad,
      creadoEn: timestamp,
      hora: formatearHora12(new Date(timestamp)),
      fecha: formatearFecha(new Date(timestamp)),
      creadoPor: datos.creadoPor || 'cliente',
      estado: 'espera'
    };

    // Si es prioritario, lo ubicamos después del último prioritario de la cola
    if (nuevoTurno.prioridad) {
      let indexInsert = 0;
      while (indexInsert < turnos.length && turnos[indexInsert].prioridad) {
        indexInsert++;
      }
      turnos.splice(indexInsert, 0, nuevoTurno);
      nuevoTurno.turnosAntes = indexInsert;
    } else {
      turnos.push(nuevoTurno);
      nuevoTurno.turnosAntes = turnos.length - 1;
    }

    socket.emit('turno_creado', nuevoTurno);
    emitirEstadoGeneral();
  });

  // Operario llama al siguiente (puede filtrar por categoría opcional o llamar al siguiente general)
  socket.on('llamar_siguiente', (datos = {}) => {
    if (!modulosConfigurados) {
      socket.emit('requiere_configuracion_modulos');
      return;
    }
    const moduloId = parseInt(datos.modulo, 10) || 1;
    const categoriaFiltro = datos.categoria || null;

    if (turnos.length === 0) return;

    let indexTurno = -1;
    if (categoriaFiltro && categoriaFiltro !== 'todas') {
      indexTurno = turnos.findIndex(t => t.categoria === categoriaFiltro);
    } else {
      // Prioridad primero si no hay filtro
      indexTurno = 0;
    }

    if (indexTurno === -1) {
      // Si filtró por una categoría que no tiene turnos, no llama nada
      socket.emit('sin_turnos_categoria', { categoria: categoriaFiltro });
      return;
    }

    // Si el módulo ya tenía un turno activo, se pasa al historial
    if (modulos[moduloId]) {
      ultimosTurnos.unshift({
        ...modulos[moduloId],
        horaFin: formatearHora12()
      });
      if (ultimosTurnos.length > 8) ultimosTurnos.pop();
    }

    const turnoSeleccionado = turnos.splice(indexTurno, 1)[0];
    turnoSeleccionado.estado = 'atendiendo';
    turnoSeleccionado.modulo = moduloId;

    modulos[moduloId] = turnoSeleccionado;
    turnoActual = turnoSeleccionado;

    io.emit('turno_llamado', turnoSeleccionado);
    emitirEstadoGeneral();
  });

  // Operario escoge y llama un turno específico de la lista
  socket.on('llamar_especifico', (datos = {}) => {
    if (!modulosConfigurados) {
      socket.emit('requiere_configuracion_modulos');
      return;
    }
    const turnoId = datos.id;
    const moduloId = parseInt(datos.modulo, 10) || 1;

    const index = turnos.findIndex(t => t.id === turnoId);
    if (index === -1) return;

    // Si el módulo ya tenía un turno activo, se archiva en historial
    if (modulos[moduloId]) {
      ultimosTurnos.unshift({
        ...modulos[moduloId],
        horaFin: formatearHora12()
      });
      if (ultimosTurnos.length > 8) ultimosTurnos.pop();
    }

    const turnoSeleccionado = turnos.splice(index, 1)[0];
    turnoSeleccionado.estado = 'atendiendo';
    turnoSeleccionado.modulo = moduloId;

    modulos[moduloId] = turnoSeleccionado;
    turnoActual = turnoSeleccionado;

    io.emit('turno_llamado', turnoSeleccionado);
    emitirEstadoGeneral();
  });

  // Operario re-llama al turno actual de su módulo
  socket.on('rellamar_turno', (datos = {}) => {
    const moduloId = parseInt(datos.modulo, 10) || 1;
    const turnoEnModulo = modulos[moduloId] || turnoActual;

    if (turnoEnModulo) {
      turnoEnModulo.modulo = moduloId;
      io.emit('turno_llamado', turnoEnModulo);
    }
  });

  // Operario finaliza la atención en su módulo
  socket.on('completar_turno', (datos = {}) => {
    const moduloId = parseInt(datos.modulo, 10) || 1;

    if (modulos[moduloId]) {
      ultimosTurnos.unshift({
        ...modulos[moduloId],
        horaFin: formatearHora12()
      });
      if (ultimosTurnos.length > 8) ultimosTurnos.pop();

      if (turnoActual && turnoActual.id === modulos[moduloId].id) {
        turnoActual = null;
      }
      modulos[moduloId] = null;
      emitirEstadoGeneral();
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`>>> ANILLANDO CALI - Sistema de Turnos Inteligente <<<`);
  console.log(`>>> Servidor activo en http://localhost:${PORT}`);
  console.log(`>>> Pantalla TV:     http://localhost:${PORT}/tv`);
  console.log(`>>> Panel Operario:  http://localhost:${PORT}/operario`);
  console.log(`>>> Tótem Clientes:  http://localhost:${PORT}/`);
  console.log(`=======================================================`);
});
