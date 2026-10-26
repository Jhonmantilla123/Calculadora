// ===== Subprogramas internos (el usuario no accede a ellos) =====
function calcularSuperficie(a, b) { return a * b; }          // m²
function calcularVolumen(a, b, c) { return a * b * c; }      // m³

// ===== Utilidades =====
const vistaFormulario = document.getElementById('vista-formulario');
const vistaResultado = document.getElementById('vista-resultado');

function num(id) { return parseFloat(document.getElementById(id).value); }
function valido(...v) { return v.every(x => !isNaN(x) && x > 0); }
function poner(id, texto) { document.getElementById(id).textContent = texto; }
function mostrarResultado() {
    vistaFormulario.style.display = 'none';
    vistaResultado.style.display = 'block';
}
// Guarda el cálculo en el historial (solo si hay sesión y api.js está cargado)
function guardarHistorial(tipo, titulo, datos) {
    if (typeof API === 'undefined' || !API.token()) return;
    API.guardarCalculo(tipo, titulo, datos).catch(err => console.warn('No se guardó:', err.message));
}

// ===== 1. Muro =====
const formMuro = document.getElementById('form-muro');
if (formMuro) formMuro.addEventListener('submit', e => {
    e.preventDefault();
    const espesor = document.getElementById('espesor').value;
    const largo = num('largo'), alto = num('alto');
    if (!valido(largo, alto)) return alert('Ingresa valores válidos.');

    const sup = calcularSuperficie(largo, alto);
    const es20 = espesor === '20';
    const cemento = sup * (es20 ? 10.9 : 15.2);
    const arena = sup * (es20 ? 0.09 : 0.115);
    const ladrillos = Math.ceil(sup * (es20 ? 90 : 120));

    const titulo = `Muro de ${espesor} cm (${largo}x${alto} m)`;
    poner('resultado-titulo', titulo);
    poner('valor-superficie', `${sup.toFixed(2)} m²`);
    poner('valor-cemento', `${cemento.toFixed(1)} Kg`);
    poner('valor-arena', `${arena.toFixed(2)} m³`);
    poner('valor-ladrillos', ladrillos);
    guardarHistorial('muro', titulo, {
        Superficie: `${sup.toFixed(2)} m²`, Cemento: `${cemento.toFixed(1)} Kg`,
        Arena: `${arena.toFixed(2)} m³`, Ladrillos: ladrillos
    });
    mostrarResultado();
});

// ===== 2. Viga =====
const formViga = document.getElementById('form-viga');
if (formViga) formViga.addEventListener('submit', e => {
    e.preventDefault();
    const largo = num('largo');
    if (!valido(largo)) return alert('Ingrese un valor válido');

    const r = {
        cemento: largo * 9, arena: largo * 0.02, piedra: largo * 0.02,
        hierro8: largo * 4, hierro4: largo * 3
    };
    const titulo = `Viga de ${largo} m`;
    poner('resultado-titulo', titulo);
    poner('valor-cemento', `${r.cemento.toFixed(1)} Kg`);
    poner('valor-arena', `${r.arena.toFixed(2)} m³`);
    poner('valor-piedra', `${r.piedra.toFixed(2)} m²`);   // el PDF pide m²
    poner('valor-hierro8', `${r.hierro8.toFixed(0)} m`);
    poner('valor-hierro4', `${r.hierro4.toFixed(0)} m`);
    guardarHistorial('viga', titulo, {
        Cemento: `${r.cemento.toFixed(1)} Kg`, Arena: `${r.arena.toFixed(2)} m³`,
        Piedra: `${r.piedra.toFixed(2)} m²`, 'Hierro del 8': `${r.hierro8.toFixed(0)} m`,
        'Hierro del 4': `${r.hierro4.toFixed(0)} m`
    });
    mostrarResultado();
});

// ===== 3. Columna =====
const formColumna = document.getElementById('form-columna');
if (formColumna) formColumna.addEventListener('submit', e => {
    e.preventDefault();
    const largo = num('largo');
    if (!valido(largo)) return alert('Ingrese un valor válido');

    const r = {
        cemento: largo * 7.5, arena: largo * 0.016, piedra: largo * 0.016,
        hierro10: largo * 6, hierro4: largo * 3
    };
    const titulo = `Columna de ${largo} m`;
    poner('resultado-titulo', titulo);
    poner('valor-cemento', `${r.cemento.toFixed(2)} Kg`);
    poner('valor-arena', `${r.arena.toFixed(3)} m³`);
    poner('valor-piedra', `${r.piedra.toFixed(3)} m²`);   // el PDF pide m²
    poner('valor-hierro10', `${r.hierro10.toFixed(0)} m`);
    poner('valor-hierro4', `${r.hierro4.toFixed(0)} m`);
    guardarHistorial('columna', titulo, {
        Cemento: `${r.cemento.toFixed(2)} Kg`, Arena: `${r.arena.toFixed(3)} m³`,
        Piedra: `${r.piedra.toFixed(3)} m²`, 'Hierro del 10': `${r.hierro10.toFixed(0)} m`,
        'Hierro del 4': `${r.hierro4.toFixed(0)} m`
    });
    mostrarResultado();
});

