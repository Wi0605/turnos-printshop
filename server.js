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

let turnos = [];
let contadores = { A: 1, B: 1, C: 1, D: 1 };
let turnoActual = null;
let ultimosTurnos = [];

const SERVICIOS = {
  A: 'Impresiones / Copias Rápidas',
  B: 'Diseño y Modificaciones',
  C: 'Gran Formato / Planos',
  D: 'Encuadernación y Acabados'
};

io.on('connection', (socket) => {
  // Enviar estado actual al conectar
  socket.emit('actualizar_estado', { turnos, turnoActual, ultimosTurnos });

  // Cliente solicita un turno
  socket.on('solicitar_turno', (datos) => {
    const prefijo = datos.categoria;
    const numero = contadores[prefijo]++;
    const codigo = `${prefijo}-${String(numero).padStart(2, '0')}`;

    const nuevoTurno = {
      id: Date.now(),
      codigo,
      categoria: prefijo,
      servicio: SERVICIOS[prefijo],
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'espera'
    };

    turnos.push(nuevoTurno);
    
    socket.emit('turno_creado', nuevoTurno);
    io.emit('actualizar_estado', { turnos, turnoActual, ultimosTurnos });
  });

  // Operario llama al siguiente
  socket.on('llamar_siguiente', () => {
    if (turnos.length > 0) {
      if (turnoActual) {
        ultimosTurnos.unshift({ ...turnoActual, horaFin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        if (ultimosTurnos.length > 5) ultimosTurnos.pop();
      }
      turnoActual = turnos.shift();
      turnoActual.estado = 'atendiendo';
      io.emit('turno_llamado', turnoActual);
      io.emit('actualizar_estado', { turnos, turnoActual, ultimosTurnos });
    }
  });

  // Operario re-llama al turno actual (para que vuelva a sonar en el TV)
  socket.on('rellamar_turno', () => {
    if (turnoActual) {
      io.emit('turno_llamado', turnoActual);
    }
  });

  // Operario finaliza la atención
  socket.on('completar_turno', () => {
    if (turnoActual) {
      ultimosTurnos.unshift({ ...turnoActual, horaFin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      if (ultimosTurnos.length > 5) ultimosTurnos.pop();
    }
    turnoActual = null;
    io.emit('actualizar_estado', { turnos, turnoActual, ultimosTurnos });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`>>> Servidor de Turnos activo en http://localhost:${PORT}`);
  console.log(`>>> Pantalla TV: http://localhost:${PORT}/tv`);
  console.log(`>>> Panel Operario: http://localhost:${PORT}/operario`);
  console.log(`>>> Tótem Clientes: http://localhost:${PORT}/`);
});