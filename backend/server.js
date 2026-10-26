const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'cambia-este-secreto';
const ADMIN_CODE = process.env.ADMIN_CODE || 'ADMIN123'; // código para registrarse como admin
const DB = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// SEGURIDAD: nadie puede ver la carpeta backend (ahí está db.json)
app.use('/backend', (req, res) => res.status(404).end());
// Sirve tu frontend (la carpeta padre) en http://localhost:3000
app.use(express.static(path.join(__dirname, '..')));

// ---------- "Base de datos" en un archivo JSON ----------
function leer() {
    if (!fs.existsSync(DB)) {
        fs.writeFileSync(DB, JSON.stringify({ usuarios: [], calculos: [], sig: 1 }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB, 'utf8'));
}
function guardar(d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

// ---------- Middlewares (filtros antes de cada ruta) ----------
// auth: exige que venga el token de sesión
function auth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ mensaje: 'No autenticado' });
    try { req.user = jwt.verify(token, SECRET); next(); }
    catch { res.status(401).json({ mensaje: 'Sesión inválida o vencida' }); }
}
// soloAdmin: exige que el usuario tenga rol admin
function soloAdmin(req, res, next) {
    if (req.user.rol !== 'admin') return res.status(403).json({ mensaje: 'Solo administradores' });
    next();
}
// publico: datos del usuario SIN la contraseña
const publico = u => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol });

// ---------- Autenticación ----------
app.post('/api/registro', (req, res) => {
    const { nombre, correo, password, rol, codigoAdmin } = req.body;
    if (!nombre || !correo || !password) return res.status(400).json({ mensaje: 'Completa todos los campos' });
    if (password.length < 6) return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 6 caracteres' });

    const db = leer();
    if (db.usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase()))
        return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });

    let rolFinal = 'usuario';
    if (rol === 'admin') {
        if (codigoAdmin !== ADMIN_CODE) return res.status(403).json({ mensaje: 'Código de administrador incorrecto' });
        rolFinal = 'admin';
    }
    const u = { id: db.sig++, nombre, correo, rol: rolFinal, hash: bcrypt.hashSync(password, 10) };
    db.usuarios.push(u);
    guardar(db);
    res.status(201).json({ mensaje: 'Cuenta creada', usuario: publico(u) });
});

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body; // "correo" puede ser el nombre o el correo
    const db = leer();
    const id = (correo || '').toLowerCase();
    const u = db.usuarios.find(x => x.correo.toLowerCase() === id || x.nombre.toLowerCase() === id);
    if (!u || !bcrypt.compareSync(password || '', u.hash))
        return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    const token = jwt.sign({ id: u.id, rol: u.rol }, SECRET, { expiresIn: '4h' });
    res.json({ token, usuario: publico(u) });
});

// Recuperar: genera una contraseña temporal (no hay servidor de correo)
app.post('/api/recuperar', (req, res) => {
    const { nombre, correo } = req.body;
    const db = leer();
    const u = db.usuarios.find(x => x.correo.toLowerCase() === (correo || '').toLowerCase()
        && x.nombre.toLowerCase() === (nombre || '').toLowerCase());
    if (!u) return res.status(404).json({ mensaje: 'No encontramos una cuenta con esos datos' });
    const temporal = Math.random().toString(36).slice(2, 10);
    u.hash = bcrypt.hashSync(temporal, 10);
    guardar(db);
    res.json({ mensaje: `Tu contraseña temporal es: ${temporal}. Cámbiala al iniciar sesión.` });
});

// ---------- CRUD del perfil ----------
app.get('/api/perfil', auth, (req, res) => {
    const u = leer().usuarios.find(x => x.id === req.user.id);
    if (!u) return res.status(404).json({ mensaje: 'Usuario no existe' });
    res.json(publico(u));
});
app.put('/api/perfil', auth, (req, res) => {
    const db = leer();
    const u = db.usuarios.find(x => x.id === req.user.id);
    if (!u) return res.status(404).json({ mensaje: 'Usuario no existe' });
    if (req.body.nombre) u.nombre = req.body.nombre;
    if (req.body.password) {
        if (req.body.password.length < 6) return res.status(400).json({ mensaje: 'Mínimo 6 caracteres' });
        u.hash = bcrypt.hashSync(req.body.password, 10);
    }
    guardar(db);
    res.json(publico(u));
});
app.delete('/api/perfil', auth, (req, res) => {
    const db = leer();
    db.usuarios = db.usuarios.filter(x => x.id !== req.user.id);
    db.calculos = db.calculos.filter(c => c.usuarioId !== req.user.id);
    guardar(db);
    res.json({ mensaje: 'Cuenta eliminada' });
});

// ---------- CRUD de cálculos (historial) ----------
app.get('/api/calculos', auth, (req, res) => {
    const lista = leer().calculos.filter(c => c.usuarioId === req.user.id);
    res.json(lista.reverse()); // los más nuevos primero
});
app.post('/api/calculos', auth, (req, res) => {
    const { tipo, titulo, datos } = req.body;
    if (!tipo || !titulo || !datos) return res.status(400).json({ mensaje: 'Datos incompletos' });
    const db = leer();
    const c = { id: db.sig++, usuarioId: req.user.id, tipo, titulo, datos, fecha: new Date().toISOString() };
    db.calculos.push(c);
    guardar(db);
    res.status(201).json(c);
});
app.put('/api/calculos/:id', auth, (req, res) => {
    const db = leer();
    const c = db.calculos.find(x => x.id === +req.params.id && x.usuarioId === req.user.id);
    if (!c) return res.status(404).json({ mensaje: 'Cálculo no encontrado' });
    if (!req.body.titulo) return res.status(400).json({ mensaje: 'Título requerido' });
    c.titulo = req.body.titulo;
    guardar(db);
    res.json(c);
});
app.delete('/api/calculos/:id', auth, (req, res) => {
    const db = leer();
    const antes = db.calculos.length;
    db.calculos = db.calculos.filter(x => !(x.id === +req.params.id && x.usuarioId === req.user.id));
    if (db.calculos.length === antes) return res.status(404).json({ mensaje: 'Cálculo no encontrado' });
    guardar(db);
    res.json({ mensaje: 'Eliminado' });
});

// ---------- Administración (solo rol admin) ----------
app.get('/api/usuarios', auth, soloAdmin, (req, res) => res.json(leer().usuarios.map(publico)));
app.delete('/api/usuarios/:id', auth, soloAdmin, (req, res) => {
    const id = +req.params.id;
    if (id === req.user.id) return res.status(400).json({ mensaje: 'No puedes eliminarte a ti mismo aquí' });
    const db = leer();
    db.usuarios = db.usuarios.filter(x => x.id !== id);
    db.calculos = db.calculos.filter(c => c.usuarioId !== id);
    guardar(db);
    res.json({ mensaje: 'Usuario eliminado' });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));