// ===== 4. Contrapiso (espesor, ancho y largo en metros) =====
const formContrapiso = document.getElementById('form-contrapiso');
if (formContrapiso) formContrapiso.addEventListener('submit', e => {
    e.preventDefault();
    const espesor = num('espesor'), ancho = num('ancho'), largo = num('largo');
    if (!valido(espesor, ancho, largo)) return alert('Ingresa valores válidos.');

    const vol = calcularVolumen(espesor, ancho, largo);
    const cemento = vol * 105, arena = vol * 0.45, piedra = vol * 0.9;

    const titulo = `Contrapiso ${ancho}x${largo}x${espesor} m`;
    poner('resultado-titulo', titulo);
    poner('volumen', `${vol.toFixed(2)} m³`);
    poner('cemento', `${cemento.toFixed(1)} Kg`);
    poner('arena', `${arena.toFixed(2)} m³`);
    poner('piedra', `${piedra.toFixed(2)} m³`);
    guardarHistorial('contrapiso', titulo, {
        Volumen: `${vol.toFixed(2)} m³`, Cemento: `${cemento.toFixed(1)} Kg`,
        Arena: `${arena.toFixed(2)} m³`, Piedra: `${piedra.toFixed(2)} m³`
    });
    mostrarResultado();
});

// ===== 5. Techo (espesor, ancho y largo) =====
const formTecho = document.getElementById('form-techo');
if (formTecho) formTecho.addEventListener('submit', e => {
    e.preventDefault();
    const espesor = num('espesor'), largo = num('largo');
    const ancho = num(document.getElementById('ancho') ? 'ancho' : 'alto');
    if (!valido(espesor, largo, ancho)) return alert('Ingresa valores válidos.');

    const sup = calcularSuperficie(largo, ancho);
    const r = {
        cemento: sup * 33, arena: sup * 0.072, piedra: sup * 0.072,
        hierro8: sup * 7, hierro6: sup * 4
    };
    const titulo = `Techo ${ancho}x${largo} m e=${espesor}`;
    poner('resultado-titulo', titulo);
    poner('superficie', `${sup.toFixed(2)} m²`);
    poner('cemento', `${r.cemento.toFixed(1)} Kg`);
    poner('arena', `${r.arena.toFixed(2)} m³`);
    poner('piedra', `${r.piedra.toFixed(2)} m³`);
    poner('hierro8', `${r.hierro8.toFixed(0)} m`);
    poner('hierro6', `${r.hierro6.toFixed(0)} m`);
    guardarHistorial('techo', titulo, {
        Superficie: `${sup.toFixed(2)} m²`, Cemento: `${r.cemento.toFixed(1)} Kg`,
        Arena: `${r.arena.toFixed(2)} m³`, Piedra: `${r.piedra.toFixed(2)} m³`,
        'Hierro del 8': `${r.hierro8.toFixed(0)} m`, 'Hierro del 6': `${r.hierro6.toFixed(0)} m`
    });
    mostrarResultado();
});

// ===== 6. Pisos (+10% por recortes) =====
const formPiso = document.getElementById('form-piso');
if (formPiso) formPiso.addEventListener('submit', e => {
    e.preventDefault();
    const ancho = num('ancho'), largo = num('largo');
    if (!valido(ancho, largo)) return alert('Ingrese valores válidos.');

    const sup = calcularSuperficie(ancho, largo);
    const total = sup * 1.10;

    const titulo = `Piso ${ancho}x${largo} m`;
    poner('resultado-titulo', titulo);
    poner('valor-superficie', `${sup.toFixed(2)} m²`);
    poner('valor-extra', `${total.toFixed(2)} m²`);
    guardarHistorial('piso', titulo, {
        Superficie: `${sup.toFixed(2)} m²`, 'Total con 10% extra': `${total.toFixed(2)} m²`
    });
    mostrarResultado();
});

// ===== 7. Pintura (rinde 6 m² por litro). El PDF pide la superficie del muro =====
const formPintura = document.getElementById('form-pintura');
if (formPintura) formPintura.addEventListener('submit', e => {
    e.preventDefault();
    const campoSup = document.getElementById('superficie');
    const sup = campoSup ? num('superficie') : calcularSuperficie(num('ancho'), num('alto'));
    if (!valido(sup)) return alert('Ingresa valores válidos.');

    const litros = sup / 6;

    const titulo = `Pintura para ${sup.toFixed(2)} m²`;
    poner('resultado-titulo', titulo);
    poner('valor-superficie', `${sup.toFixed(2)} m²`);
    poner('valor-litros', `${litros.toFixed(2)} L`);
    guardarHistorial('pintura', titulo, {
        Superficie: `${sup.toFixed(2)} m²`, Pintura: `${litros.toFixed(2)} L`
    });
    mostrarResultado();
});