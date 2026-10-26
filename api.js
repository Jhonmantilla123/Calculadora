const API_URL = 'http://localhost:3000/api';

const API = {
    token: () => localStorage.getItem('token'),
    usuario: () => JSON.parse(localStorage.getItem('usuario') || 'null'),

    // Función base: hace la petición, agrega el token y lanza error si algo falla
    async _fetch(ruta, metodo = 'GET', cuerpo) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token()) headers.Authorization = 'Bearer ' + this.token();
        const r = await fetch(API_URL + ruta, {
            method: metodo,
            headers,
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            if (r.status === 401 && this.token()) this.logout(); // sesión vencida
            throw new Error(data.mensaje || 'Error en el servidor');
        }
        return data;
    },

    // ----- Autenticación -----
    registro: (nombre, correo, password, rol = 'usuario', codigoAdmin = '') =>
        API._fetch('/registro', 'POST', { nombre, correo, password, rol, codigoAdmin }),
    async login(correo, password) {
        const d = await this._fetch('/login', 'POST', { correo, password });
        localStorage.setItem('token', d.token);
        localStorage.setItem('usuario', JSON.stringify(d.usuario));
        return d;
    },
    recuperar: (nombre, correo) => API._fetch('/recuperar', 'POST', { nombre, correo }),
    logout() { localStorage.removeItem('token'); localStorage.removeItem('usuario'); },
    // Úsala al inicio de páginas privadas: si no hay sesión, manda al login
    requerirSesion() { if (!this.token()) location.href = 'login.html'; },

    // ----- Perfil -----
    perfil: () => API._fetch('/perfil'),
    actualizarPerfil: (datos) => API._fetch('/perfil', 'PUT', datos),
    eliminarCuenta: () => API._fetch('/perfil', 'DELETE'),

    // ----- Cálculos (historial) -----
    listarCalculos: () => API._fetch('/calculos'),
    guardarCalculo: (tipo, titulo, datos) => API._fetch('/calculos', 'POST', { tipo, titulo, datos }),
    renombrarCalculo: (id, titulo) => API._fetch('/calculos/' + id, 'PUT', { titulo }),
    eliminarCalculo: (id) => API._fetch('/calculos/' + id, 'DELETE'),

    // ----- Administración -----
    listarUsuarios: () => API._fetch('/usuarios'),
    eliminarUsuario: (id) => API._fetch('/usuarios/' + id, 'DELETE')
};