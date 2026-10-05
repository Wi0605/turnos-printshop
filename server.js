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
    emoji: '📐',
    desc: 'Pendones, vinilos, planos CAD, lonas',
    color: '#d97706',
    tiempoEstimado: 'Estándar'
  },
  C: {
    id: 'C',
    nombre: 'Diseño / Ajustes',
    emoji: '🎨',
    desc: 'Modificación de archivos o vectores (un poco más lento)',
    color: '#6366f1',
    tiempoEstimado: 'Un poco más lento'
  },
  P: {
    id: 'P',
    nombre: 'Atención Prioritaria',
    emoji: '🧓',
    desc: 'Clientes mayores de edad, embarazo o movilidad reducida',
    color: '#e13032',
    prioridad: true,
    tiempoEstimado: 'Prioritario'
  },
  T: {
    id: 'T',
    nombre: 'Terminados',
    emoji: '📚',
    desc: 'Encuadernación, anillados, plastificado y acabados',
    color: '#059669',
    tiempoEstimado: 'Estándar'
  }
};

let turnos = [];
let contadores = { A: 1, B: 1, C: 1, P: 1, T: 1 };
let turnoActual = null; // Último turno llamado en general
let modulos = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null
};
let ultimosTurnos = [];

function emitirEstadoGeneral() {
  io.emit('actualizar_estado', {
    turnos,
    turnoActual,
    modulos,
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
    ultimosTurnos,
    servicios: SERVICIOS
  });

  // Cliente u Operario solicita un turno
  socket.on('solicitar_turno', (datos) => {
    const prefijo = datos.categoria && SERVICIOS[datos.categoria] ? datos.categoria : 'A';
    const numero = contadores[prefijo]++;
    const codigo = `${prefijo}-${String(numero).padStart(2, '0')}`;
    const infoServicio = SERVICIOS[prefijo];

    const nuevoTurno = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      codigo,
      categoria: prefijo,
      servicio: infoServicio.nombre,
      emoji: infoServicio.emoji,
      color: infoServicio.color,
      prioridad: !!infoServicio.prioridad,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    } else {
      turnos.push(nuevoTurno);
    }

    socket.emit('turno_creado', nuevoTurno);
    emitirEstadoGeneral();
  });

  // Operario llama al siguiente (puede filtrar por categoría opcional o llamar al siguiente general)
  socket.on('llamar_siguiente', (datos = {}) => {
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
        horaFin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    const turnoId = datos.id;
    const moduloId = parseInt(datos.modulo, 10) || 1;

    const index = turnos.findIndex(t => t.id === turnoId);
    if (index === -1) return;

    // Si el módulo ya tenía un turno activo, se archiva en historial
    if (modulos[moduloId]) {
      ultimosTurnos.unshift({
        ...modulos[moduloId],
        horaFin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        horaFin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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