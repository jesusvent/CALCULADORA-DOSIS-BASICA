// Calculadora de Dosis Veterinaria — © 2026 Jesús Ventura. Todos los derechos reservados.
// Software propietario — ver LICENSE en la raíz del repositorio. Prohibida su copia,
// modificación, distribución o reutilización, total o parcial, sin autorización por escrito.

// ============================================================
// Utilidades generales
// ============================================================
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function formatNum(n) {
  return Number(n.toFixed(3)).toString().replace(".", ",");
}

// Expresa una cantidad de comprimidos con su valor decimal exacto (ej. 0,34), sin forzar
// a fracciones habituales, ya que no toda dosis se ajusta a 1/4, 1/2 o 3/4 de comprimido.
function fraccionComprimido(cantidad) {
  return Number(cantidad.toFixed(2)).toString().replace(".", ",");
}

function unidadComprimidos(cantidad) {
  return Math.round(cantidad * 100) / 100 === 1 ? "comprimido" : "comprimidos";
}

function textoComprimidos(min, max) {
  const a = fraccionComprimido(min);
  if (min === max) return `${a} ${unidadComprimidos(min)}`;
  const b = fraccionComprimido(max);
  return `${a} – ${b} ${unidadComprimidos(max)}`;
}

// Acorta el nombre oficial de un medicamento de CIMAVET/CIMA (ej. "NICILAN 500 mg
// comprimidos para perros y gatos") a "marca + concentración" (ej. "Nicilan 500")
// para mostrarlo junto a la cantidad en el resumen del paciente.
function marcaCorta(nombreCompleto) {
  if (!nombreCompleto) return null;
  const m = /^(.*?)\s+(\d+(?:[.,]\d+)?)/.exec(nombreCompleto.trim());
  if (!m) return nombreCompleto;
  const marca = m[1].trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return `${marca} ${m[2]}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// Búsqueda local (principio activo / nombre comercial)
// Incluye tanto la base de datos interna (DRUGS) como los
// fármacos personalizados que el usuario añade en "Mi base de datos".
// ============================================================
let customDrugs = []; // cargado desde IndexedDB
let INDICE = [];

function construirIndice(farmacos) {
  const indice = [];
  const porPrincipioActivo = new Map();
  for (const f of farmacos) {
    indice.push({ termino: f.principioActivo, tipo: "Principio activo", farmaco: f });
    for (const nc of f.nombresComerciales) {
      indice.push({ termino: nc, tipo: "Nombre comercial", farmaco: f });
    }
    porPrincipioActivo.set(normalizar(f.principioActivo), f);
  }
  // Las marcas del formulario del hospital (PRODUCTOS_HOSPITAL, ej. "Nelio") no siempre están
  // registradas también como nombre comercial del fármaco correspondiente en la base de datos
  // interna (ej. benazepril solo tiene "Fortekor" y "Benefortin" en nombresComerciales) — se
  // indexan igualmente aquí, resolviendo su composición a través de ALIAS_COMPOSICION_HOSPITAL,
  // para que buscar cualquier marca del hospital encuentre el fármaco, su dosis, sus alternativas
  // en CIMAVET y el resto de marcas recomendadas/fuera de acuerdo, igual que con Fortekor.
  for (const p of PRODUCTOS_HOSPITAL) {
    const alias = ALIAS_COMPOSICION_HOSPITAL[p.composicion.trim().toLowerCase()];
    if (!alias) continue;
    const f = porPrincipioActivo.get(normalizar(alias));
    if (f) indice.push({ termino: p.marca, tipo: "Nombre comercial", farmaco: f });
  }
  return indice;
}

function reconstruirIndice() {
  INDICE = construirIndice(DRUGS.concat(customDrugs));
}
reconstruirIndice();

function buscarLocal(query) {
  const q = normalizar(query.trim());
  if (!q) return [];
  const vistos = new Set();
  const resultados = [];
  for (const entrada of INDICE) {
    if (normalizar(entrada.termino).includes(q)) {
      const key = entrada.farmaco.id + "|" + entrada.termino;
      if (!vistos.has(key)) {
        vistos.add(key);
        resultados.push(entrada);
      }
    }
  }
  resultados.sort((a, b) => {
    const aStarts = normalizar(a.termino).startsWith(q) ? 0 : 1;
    const bStarts = normalizar(b.termino).startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.termino.localeCompare(b.termino, "es");
  });
  return resultados.slice(0, 15);
}

// ============================================================
// Estado de la app
// ============================================================
const paciente = { nombre: "", especie: "perro", peso: null };
let farmacoActivo = null;
let patologiaSeleccionada = null;
let listaPaciente = []; // entradas añadidas para el paciente actual
let comprimidoActivo = null; // { mg } cuando la presentación elegida es sólida (comprimidos), en vez de líquida (ml)
let marcaComercialActiva = null; // nombre del medicamento concreto elegido en CIMAVET (ej. "Nicilan 500"), o null si es una concentración genérica/manual
let indicacionAntibioticoActiva = null; // { indicacion, opcion } seleccionada en el desplegable de indicación
let usoEspecificoActivo = null; // { nombre, datos } seleccionado en el desplegable de uso/procedimiento

// ============================================================
// Referencias al DOM
// ============================================================
const pacienteNombreInput = document.getElementById("paciente-nombre");
const pacienteEspecieSelect = document.getElementById("paciente-especie");
const pacientePesoInput = document.getElementById("paciente-peso");
const pacienteSuperficieCorporalEl = document.getElementById("paciente-superficie-corporal");

const inputBusqueda = document.getElementById("busqueda");
const listaSugerencias = document.getElementById("sugerencias");
const seccionFarmaco = document.getElementById("seccion-farmaco");
const nombreFarmacoEl = document.getElementById("nombre-farmaco");
const categoriaFarmacoEl = document.getElementById("categoria-farmaco");
const composicionFarmacoEl = document.getElementById("composicion-farmaco");
const nombresComercialesEl = document.getElementById("nombres-comerciales");
const productosHospitalEl = document.getElementById("productos-hospital");
const avisoPersonalizadoEl = document.getElementById("aviso-personalizado");
const irEditarBtn = document.getElementById("ir-a-editar-mifarmaco");
const avisoEspecieEl = document.getElementById("aviso-especie");

const comercialSelect = document.getElementById("comercial-cimavet");
const comercialDetalleEl = document.getElementById("comercial-cimavet-detalle");
const avisoNoEnBdEl = document.getElementById("aviso-no-en-bd");
const listadoCompletoBoton = document.getElementById("listado-completo-boton");
const listadoCompletoEl = document.getElementById("listado-completo");
const listadoCompletoFiltroEl = document.getElementById("listado-completo-filtro");
const listadoCompletoListaEl = document.getElementById("listado-completo-lista");

const patologiaSelectorContenedor = document.getElementById("patologia-selector-contenedor");
const patologiaSelector = document.getElementById("patologia-selector");

const bloqueUsoEspecificoEl = document.getElementById("bloque-uso-especifico");
const usoEspecificoSelectorEl = document.getElementById("uso-especifico-selector");
const resultadoUsoEspecificoEl = document.getElementById("resultado-uso-especifico");

const bloqueIndicacionAntibioticoEl = document.getElementById("bloque-indicacion-antibiotico");
const indicacionAntibioticoSelectorEl = document.getElementById("indicacion-antibiotico-selector");
const resultadoIndicacionAntibioticoEl = document.getElementById("resultado-indicacion-antibiotico");
const notasIndicacionAntibioticoEl = document.getElementById("notas-indicacion-antibiotico");
const alternativasIndicacionAntibioticoEl = document.getElementById("alternativas-indicacion-antibiotico");

const resultadoReferenciaEl = document.getElementById("resultado-referencia");
const dosisPersonalizadaValorInput = document.getElementById("dosis-personalizada-valor");
const dosisPersonalizadaUnidadSelect = document.getElementById("dosis-personalizada-unidad");
const resultadoPersonalizadaEl = document.getElementById("resultado-personalizada");
const concentracionInput = document.getElementById("concentracion");
const concentracionCimavetSelect = document.getElementById("concentracion-cimavet");
const concentracionCimavetEstadoEl = document.getElementById("concentracion-cimavet-estado");

const cimavetFarmacoResultadoEl = document.getElementById("cimavet-farmaco-resultado");
const bibliografiaBotonesEl = document.getElementById("bibliografia-botones");
const bibliografiaResultadosEl = document.getElementById("bibliografia-resultados");

const imagenDescripcionInput = document.getElementById("imagen-descripcion");
const imagenInput = document.getElementById("imagen-input");
const imagenesGaleriaEl = document.getElementById("imagenes-galeria");

const resumenListaEl = document.getElementById("resumen-lista");
const resumenContadorEl = document.getElementById("resumen-contador");
const vaciarResumenBtn = document.getElementById("vaciar-resumen");
const interaccionesEl = document.getElementById("interacciones-lista");

const protocolosListaEl = document.getElementById("protocolos-lista");
const protocolosBuscadorEl = document.getElementById("protocolos-buscador");
protocolosBuscadorEl.addEventListener("input", renderProtocolos);

const cimavetBusquedaInput = document.getElementById("cimavet-busqueda");
const cimavetBuscarBoton = document.getElementById("cimavet-buscar-boton");
const cimavetResultadoGeneralEl = document.getElementById("cimavet-resultado-general");

// ============================================================
// Navegación entre vistas principales
// ============================================================
document.querySelectorAll(".tab-principal").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-principal").forEach((b) => b.classList.remove("activa"));
    btn.classList.add("activa");
    document.querySelectorAll(".vista").forEach((v) => v.classList.add("oculto"));
    document.getElementById("vista-" + btn.dataset.vista).classList.remove("oculto");
    if (btn.dataset.vista === "protocolos") renderProtocolos();
    if (btn.dataset.vista === "misfarmacos") { renderMisFarmacos(); renderProtocolosOcultos(); }
    if (btn.dataset.vista === "cri") actualizarCri();
  });
});

// Sub-pestañas dentro de la ficha de fármaco
document.querySelectorAll(".subtab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("activa"));
    btn.classList.add("activa");
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("oculto"));
    document.getElementById(btn.dataset.panel).classList.remove("oculto");
    if (btn.dataset.panel === "panel-cimavet-farmaco" && farmacoActivo) {
      cargarCimavetParaFarmaco(farmacoActivo);
    }
    if (btn.dataset.panel === "panel-bibliografia" && farmacoActivo) {
      cargarBibliografiaPubMed(farmacoActivo);
    }
    if (btn.dataset.panel === "panel-imagenes" && farmacoActivo) {
      renderImagenes();
    }
  });
});

// ============================================================
// Paciente
// ============================================================
[pacienteNombreInput, pacienteEspecieSelect, pacientePesoInput].forEach((el) => {
  el.addEventListener("input", actualizarPaciente);
  el.addEventListener("change", actualizarPaciente);
});

// Superficie corporal (m²) por la fórmula de Meeh, la habitual en oncología veterinaria para
// dosificar quimioterapia (mg/m², no mg/kg, ya que la relación peso-superficie no es lineal):
// BSA (m²) = K × peso(g)^(2/3) / 10000, con K=10.1 en perro y K=10.0 en gato (Kirk's Current
// Veterinary Therapy). Expresado directamente con el peso en kg: BSA = (K/100) × peso(kg)^(2/3).
function calcularSuperficieCorporal(pesoKg, especie) {
  const k = especie === "gato" ? 10.0 : 10.1;
  return (k / 100) * Math.pow(pesoKg, 2 / 3);
}

function actualizarSuperficieCorporal() {
  if (!paciente.peso || paciente.peso <= 0) {
    pacienteSuperficieCorporalEl.textContent = "";
    return;
  }
  const m2 = calcularSuperficieCorporal(paciente.peso, paciente.especie);
  pacienteSuperficieCorporalEl.textContent = `Superficie corporal: ${formatNum(m2)} m² (fórmula de Meeh — para dosificar quimioterapia en mg/m², no incluida en esta calculadora por seguridad; consulta el protocolo específico).`;
}

function actualizarPaciente() {
  paciente.nombre = pacienteNombreInput.value.trim();
  paciente.especie = pacienteEspecieSelect.value;
  paciente.peso = parseFloat(pacientePesoInput.value) || null;
  if (farmacoActivo) actualizarFichaFarmaco();
  actualizarSuperficieCorporal();
  actualizarCri();
}

const nuevoPacienteBoton = document.getElementById("nuevo-paciente-boton");
nuevoPacienteBoton.addEventListener("click", nuevoPaciente);

const cerrarFarmacoBoton = document.getElementById("cerrar-farmaco-boton");
cerrarFarmacoBoton.addEventListener("click", () => {
  cerrarBusquedaFarmaco();
  inputBusqueda.focus();
});

function nuevoPaciente() {
  if (listaPaciente.length && !confirm("¿Empezar con un nuevo paciente? Se borrará el resumen y la búsqueda actuales.")) {
    return;
  }

  // Paciente
  paciente.nombre = "";
  paciente.especie = "perro";
  paciente.peso = null;
  pacienteNombreInput.value = "";
  pacienteEspecieSelect.value = "perro";
  pacientePesoInput.value = "";
  actualizarSuperficieCorporal();

  // Búsqueda de fármaco activa
  cerrarBusquedaFarmaco();

  // Resumen del paciente
  listaPaciente = [];
  renderResumenPaciente();

  // Protocolos (dependen del peso/especie del paciente)
  renderProtocolos();

  pacienteNombreInput.focus();
}

// Descarta el fármaco que se está viendo/buscando (sin tocar el resumen del paciente
// ni sus datos), para poder empezar una nueva búsqueda desde cero.
function cerrarBusquedaFarmaco() {
  farmacoActivo = null;
  patologiaSeleccionada = null;
  comprimidoActivo = null;
  marcaComercialActiva = null;
  inputBusqueda.value = "";
  listaSugerencias.innerHTML = "";
  listaSugerencias.classList.add("oculto");
  seccionFarmaco.classList.add("oculto");
  resetComercialSelect("Escribe el principio activo");
  actualizarConcentracionesDetectadas([]);
  concentracionInput.value = "";
  dosisPersonalizadaValorInput.value = "";
  avisoNoEnBdEl.classList.add("oculto");
}

// ============================================================
// Búsqueda de fármacos (base de datos interna + personalizada)
// y desplegable de nombres comerciales en vivo (CIMAVET)
// ============================================================
inputBusqueda.addEventListener("input", () => {
  const localResultados = buscarLocal(inputBusqueda.value);
  renderSugerencias(localResultados);
  const valor = inputBusqueda.value.trim();
  clearTimeout(inputBusqueda._debounce);
  if (valor.length < 3) {
    resetComercialSelect("Escribe el principio activo");
    actualizarConcentracionesDetectadas([]);
    avisoNoEnBdEl.classList.add("oculto");
    return;
  }
  actualizarAvisoNoEnBd(valor, localResultados);
  inputBusqueda._debounce = setTimeout(() => cargarComercialesParaTexto(valor), 400);
});

// Si el texto buscado no coincide con ningún fármaco (ni de la base de datos interna ni de
// "Mi base de datos"), ofrece un atajo para darlo de alta ahí mismo con dosis por indicación.
// Búsqueda genérica en PubMed a partir de un texto libre (para un fármaco que ni siquiera
// está en CIMAVET/CIMA con nombre reconocible, o que aún no está en la base de datos de
// dosis): sin indicación concreta, solo el nombre + la especie del paciente activo.
// Acotada a propósito a solo tres cosas: el nombre buscado (p. ej. "Apoquel"), su principio
// activo si se conoce (p. ej. "oclacitinib", ya que en PubMed casi nunca aparece el nombre
// comercial) y la especie del paciente activo — nada de indicación ni otros términos, para no
// vaciar los resultados de un fármaco que aún no está en la base de datos de dosis.
//
// Extrae términos "atómicos" de un texto para combinarlos en una búsqueda OR de PubMed:
// - separa ingredientes combinados unidos por "+" o "," (p. ej. "Glucosamina + condroitín
//   sulfato"), ya que un nombre compuesto tal cual casi nunca aparece como frase literal en
//   un abstract;
// - saca el contenido entre paréntesis como término adicional en vez de dejarlo anidado
//   dentro de la cadena — los paréntesis literales rompen el anidamiento de la consulta y la
//   vacían por completo (ej. "Producto de levadura (Saccharomyces cerevisiae)" generaba
//   "(Producto de levadura (Saccharomyces cerevisiae) OR ...)", que PubMed no sabe interpretar
//   y devuelve 0 resultados).
function terminosPubMed(texto) {
  if (!texto) return [];
  const extras = [];
  const base = texto.replace(/\(([^)]*)\)/g, (_, contenido) => { extras.push(contenido); return " + "; });
  return [base, ...extras]
    .join(" + ")
    .split(/[+,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function urlPubMedTexto(nombreBuscado, principioActivo, especie) {
  const especieEn = especie === "gato" ? "(cat OR feline)" : "(dog OR canine)";
  // Traduce el principio activo si está en el diccionario (PubMed apenas indexa literatura en
  // español): sin esto, un suplemento como "Caseína hidrolizada (alfa-casozepina)" se busca
  // literalmente en español y no encuentra prácticamente nada.
  const principioActivoEn = (typeof PRINCIPIO_ACTIVO_PUBMED_EN !== "undefined" && PRINCIPIO_ACTIVO_PUBMED_EN[principioActivo]) || principioActivo;
  const terminos = [...new Set([...terminosPubMed(nombreBuscado), ...terminosPubMed(principioActivoEn)])];
  const nombreTerm = terminos.length > 1 ? `(${terminos.join(" OR ")})` : terminos[0];
  return "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(`${nombreTerm} AND ${especieEn}`);
}

function actualizarAvisoNoEnBd(valor, localResultados) {
  if (localResultados.length) {
    avisoNoEnBdEl.classList.add("oculto");
    return;
  }
  // El enlace "Buscar en PubMed" no se repite aquí: el respaldo de CIMA/CIMAVET que se carga
  // justo debajo (cargarComercialesParaTexto) ya trae su propio enlace de PubMed específico
  // por cada producto encontrado — o, si tampoco hay nada en CIMA, uno genérico igualmente —
  // así que ponerlo también aquí solo duplicaba el mismo enlace dos veces en pantalla.
  avisoNoEnBdEl.classList.remove("oculto");
  avisoNoEnBdEl.innerHTML = `"${escapeHtml(valor)}" no está en tu base de datos de dosis. ` +
    `<button type="button" class="boton-enlace" id="anadir-no-en-bd-boton">+ Añadirlo a Mi base de datos</button>`;
  document.getElementById("anadir-no-en-bd-boton").addEventListener("click", () => {
    document.querySelector('.tab-principal[data-vista="misfarmacos"]').click();
    abrirFormulario();
    cfPrincipioActivo.value = valor.charAt(0).toUpperCase() + valor.slice(1);
  });
}

// ============================================================
// Listado completo de fármacos de la base de datos (base interna + personalizados),
// para poder ver de un vistazo todo lo disponible sin tener que adivinar qué buscar.
// ============================================================
listadoCompletoBoton.addEventListener("click", () => {
  const abrir = listadoCompletoEl.classList.contains("oculto");
  listadoCompletoEl.classList.toggle("oculto");
  listadoCompletoBoton.textContent = abrir ? "📋 Ocultar listado de fármacos" : "📋 Ver todos los fármacos de la base de datos";
  if (abrir) {
    listadoCompletoFiltroEl.value = "";
    renderListadoCompleto();
    listadoCompletoFiltroEl.focus();
  }
});
listadoCompletoFiltroEl.addEventListener("input", renderListadoCompleto);

// Muestra primero el/los nombre(s) comercial(es) (lo que el usuario reconoce a simple vista,
// ej. "Zylkene") y el principio activo como subtítulo (ej. "Caseína hidrolizada..."), no al
// revés — igual que ya se hizo en "Mi base de datos". Si un fármaco no tiene ningún nombre
// comercial registrado, se usa el principio activo como título por no dejarlo en blanco.
function nombrePrincipalListado(f) {
  return (f.nombresComerciales && f.nombresComerciales.length) ? f.nombresComerciales.join(", ") : f.principioActivo;
}

function renderListadoCompleto() {
  const todos = [...DRUGS, ...customDrugs].slice().sort((a, b) => nombrePrincipalListado(a).localeCompare(nombrePrincipalListado(b), "es"));
  const filtro = normalizar(listadoCompletoFiltroEl.value.trim());
  const filtrados = !filtro ? todos : todos.filter((f) =>
    normalizar(f.principioActivo).includes(filtro) ||
    (f.nombresComerciales || []).some((nc) => normalizar(nc).includes(filtro))
  );

  if (!filtrados.length) {
    listadoCompletoListaEl.innerHTML = `<p class="placeholder">Ningún fármaco coincide con el filtro.</p>`;
    return;
  }

  listadoCompletoListaEl.innerHTML = `<p class="ayuda">${filtrados.length} de ${todos.length} fármaco(s)</p>` +
    filtrados.map((f) => `
      <div class="listado-completo-fila" data-id="${f.id}">
        <span class="listado-completo-nombre">${escapeHtml(nombrePrincipalListado(f))}${f.esPersonalizado ? ` <span class="tipo-tag tipo-tag-personalizado">Personalizado</span>` : ""}</span>
        <span class="listado-completo-comerciales">${escapeHtml(f.principioActivo)}</span>
        <span class="listado-completo-categoria">${escapeHtml(f.categoria || "")}</span>
      </div>
    `).join("");

  listadoCompletoListaEl.querySelectorAll(".listado-completo-fila").forEach((fila) => {
    fila.addEventListener("click", () => {
      const f = todos.find((x) => x.id === fila.dataset.id);
      if (f) seleccionarFarmaco(f, nombrePrincipalListado(f));
      listadoCompletoEl.classList.add("oculto");
      listadoCompletoBoton.textContent = "📋 Ver todos los fármacos de la base de datos";
    });
  });
}
inputBusqueda.addEventListener("focus", () => {
  if (inputBusqueda.value.trim()) renderSugerencias(buscarLocal(inputBusqueda.value));
});

document.addEventListener("click", (e) => {
  if (!listaSugerencias.contains(e.target) && e.target !== inputBusqueda) {
    listaSugerencias.classList.add("oculto");
  }
});

function renderSugerencias(resultados) {
  listaSugerencias.innerHTML = "";
  if (resultados.length === 0) {
    listaSugerencias.classList.add("oculto");
    return;
  }
  for (const r of resultados) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="termino">${escapeHtml(r.termino)}</span> <span class="tipo-tag">${escapeHtml(r.tipo)}</span>` +
      (r.tipo === "Nombre comercial" ? `<span class="submeta">${escapeHtml(r.farmaco.principioActivo)}</span>` : "") +
      (r.farmaco.esPersonalizado ? `<span class="tipo-tag tipo-tag-personalizado">Personalizado</span>` : "");
    li.addEventListener("click", () => seleccionarFarmaco(r.farmaco, r.termino));
    listaSugerencias.appendChild(li);
  }
  listaSugerencias.classList.remove("oculto");
}

function seleccionarFarmaco(farmaco, terminoBuscado) {
  farmacoActivo = farmaco;
  patologiaSeleccionada = null;
  comprimidoActivo = null;
  marcaComercialActiva = null;
  // Si se encontró por nombre comercial (ej. "Fortiflora Felina"), el cuadro de búsqueda se
  // queda con ese texto en vez de cambiarlo por el principio activo — cambiarlo confundía,
  // ya que parecía que la búsqueda por nombre comercial no había funcionado.
  inputBusqueda.value = terminoBuscado || farmaco.principioActivo;
  listaSugerencias.classList.add("oculto");
  avisoNoEnBdEl.classList.add("oculto");

  // Reset a la sub-pestaña "Dosis"
  document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("activa"));
  document.querySelector('.subtab[data-panel="panel-dosis"]').classList.add("activa");
  document.querySelectorAll(".panel").forEach((p) => p.classList.add("oculto"));
  document.getElementById("panel-dosis").classList.remove("oculto");

  // Una nueva búsqueda no debe arrastrar la concentración/comprimido, la dosis
  // personalizada ni los resultados del fármaco anterior: se limpia todo antes
  // de cargar los datos del nuevo fármaco (lo único que se conserva es lo que
  // ya se hubiera añadido al resumen del paciente).
  dosisPersonalizadaValorInput.value = "";
  concentracionInput.value = "";
  concentracionCimavetSelect.innerHTML = "";
  concentracionCimavetSelect.classList.add("oculto");
  concentracionCimavetEstadoEl.textContent = "";
  resultadoReferenciaEl.innerHTML = "";
  resultadoPersonalizadaEl.innerHTML = "";
  cimavetFarmacoResultadoEl.innerHTML = `<p class="placeholder">Cargando...</p>`;

  seccionFarmaco.classList.remove("oculto");
  actualizarFichaFarmaco();

  // Un fármaco personalizado con una composición reconocible (ej. "200 mg/ml") ya trae su
  // propia concentración indicada por el usuario: se usa directamente esa, sin lanzar una
  // búsqueda en CIMAVET/CIMA que podría no encontrar nada (o encontrar varias presentaciones
  // ambiguas de otros productos) y dejar la sensación de que "vuelve a pedir la composición".
  const presentacionPersonalizada = farmaco.esPersonalizado ? extraerPresentacionDeComposicion(farmaco.composicion) : null;
  if (presentacionPersonalizada) {
    aplicarPresentacion(presentacionPersonalizada);
    concentracionCimavetEstadoEl.textContent = `Concentración tomada de la composición indicada: ${etiquetaPresentacion(presentacionPersonalizada)}.`;
    resetComercialSelect("Fármaco personalizado — concentración ya indicada arriba");
    cimavetFarmacoResultadoEl.innerHTML = `<p class="ayuda">Fármaco personalizado con concentración propia. Si quieres comparar con productos comerciales reales, consulta la pestaña "Buscador CIMAVET y CIMA".</p>`;
  } else {
    // Se pasa el término con el que realmente se encontró el fármaco (ej. "Zylkene", si se
    // buscó por nombre comercial) para que, si CIMAVET/CIMA no encuentran nada por el
    // principio activo (habitual en suplementos no autorizados como medicamento), el enlace
    // de PubMed pueda igualmente buscar por ese nombre comercial en vez de solo por la
    // composición/principio activo, que en PubMed casi nunca da resultados útiles.
    cargarComercialesParaTexto(principioActivoCorto(farmaco), terminoBuscado);
  }
}

function actualizarFichaFarmaco() {
  const farmaco = farmacoActivo;
  nombreFarmacoEl.textContent = farmaco.principioActivo;
  categoriaFarmacoEl.textContent = farmaco.categoria;
  nombresComercialesEl.textContent = farmaco.nombresComerciales.length
    ? "Nombres comerciales conocidos: " + farmaco.nombresComerciales.join(", ")
    : "Sin nombres comerciales registrados";

  if (farmaco.composicion) {
    composicionFarmacoEl.textContent = "Composición: " + farmaco.composicion;
    composicionFarmacoEl.classList.remove("oculto");
  } else {
    composicionFarmacoEl.classList.add("oculto");
  }

  if (farmaco.esPersonalizado) {
    avisoPersonalizadoEl.classList.remove("oculto");
    irEditarBtn.onclick = () => {
      document.querySelector('.tab-principal[data-vista="misfarmacos"]').click();
      abrirFormulario(farmaco);
    };
  } else {
    avisoPersonalizadoEl.classList.add("oculto");
  }

  renderBibliografia(farmaco);
  renderProductosHospital(farmaco);
  actualizarSelectorPatologia();
  renderUsosEspecificos(farmaco);
  renderIndicacionesAntibiotico(farmaco);
  calcularReferencia();
  calcularPersonalizada();
}

// ============================================================
// Productos del hospital: marca, laboratorio y grado de recomendación de compra
// ============================================================
const ORDEN_HOSPITAL_PRIORIDAD = {
  "Recomendado - Primera Opción": 0,
  "Recomendado": 1,
  "Según Necesidad": 2,
  "Fuera de Acuerdo": 3
};

function productosHospitalParaFarmaco(principioActivoFarmaco) {
  const nombreNorm = normalizar(principioActivoFarmaco);
  return PRODUCTOS_HOSPITAL
    .filter((p) => {
      const alias = ALIAS_COMPOSICION_HOSPITAL[p.composicion.trim().toLowerCase()];
      return alias && normalizar(alias) === nombreNorm;
    })
    .sort((a, b) => ORDEN_HOSPITAL_PRIORIDAD[a.orden] - ORDEN_HOSPITAL_PRIORIDAD[b.orden]);
}

// ---- Favoritos: marcas de PRODUCTOS_HOSPITAL que el usuario tiene habitualmente en stock ----
// Se guardan en IndexedDB (independiente del "orden" de recomendación de compra, que no cambia).
// Sirven solo para decidir qué aparece primero al buscar un producto concreto en un desplegable;
// no afectan a la alerta de "recomendado por el hospital / fuera de acuerdo", que sigue igual.
let favoritosHospital = new Set();

async function cargarFavoritosHospital() {
  const filas = await dbGetAll("favoritosHospital");
  favoritosHospital = new Set(filas.map((f) => f.id));
}

function esFavoritoHospital(marca) {
  return favoritosHospital.has(normalizar(marca));
}

// Actualiza el estado en memoria (y por tanto la pantalla) al instante; el guardado en
// IndexedDB se hace en segundo plano sin bloquear la interacción, para que un fallo o
// lentitud del navegador guardando nunca dé la sensación de que el clic "no ha hecho nada".
function toggleFavoritoHospital(marca) {
  const key = normalizar(marca);
  if (favoritosHospital.has(key)) {
    favoritosHospital.delete(key);
    dbDelete("favoritosHospital", key).catch(() => {});
  } else {
    favoritosHospital.add(key);
    dbPut("favoritosHospital", { id: key, marca }).catch(() => {});
  }
}

// ---- Favoritos de CRI: productos concretos de CIMAVET/CIMA marcados desde la pestaña CRI,
// para pedir siempre el mismo a la farmacia. Mismo patrón que favoritosHospital de arriba. ----
let favoritosCri = new Set();

async function cargarFavoritosCri() {
  const filas = await dbGetAll("favoritosCri");
  favoritosCri = new Set(filas.map((f) => f.id));
}

function esFavoritoCri(nombre) {
  return favoritosCri.has(normalizar(nombre));
}

function toggleFavoritoCri(nombre) {
  const key = normalizar(nombre);
  if (favoritosCri.has(key)) {
    favoritosCri.delete(key);
    dbDelete("favoritosCri", key).catch(() => {});
  } else {
    favoritosCri.add(key);
    dbPut("favoritosCri", { id: key, nombre }).catch(() => {});
  }
}

// Reordena una lista de medicamentos (de CIMAVET/CIMA, cada uno con un campo .nombre) poniendo
// primero los que coincidan con una marca marcada como favorita para ese principio activo. Si
// no hay ningún favorito marcado, la lista se devuelve tal cual (comportamiento de siempre).
function marcarYOrdenarFavoritos(lista, principioActivoNombre) {
  const favoritos = principioActivoNombre
    ? productosHospitalParaFarmaco(principioActivoNombre).filter((p) => esFavoritoHospital(p.marca))
    : [];
  if (!favoritos.length) return { lista, esFavorito: () => false };
  const marcasFavoritas = favoritos.map((p) => normalizar(p.marca));
  const esFavorito = (nombre) => {
    const n = normalizar(nombre);
    return marcasFavoritas.some((marca) => n === marca || n.startsWith(marca + " "));
  };
  const favs = lista.filter((it) => esFavorito(it.nombre));
  const resto = lista.filter((it) => !esFavorito(it.nombre));
  return { lista: [...favs, ...resto], esFavorito };
}

function renderProductosHospital(farmaco) {
  const productos = productosHospitalParaFarmaco(farmaco.principioActivo);
  if (!productos.length) {
    productosHospitalEl.classList.add("oculto");
    productosHospitalEl.innerHTML = "";
    return;
  }
  productosHospitalEl.classList.remove("oculto");
  productosHospitalEl.innerHTML = `<p class="ayuda">🏥 Productos disponibles en tu hospital (toca ⭐ los que tengas habitualmente en stock para que salgan primero al buscar):</p>` +
    productos.map((p) => {
      const etiqueta = ETIQUETA_ORDEN_HOSPITAL[p.orden] || { texto: p.orden, clase: "" };
      const esFav = esFavoritoHospital(p.marca);
      // Toda la etiqueta es un único <button>, no solo el símbolo de la estrella, para que el
      // área donde tocar/hacer clic sea grande y cómoda (la estrella sola es un blanco muy pequeño).
      return `<button type="button" class="badge-hospital badge-hospital-${etiqueta.clase} boton-favorito-hospital${esFav ? " es-favorito" : ""}" data-marca="${escapeHtml(p.marca)}" title="${escapeHtml(p.laboratorio)} — ${esFav ? "Quitar de favoritos" : "Marcar como favorito"}">${esFav ? "⭐" : "☆"} ${escapeHtml(p.marca)} · ${etiqueta.texto}</button>`;
    }).join(" ");
  productosHospitalEl.querySelectorAll(".boton-favorito-hospital").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleFavoritoHospital(btn.dataset.marca);
      renderProductosHospital(farmaco);
    });
  });
}

// ============================================================
// Cálculo de dosis de referencia (base de datos interna o personalizada)
// ============================================================
concentracionInput.addEventListener("input", () => {
  comprimidoActivo = null; // el usuario está indicando una concentración líquida manualmente
  marcaComercialActiva = null;
  calcularReferencia();
  calcularPersonalizada();
  calcularDosisUsoEspecifico();
  calcularDosisIndicacion();
});

function actualizarSelectorPatologia() {
  if (!farmacoActivo || !farmacoActivo.esPersonalizado) {
    patologiaSelectorContenedor.classList.add("oculto");
    patologiaSeleccionada = null;
    return;
  }
  const entradas = farmacoActivo.especies[paciente.especie] || [];
  if (entradas.length <= 1) {
    patologiaSelectorContenedor.classList.add("oculto");
    patologiaSeleccionada = entradas.length ? entradas[0].patologia : null;
    return;
  }
  patologiaSelectorContenedor.classList.remove("oculto");
  patologiaSelector.innerHTML = entradas.map((e) => `<option value="${escapeHtml(e.patologia)}">${escapeHtml(e.patologia)}</option>`).join("");
  if (!entradas.some((e) => e.patologia === patologiaSeleccionada)) {
    patologiaSeleccionada = entradas[0].patologia;
  }
  patologiaSelector.value = patologiaSeleccionada;
}
patologiaSelector.addEventListener("change", () => {
  patologiaSeleccionada = patologiaSelector.value;
  calcularReferencia();
});

// ============================================================
// Dosis por indicación para antibióticos (guías de uso cargadas)
// + recomendación de uso responsable según categoría EMA/AMEG
// ============================================================
function categoriaEMADe(principioActivo) {
  const norm = normalizar(principioActivo);
  for (const key in CATEGORIA_EMA_ANTIBIOTICOS) {
    if (normalizar(key) === norm) return CATEGORIA_EMA_ANTIBIOTICOS[key];
  }
  return null;
}

function indicacionesParaFarmaco(principioActivoNombre, especie) {
  const nombreNorm = normalizar(principioActivoNombre);
  const resultado = [];
  for (const indicacion of INDICACIONES_ANTIBIOTICOS) {
    if (!indicacion.especies.includes(especie)) continue;
    const opcion = indicacion.opciones.find((o) => normalizar(o.principioActivo) === nombreNorm);
    if (opcion) resultado.push({ indicacion, opcion });
  }
  return resultado;
}

function renderIndicacionesAntibiotico(farmaco) {
  const esAntibiotico = !!(farmaco.categoria && normalizar(farmaco.categoria).includes("antibiotico"));
  if (!esAntibiotico) {
    bloqueIndicacionAntibioticoEl.classList.add("oculto");
    indicacionAntibioticoActiva = null;
    return;
  }

  const coincidencias = indicacionesParaFarmaco(farmaco.principioActivo, paciente.especie);
  bloqueIndicacionAntibioticoEl.classList.remove("oculto");

  if (!coincidencias.length) {
    indicacionAntibioticoSelectorEl.innerHTML = `<option value="">Sin indicaciones registradas en las guías cargadas para este fármaco/especie</option>`;
    indicacionAntibioticoSelectorEl.disabled = true;
    indicacionAntibioticoSelectorEl._coincidencias = null;
    indicacionAntibioticoActiva = null;
    resultadoIndicacionAntibioticoEl.innerHTML = "";
    notasIndicacionAntibioticoEl.innerHTML = "";
    alternativasIndicacionAntibioticoEl.innerHTML = "";
    return;
  }

  indicacionAntibioticoSelectorEl.disabled = false;
  indicacionAntibioticoSelectorEl.innerHTML = coincidencias.map((c, i) => `<option value="${i}">${escapeHtml(c.indicacion.nombre)}</option>`).join("");
  indicacionAntibioticoSelectorEl._coincidencias = coincidencias;
  indicacionAntibioticoSelectorEl.value = "0";
  indicacionAntibioticoActiva = coincidencias[0];
  renderNotasIndicacionAntibiotico();
  renderAlternativasIndicacionAntibiotico();
}

// ============================================================
// Dosis según uso/procedimiento específico (independiente de los protocolos combinados)
// ============================================================
// Usos con dosis fija guardados como protocolo personalizado: cualquier fármaco con dosis
// propia dentro de un protocolo que el usuario haya creado (ej. "Ecocardiografía gato") se
// ofrece aquí automáticamente, con el nombre del protocolo como indicación — sin necesidad de
// mantenerlo por duplicado en USOS_ESPECIFICOS_FARMACO. Es la fuente que manda: si el usuario
// edita la dosis del protocolo, el desplegable de la calculadora se actualiza con ella.
function usosDeProtocolosPersonalizados(principioActivoNombre, especie) {
  const nombreNorm = normalizar(principioActivoNombre);
  const resultado = [];
  for (const protocolo of customProtocols) {
    if (!protocolo.especies.includes(especie)) continue;
    for (const componenteRaw of protocolo.componentes) {
      if (typeof componenteRaw === "string") continue; // id de DRUGS: usa la dosis estándar del fármaco, no una propia
      const principioReal = componenteRaw.principioActivoReal || componenteRaw.nombre;
      if (!principioReal || normalizar(principioReal) !== nombreNorm) continue;
      resultado.push({
        nombre: protocolo.nombre,
        deProtocolo: true,
        especies: {
          [especie]: {
            dosisMin: componenteRaw.dosisMin, dosisMax: componenteRaw.dosisMax, unidad: componenteRaw.unidad,
            via: componenteRaw.via, frecuencia: componenteRaw.frecuencia, notas: componenteRaw.notas
          }
        }
      });
    }
  }
  return resultado;
}

function usosEspecificosParaFarmaco(principioActivoNombre, especie) {
  const nombreNorm = normalizar(principioActivoNombre);
  const entrada = USOS_ESPECIFICOS_FARMACO.find((e) => normalizar(e.principioActivo) === nombreNorm);
  const usosCurados = entrada ? entrada.usos.filter((u) => u.especies[especie]) : [];
  return [...usosDeProtocolosPersonalizados(principioActivoNombre, especie), ...usosCurados];
}

function renderUsosEspecificos(farmaco) {
  const usos = usosEspecificosParaFarmaco(farmaco.principioActivo, paciente.especie);
  if (!usos.length) {
    bloqueUsoEspecificoEl.classList.add("oculto");
    usoEspecificoActivo = null;
    usoEspecificoSelectorEl._usos = null;
    return;
  }
  bloqueUsoEspecificoEl.classList.remove("oculto");
  usoEspecificoSelectorEl.disabled = false;
  usoEspecificoSelectorEl.innerHTML = usos.map((u, i) => `<option value="${i}">${escapeHtml(u.nombre)}${u.deProtocolo ? " · tu protocolo" : ""}</option>`).join("");
  usoEspecificoSelectorEl._usos = usos;
  usoEspecificoSelectorEl.value = "0";
  usoEspecificoActivo = usos[0];
  calcularDosisUsoEspecifico();
}

usoEspecificoSelectorEl.addEventListener("change", () => {
  const usos = usoEspecificoSelectorEl._usos;
  if (!usos) return;
  usoEspecificoActivo = usos[Number(usoEspecificoSelectorEl.value)];
  calcularDosisUsoEspecifico();
});

function calcularDosisUsoEspecifico() {
  resultadoUsoEspecificoEl.innerHTML = "";
  if (!usoEspecificoActivo) return;
  const datos = usoEspecificoActivo.especies[paciente.especie];
  if (!datos) {
    resultadoUsoEspecificoEl.innerHTML = `<p class="aviso-inline">⚠ Este uso no tiene pauta registrada para "${paciente.especie === "perro" ? "perro" : "gato"}".</p>`;
    return;
  }

  if (!paciente.peso || paciente.peso <= 0) {
    resultadoUsoEspecificoEl.innerHTML = `<p class="placeholder">Introduce el peso del paciente para calcular la dosis.</p>`;
    return;
  }

  const dosisMinTotal = datos.dosisMin * paciente.peso;
  const dosisMaxTotal = datos.dosisMax * paciente.peso;
  const rangoTexto = datos.dosisMin === datos.dosisMax
    ? formatNum(dosisMinTotal) + " " + unidadTotal(datos.unidad)
    : `${formatNum(dosisMinTotal)} – ${formatNum(dosisMaxTotal)} ${unidadTotal(datos.unidad)}`;

  let html = `
    <div class="resultado-card">
      <div class="resultado-dosis">${rangoTexto}</div>
      <div class="resultado-detalle">
        <span>${datos.dosisMin === datos.dosisMax ? datos.dosisMin : datos.dosisMin + "–" + datos.dosisMax} ${datos.unidad}</span>
        <span>·</span><span>${escapeHtml(datos.via)}</span>
        <span>·</span><span>${escapeHtml(datos.frecuencia)}</span>
      </div>
      ${datos.notas ? `<p class="notas">${escapeHtml(datos.notas)}</p>` : ""}
  `;

  const dosisMinBase = datos.unidad === "mcg/kg" ? dosisMinTotal / 1000 : dosisMinTotal;
  const dosisMaxBase = datos.unidad === "mcg/kg" ? dosisMaxTotal / 1000 : dosisMaxTotal;
  const unidadConc = datos.unidad === "UI/kg" ? "UI/ml" : "mg/ml";
  const marcaTexto = marcaComercialActiva ? ` de ${marcaCorta(marcaComercialActiva)}` : "";

  let cantidadTexto = null, detalleAdministracion = null;

  if (comprimidoActivo && datos.unidad !== "UI/kg") {
    const compMin = dosisMinBase / comprimidoActivo.mg;
    const compMax = dosisMaxBase / comprimidoActivo.mg;
    cantidadTexto = textoComprimidos(compMin, compMax) + marcaTexto;
    html += `<div class="resultado-volumen">Comprimidos a administrar (de ${comprimidoActivo.mg} mg/comprimido): <strong>${cantidadTexto}</strong></div>`;
    html += `<button class="boton-anadir" id="boton-anadir-uso-especifico">+ Añadir al paciente (${cantidadTexto})</button>`;
    detalleAdministracion = `${rangoTexto} (${comprimidoActivo.mg} mg/comprimido) · ${datos.via} · ${datos.frecuencia} · Uso: ${usoEspecificoActivo.nombre}` + (datos.notas ? ` · ${datos.notas}` : "");
  } else {
    const concentracion = parseFloat(concentracionInput.value);
    if (concentracion && concentracion > 0) {
      const volMin = dosisMinBase / concentracion;
      const volMax = dosisMaxBase / concentracion;
      cantidadTexto = (datos.dosisMin === datos.dosisMax
        ? formatNum(volMin) + " ml"
        : `${formatNum(volMin)} – ${formatNum(volMax)} ml`) + marcaTexto;
      html += `<div class="resultado-volumen">Volumen a administrar (a ${concentracion} ${unidadConc}): <strong>${cantidadTexto}</strong></div>`;
      html += `<button class="boton-anadir" id="boton-anadir-uso-especifico">+ Añadir al paciente (${cantidadTexto})</button>`;
      detalleAdministracion = `${rangoTexto} a ${concentracion} ${unidadConc} · ${datos.via} · ${datos.frecuencia} · Uso: ${usoEspecificoActivo.nombre}` + (datos.notas ? ` · ${datos.notas}` : "");
    } else {
      html += `<p class="aviso-inline">⚠ Indica la concentración del preparado (${unidadConc}) o elige una presentación en comprimidos para poder añadir esta dosis al paciente.</p>`;
    }
  }
  html += `</div>`;
  resultadoUsoEspecificoEl.innerHTML = html;

  const botonAnadirUso = document.getElementById("boton-anadir-uso-especifico");
  if (botonAnadirUso) {
    botonAnadirUso.addEventListener("click", () => {
      añadirAlPaciente({
        principioActivo: farmacoActivo.principioActivo,
        principioActivoReal: farmacoActivo.principioActivo,
        categoria: farmacoActivo.categoria,
        dosisTexto: cantidadTexto,
        detalle: detalleAdministracion,
        origen: (usoEspecificoActivo.deProtocolo ? "Protocolo: " : "Uso: ") + usoEspecificoActivo.nombre
      });
    });
  }
}

indicacionAntibioticoSelectorEl.addEventListener("change", () => {
  const coincidencias = indicacionAntibioticoSelectorEl._coincidencias;
  if (!coincidencias) return;
  indicacionAntibioticoActiva = coincidencias[Number(indicacionAntibioticoSelectorEl.value)];
  renderNotasIndicacionAntibiotico();
  renderAlternativasIndicacionAntibiotico();
  calcularDosisIndicacion();
});

function renderNotasIndicacionAntibiotico() {
  if (!indicacionAntibioticoActiva) { notasIndicacionAntibioticoEl.innerHTML = ""; return; }
  const { indicacion } = indicacionAntibioticoActiva;
  notasIndicacionAntibioticoEl.innerHTML = `
    <p class="notas">${escapeHtml(indicacion.notas)}</p>
    <p class="fuente-cita">Fuente: ${escapeHtml(indicacion.fuente)}</p>
  `;
}

function renderAlternativasIndicacionAntibiotico() {
  if (!indicacionAntibioticoActiva) { alternativasIndicacionAntibioticoEl.innerHTML = ""; return; }
  const { opcion: opcionActual } = indicacionAntibioticoActiva;
  const ordenadas = [...indicacionAntibioticoActiva.indicacion.opciones].sort((a, b) => a.prioridad - b.prioridad);
  const mejorPrioridad = ordenadas[0].prioridad;
  const esOptima = opcionActual.prioridad === mejorPrioridad;

  let html = `<h4 class="subtitulo">Opciones para esta indicación (uso responsable)</h4>`;
  html += ordenadas.map((o) => {
    const cat = categoriaEMADe(o.principioActivo);
    const esActual = o === opcionActual;
    return `
      <div class="opcion-antibiotico ${esActual ? "opcion-antibiotico-actual" : ""}">
        <div class="opcion-antibiotico-nombre">
          ${o.prioridad === mejorPrioridad ? "✅" : "•"} ${escapeHtml(o.principioActivo)}
          ${cat ? `<span class="badge-ema badge-ema-${cat.toLowerCase()}" title="${escapeHtml(ETIQUETA_CATEGORIA_EMA[cat] || "")}">Cat. EMA ${cat}</span>` : ""}
          ${esActual ? `<span class="tipo-tag tipo-tag-personalizado">Fármaco actual</span>` : ""}
        </div>
        <div class="opcion-antibiotico-dosis">${o.dosisMin === o.dosisMax ? o.dosisMin : o.dosisMin + "–" + o.dosisMax} ${o.unidad} · ${escapeHtml(o.via)} · ${escapeHtml(o.frecuencia)}</div>
        ${o.notas ? `<div class="opcion-antibiotico-notas">${escapeHtml(o.notas)}</div>` : ""}
      </div>
    `;
  }).join("");

  if (!esOptima) {
    const mejores = [...new Set(ordenadas.filter((o) => o.prioridad === mejorPrioridad).map((o) => o.principioActivo))].join(" o ");
    html += `<p class="aviso-inline">💡 Para esta indicación, la guía prioriza primero: <strong>${escapeHtml(mejores)}</strong>. "${escapeHtml(opcionActual.principioActivo)}" es una opción de prioridad ${opcionActual.prioridad}ª — resérvala para cuando la de primera línea no sea adecuada, haya fracasado, o el cultivo/antibiograma lo justifique.</p>`;
  } else {
    html += `<p class="ayuda">✅ "${escapeHtml(opcionActual.principioActivo)}" es la opción de primera línea recomendada por la guía para esta indicación.</p>`;
  }

  alternativasIndicacionAntibioticoEl.innerHTML = html;
}

function calcularDosisIndicacion() {
  resultadoIndicacionAntibioticoEl.innerHTML = "";
  if (!indicacionAntibioticoActiva) return;
  const { indicacion, opcion } = indicacionAntibioticoActiva;

  if (!paciente.peso || paciente.peso <= 0) {
    resultadoIndicacionAntibioticoEl.innerHTML = `<p class="placeholder">Introduce el peso del paciente para calcular la dosis.</p>`;
    return;
  }

  let dosisMinTotal = opcion.dosisMin * paciente.peso;
  let dosisMaxTotal = opcion.dosisMax * paciente.peso;
  const rangoTexto = opcion.dosisMin === opcion.dosisMax
    ? formatNum(dosisMinTotal) + " " + unidadTotal(opcion.unidad)
    : `${formatNum(dosisMinTotal)} – ${formatNum(dosisMaxTotal)} ${unidadTotal(opcion.unidad)}`;

  let html = `
    <div class="resultado-card">
      <div class="resultado-dosis">${rangoTexto}</div>
      <div class="resultado-detalle">
        <span>${opcion.dosisMin === opcion.dosisMax ? opcion.dosisMin : opcion.dosisMin + "–" + opcion.dosisMax} ${opcion.unidad}</span>
        <span>·</span><span>${escapeHtml(opcion.via)}</span>
        <span>·</span><span>${escapeHtml(opcion.frecuencia)}</span>
      </div>
      ${opcion.notas ? `<p class="notas">${escapeHtml(opcion.notas)}</p>` : ""}
  `;

  const dosisMinBase = opcion.unidad === "mcg/kg" ? dosisMinTotal / 1000 : dosisMinTotal;
  const dosisMaxBase = opcion.unidad === "mcg/kg" ? dosisMaxTotal / 1000 : dosisMaxTotal;
  const unidadConc = opcion.unidad === "UI/kg" ? "UI/ml" : "mg/ml";
  let cantidadTexto = null, detalleAdministracion = null;
  const marcaTexto = marcaComercialActiva ? ` de ${marcaCorta(marcaComercialActiva)}` : "";

  if (comprimidoActivo) {
    cantidadTexto = textoComprimidos(dosisMinBase / comprimidoActivo.mg, dosisMaxBase / comprimidoActivo.mg) + marcaTexto;
    html += `<div class="resultado-volumen">Comprimidos a administrar (de ${comprimidoActivo.mg} mg/comprimido): <strong>${cantidadTexto}</strong></div>`;
    detalleAdministracion = `${rangoTexto} (${comprimidoActivo.mg} mg/comprimido) · ${opcion.via} · ${opcion.frecuencia} · Indicación: ${indicacion.nombre}` + (opcion.notas ? ` · ${opcion.notas}` : "");
  } else {
    const concentracion = parseFloat(concentracionInput.value);
    if (concentracion && concentracion > 0) {
      const volMin = dosisMinBase / concentracion;
      const volMax = dosisMaxBase / concentracion;
      cantidadTexto = (opcion.dosisMin === opcion.dosisMax
        ? formatNum(volMin) + " ml"
        : `${formatNum(volMin)} – ${formatNum(volMax)} ml`) + marcaTexto;
      html += `<div class="resultado-volumen">Volumen a administrar (a ${concentracion} ${unidadConc}): <strong>${cantidadTexto}</strong></div>`;
      detalleAdministracion = `${rangoTexto} a ${concentracion} ${unidadConc} · ${opcion.via} · ${opcion.frecuencia} · Indicación: ${indicacion.nombre}` + (opcion.notas ? ` · ${opcion.notas}` : "");
    }
  }

  if (cantidadTexto) {
    html += `<button class="boton-anadir" id="boton-anadir-indicacion">+ Añadir al paciente (${cantidadTexto})</button>`;
  } else {
    html += `<p class="aviso-inline">⚠ Indica la concentración del preparado (o elige una presentación en comprimidos) para poder añadir esta dosis al paciente.</p>`;
  }
  html += `</div>`;
  resultadoIndicacionAntibioticoEl.innerHTML = html;

  const botonAnadir = document.getElementById("boton-anadir-indicacion");
  if (botonAnadir) {
    botonAnadir.addEventListener("click", () => {
      añadirAlPaciente({
        principioActivo: farmacoActivo.principioActivo,
        principioActivoReal: farmacoActivo.principioActivo,
        categoria: farmacoActivo.categoria,
        dosisTexto: cantidadTexto,
        detalle: detalleAdministracion,
        origen: "Antibiótico · " + indicacion.nombre
      });
    });
  }
}

function datosEspecieActiva() {
  if (!farmacoActivo) return null;
  const entradas = farmacoActivo.especies[paciente.especie];
  if (!entradas) return null;
  if (farmacoActivo.esPersonalizado) {
    if (!entradas.length) return null;
    return entradas.find((e) => e.patologia === patologiaSeleccionada) || entradas[0];
  }
  return entradas;
}

function unidadTotal(unidad) {
  if (unidad === "mg/kg") return "mg totales";
  if (unidad === "mcg/kg") return "mcg totales";
  if (unidad === "UI/kg") return "UI totales";
  return unidad;
}

function calcularReferencia() {
  resultadoReferenciaEl.innerHTML = "";
  avisoEspecieEl.classList.add("oculto");

  const datos = datosEspecieActiva();
  if (!datos) {
    avisoEspecieEl.textContent = `Este fármaco no tiene pauta registrada para "${paciente.especie === "perro" ? "perro" : "gato"}" en la base de datos.`;
    avisoEspecieEl.classList.remove("oculto");
    return;
  }

  // Fármacos sin dosis por kg (ej. dosis fija por tramo de peso escrita a mano: "0-10 kg: 1
  // comprimido, 10-20 kg: 2 comprimidos..."): no hay nada que calcular, así que se muestran
  // directamente las notas en vez de intentar una operación con un valor inexistente. Los de
  // tipo "banda" (dosis fija por tramo, ej. anticuerpos monoclonales, spot-on antiparasitarios)
  // tampoco rellenan dosisMin/dosisMax porque no aplica, así que se excluyen aquí explícitamente
  // para que caigan en su propio cálculo por banda más abajo, no en este aviso genérico.
  if (datos.tipoDosis !== "banda" && (datos.dosisMin == null || datos.dosisMax == null)) {
    resultadoReferenciaEl.innerHTML = `
      <div class="resultado-card">
        <p class="aviso-inline">⚠ Este fármaco no tiene una dosis por kg registrada para esta indicación. Pauta indicada por el usuario:</p>
        <div class="resultado-detalle">
          <span>${escapeHtml(datos.via)}</span>
          <span>·</span><span>${escapeHtml(datos.frecuencia)}</span>
        </div>
        ${datos.notas ? `<p class="notas">${escapeHtml(datos.notas)}</p>` : `<p class="placeholder">No se han indicado notas con la pauta.</p>`}
      </div>
    `;
    return;
  }

  if (!paciente.peso || paciente.peso <= 0) {
    resultadoReferenciaEl.innerHTML = `<p class="placeholder">Introduce el peso del paciente para calcular la dosis.</p>`;
    return;
  }

  if (datos.tipoDosis === "banda") {
    calcularReferenciaBanda(datos);
    return;
  }

  let dosisMinTotal = datos.dosisMin * paciente.peso;
  let dosisMaxTotal = datos.dosisMax * paciente.peso;
  let limitado = false;
  if (datos.dosisMaxima) {
    if (dosisMinTotal > datos.dosisMaxima) { dosisMinTotal = datos.dosisMaxima; limitado = true; }
    if (dosisMaxTotal > datos.dosisMaxima) { dosisMaxTotal = datos.dosisMaxima; limitado = true; }
  }

  const rangoTexto = datos.dosisMin === datos.dosisMax
    ? formatNum(dosisMinTotal) + " " + unidadTotal(datos.unidad)
    : `${formatNum(dosisMinTotal)} – ${formatNum(dosisMaxTotal)} ${unidadTotal(datos.unidad)}`;

  let html = `
    <div class="resultado-card">
      <div class="resultado-dosis">${rangoTexto}</div>
      <div class="resultado-detalle">
        <span>${datos.dosisMin === datos.dosisMax ? datos.dosisMin : datos.dosisMin + "–" + datos.dosisMax} ${datos.unidad}</span>
        <span>·</span><span>${escapeHtml(datos.via)}</span>
        <span>·</span><span>${escapeHtml(datos.frecuencia)}</span>
      </div>
      ${limitado ? `<p class="aviso-inline">⚠ Dosis ajustada al máximo recomendado de ${datos.dosisMaxima} ${unidadTotal(datos.unidad)}.</p>` : ""}
      ${datos.notas ? `<p class="notas">${escapeHtml(datos.notas)}</p>` : ""}
  `;

  // La dosis mg/mcg/UI se convierte siempre a la unidad base (mg o UI) para poder calcular ml o comprimidos.
  const dosisMinBase = datos.unidad === "mcg/kg" ? dosisMinTotal / 1000 : dosisMinTotal;
  const dosisMaxBase = datos.unidad === "mcg/kg" ? dosisMaxTotal / 1000 : dosisMaxTotal;
  const unidadConc = datos.unidad === "UI/kg" ? "UI/ml" : "mg/ml";

  let cantidadTexto = null, detalleAdministracion = null;
  const marcaTexto = marcaComercialActiva ? ` de ${marcaCorta(marcaComercialActiva)}` : "";

  if (comprimidoActivo && datos.unidad !== "UI/kg") {
    const compMin = dosisMinBase / comprimidoActivo.mg;
    const compMax = dosisMaxBase / comprimidoActivo.mg;
    cantidadTexto = textoComprimidos(compMin, compMax) + marcaTexto;
    html += `<div class="resultado-volumen">Comprimidos a administrar (de ${comprimidoActivo.mg} mg/comprimido): <strong>${cantidadTexto}</strong></div>`;
    html += `<button class="boton-anadir" data-origen="referencia">+ Añadir al paciente (${cantidadTexto})</button>`;
    detalleAdministracion = `${rangoTexto} (${comprimidoActivo.mg} mg/comprimido) · ${datos.via} · ${datos.frecuencia}` + (datos.notas ? ` · ${datos.notas}` : "");
  } else {
    const concentracion = parseFloat(concentracionInput.value);
    if (concentracion && concentracion > 0) {
      const volMin = dosisMinBase / concentracion;
      const volMax = dosisMaxBase / concentracion;
      cantidadTexto = (datos.dosisMin === datos.dosisMax
        ? formatNum(volMin) + " ml"
        : `${formatNum(volMin)} – ${formatNum(volMax)} ml`) + marcaTexto;
      html += `<div class="resultado-volumen">Volumen a administrar (a ${concentracion} ${unidadConc}): <strong>${cantidadTexto}</strong></div>`;
      html += `<button class="boton-anadir" data-origen="referencia">+ Añadir al paciente (${cantidadTexto})</button>`;
      detalleAdministracion = `${rangoTexto} a ${concentracion} ${unidadConc} · ${datos.via} · ${datos.frecuencia}` + (datos.notas ? ` · ${datos.notas}` : "");
    } else {
      html += `<p class="aviso-inline">⚠ Indica la concentración del preparado (${unidadConc}) o elige una presentación en comprimidos para poder añadir esta dosis al paciente.</p>`;
    }
  }
  html += `</div>`;
  resultadoReferenciaEl.innerHTML = html;

  const botonAnadir = resultadoReferenciaEl.querySelector(".boton-anadir");
  if (botonAnadir) {
    botonAnadir.addEventListener("click", () => {
      añadirAlPaciente({
        principioActivo: farmacoActivo.principioActivo,
        principioActivoReal: farmacoActivo.principioActivo,
        categoria: farmacoActivo.categoria,
        dosisTexto: cantidadTexto,
        detalle: detalleAdministracion + (farmacoActivo.esPersonalizado && patologiaSeleccionada ? ` · ${patologiaSeleccionada}` : ""),
        origen: "Dosis de referencia"
      });
    });
  }
}

// Fármacos con dosis fija por banda de peso (no mg/kg lineal), ej. anticuerpos monoclonales
// como Librela, Cytopoint o Solensia: se busca el tramo de peso del paciente en la tabla oficial.
function calcularReferenciaBanda(datos) {
  if (datos.pesoMinimo && paciente.peso < datos.pesoMinimo) {
    resultadoReferenciaEl.innerHTML = `<p class="aviso-inline">⚠ ${escapeHtml(datos.avisoPesoMinimo || `No usar por debajo de ${datos.pesoMinimo} kg según ficha técnica.`)}</p>`;
    return;
  }

  const banda = datos.bandas.find((b) => paciente.peso >= b.pesoMin && paciente.peso <= b.pesoMax);
  if (!banda) {
    const maxCubierto = datos.bandas[datos.bandas.length - 1].pesoMax;
    resultadoReferenciaEl.innerHTML = `<p class="aviso-inline">⚠ La tabla oficial de dosis por peso de este fármaco no cubre ${formatNum(paciente.peso)} kg (rango cubierto: hasta ${maxCubierto} kg). Consulta la ficha técnica para pautas fuera de rango.</p>`;
    return;
  }

  // Las bandas en comprimidos (ej. Bravecto: 1 comprimido fijo de una potencia concreta por
  // tramo de peso, sin fraccionar) no tienen volumen en ml — se etiquetan como "Comprimidos a
  // administrar" en vez de "Volumen a administrar", que solo tiene sentido para spot-on/inyectables.
  const esComprimido = banda.comprimidos != null;

  let cantidadTexto, mgTexto, etiquetaCantidad;
  if (esComprimido) {
    cantidadTexto = banda.comprimidos + (banda.comprimidos === 1 ? " comprimido" : " comprimidos");
    mgTexto = banda.mg != null ? banda.mg + " mg" : null;
    etiquetaCantidad = "Comprimidos a administrar";
  } else if (banda.formula) {
    const ml = banda.mlPorKg * paciente.peso;
    cantidadTexto = formatNum(ml) + " ml";
    mgTexto = formatNum(ml * banda.concentracion) + " mg";
    etiquetaCantidad = "Volumen a administrar";
  } else {
    cantidadTexto = banda.ml + (banda.ml === 1 ? " ml" : " ml");
    mgTexto = banda.mg != null ? banda.mg + " mg" : null;
    etiquetaCantidad = "Volumen a administrar";
  }

  let html = `
    <div class="resultado-card">
      <div class="resultado-dosis">${mgTexto ? mgTexto : cantidadTexto}</div>
      <div class="resultado-detalle">
        <span>Dosis fija por banda de peso</span>
        <span>·</span><span>${escapeHtml(datos.via)}</span>
        <span>·</span><span>${escapeHtml(datos.frecuencia)}</span>
      </div>
      <div class="resultado-volumen">${etiquetaCantidad}: <strong>${cantidadTexto}</strong> — ${escapeHtml(banda.descripcion)}</div>
      ${datos.notas ? `<p class="notas">${escapeHtml(datos.notas)}</p>` : ""}
      <button class="boton-anadir" data-origen="referencia-banda">+ Añadir al paciente (${cantidadTexto})</button>
    </div>
  `;
  resultadoReferenciaEl.innerHTML = html;

  const detalleAdministracion = `${banda.descripcion} (banda de peso ${banda.pesoMin}-${banda.pesoMax} kg) · ${datos.via} · ${datos.frecuencia}` + (datos.notas ? ` · ${datos.notas}` : "");
  const botonAnadir = resultadoReferenciaEl.querySelector(".boton-anadir");
  if (botonAnadir) {
    botonAnadir.addEventListener("click", () => {
      añadirAlPaciente({
        principioActivo: farmacoActivo.principioActivo,
        principioActivoReal: farmacoActivo.principioActivo,
        categoria: farmacoActivo.categoria,
        dosisTexto: cantidadTexto,
        detalle: detalleAdministracion,
        origen: "Dosis de referencia (banda de peso)"
      });
    });
  }
}

// ============================================================
// Cálculo de dosis personalizada (µg/kg – mg/kg – g/kg)
// ============================================================
[dosisPersonalizadaValorInput, dosisPersonalizadaUnidadSelect].forEach((el) => {
  el.addEventListener("input", calcularPersonalizada);
  el.addEventListener("change", calcularPersonalizada);
});

function calcularPersonalizada() {
  resultadoPersonalizadaEl.innerHTML = "";
  if (!farmacoActivo) return;

  const valor = parseFloat(dosisPersonalizadaValorInput.value);
  if (!valor || valor <= 0) {
    resultadoPersonalizadaEl.innerHTML = `<p class="placeholder">Indica una cantidad para calcular la dosis personalizada.</p>`;
    return;
  }
  if (!paciente.peso || paciente.peso <= 0) {
    resultadoPersonalizadaEl.innerHTML = `<p class="placeholder">Introduce el peso del paciente para calcular la dosis.</p>`;
    return;
  }

  const factorAMg = parseFloat(dosisPersonalizadaUnidadSelect.value);
  const etiquetaUnidad = dosisPersonalizadaUnidadSelect.options[dosisPersonalizadaUnidadSelect.selectedIndex].text;
  const dosisMgPorKg = valor * factorAMg;
  const totalMg = dosisMgPorKg * paciente.peso;

  let totalTexto;
  if (totalMg < 1) {
    totalTexto = formatNum(totalMg * 1000) + " µg totales";
  } else if (totalMg >= 1000) {
    totalTexto = formatNum(totalMg / 1000) + " g totales";
  } else {
    totalTexto = formatNum(totalMg) + " mg totales";
  }

  let html = `
    <div class="resultado-card">
      <div class="resultado-dosis">${totalTexto}</div>
      <div class="resultado-detalle"><span>${valor} ${etiquetaUnidad}</span></div>
  `;

  let cantidadTexto = null, detalleAdministracion = null;
  const marcaTexto = marcaComercialActiva ? ` de ${marcaCorta(marcaComercialActiva)}` : "";
  // La dosis personalizada es un valor mg/kg distinto al de referencia, pero la vía,
  // frecuencia y notas de administración (ej. "con el estómago vacío") del fármaco activo
  // siguen aplicando igual, así que se añaden aquí también (antes solo se guardaban al usar
  // la dosis de referencia, no la personalizada).
  const datosActivos = datosEspecieActiva();
  const viaFrecuenciaTexto = datosActivos ? ` · ${datosActivos.via} · ${datosActivos.frecuencia}` + (datosActivos.notas ? ` · ${datosActivos.notas}` : "") : "";

  if (comprimidoActivo) {
    const comp = totalMg / comprimidoActivo.mg;
    cantidadTexto = `${fraccionComprimido(comp)} ${unidadComprimidos(comp)}${marcaTexto}`;
    html += `<div class="resultado-volumen">Comprimidos a administrar (de ${comprimidoActivo.mg} mg/comprimido): <strong>${cantidadTexto}</strong></div>`;
    html += `<button class="boton-anadir" data-origen="personalizada">+ Añadir al paciente (${cantidadTexto})</button>`;
    detalleAdministracion = `${totalTexto} (${comprimidoActivo.mg} mg/comprimido, dosis personalizada: ${valor} ${etiquetaUnidad})${viaFrecuenciaTexto}`;
  } else {
    const concentracion = parseFloat(concentracionInput.value);
    if (concentracion && concentracion > 0) {
      const vol = totalMg / concentracion;
      cantidadTexto = formatNum(vol) + " ml" + marcaTexto;
      html += `<div class="resultado-volumen">Volumen a administrar (a ${concentracion} mg/ml): <strong>${cantidadTexto}</strong></div>`;
      html += `<button class="boton-anadir" data-origen="personalizada">+ Añadir al paciente (${cantidadTexto})</button>`;
      detalleAdministracion = `${totalTexto} a ${concentracion} mg/ml (dosis personalizada: ${valor} ${etiquetaUnidad})${viaFrecuenciaTexto}`;
    } else {
      html += `<p class="aviso-inline">⚠ Indica la concentración del preparado (mg/ml) o elige una presentación en comprimidos para poder añadir esta dosis al paciente.</p>`;
    }
  }
  html += `</div>`;
  resultadoPersonalizadaEl.innerHTML = html;

  const botonAnadir = resultadoPersonalizadaEl.querySelector(".boton-anadir");
  if (botonAnadir) {
    botonAnadir.addEventListener("click", () => {
      añadirAlPaciente({
        principioActivo: farmacoActivo.principioActivo,
        principioActivoReal: farmacoActivo.principioActivo,
        categoria: farmacoActivo.categoria,
        dosisTexto: cantidadTexto,
        detalle: detalleAdministracion,
        origen: "Dosis personalizada"
      });
    });
  }
}

// ============================================================
// Bibliografía (PubMed) — solo enlaces, sin extracción automática
// ============================================================
// PubMed indexa literatura casi toda en inglés: buscar con el término de indicación en
// español (ej. "Vómito") no encuentra prácticamente nada aunque existan decenas de artículos
// en inglés sobre "vomiting". Este diccionario traduce cada indicación de DRUGS a 1-2
// sinónimos en inglés para construir una búsqueda (X OR Y) más amplia. Si una indicación no
// está aquí, se omite del término en vez de usarla en español (mejor buscar algo más general
// que quedarse sin resultados).
// Igual que INDICACION_PUBMED_EN pero para el nombre del principio activo (campo
// "principioActivo" de DRUGS): sin esto, buscar literalmente "Amoxicilina/Ácido
// clavulánico" o "Furosemida" en PubMed (literatura casi toda en inglés) apenas
// encuentra nada. Si un principio activo no está aquí, se usa tal cual (funciona
// razonablemente para nombres que ya coinciden o son muy parecidos en ambos idiomas,
// ej. "Meloxicam", "Tramadol").
const PRINCIPIO_ACTIVO_PUBMED_EN = {
  "Acepromazina": "acepromazine",
  "Aglepristona": "aglepristone",
  "Alfaxalona": "alfaxalone",
  "Amlodipino": "amlodipine",
  "Amoxicilina": "amoxicillin",
  "Amoxicilina/Ácido clavulánico": "amoxicillin/clavulanate",
  "Ampicilina": "ampicillin",
  "Apomorfina": "apomorphine",
  "Atipamezol": "atipamezole",
  "Ácido tolfenámico": "tolfenamic acid",
  "Atropina": "atropine",
  "Azitromicina": "azithromycin",
  "Benazepril": "benazepril",
  "Bromuro de potasio": "potassium bromide",
  "Bupivacaína": "bupivacaine",
  "Buprenorfina": "buprenorphine",
  "Butorfanol": "butorphanol",
  "Cabergolina": "cabergoline",
  "Carprofeno": "carprofen",
  "Cefadroxilo": "cefadroxil",
  "Cefalexina": "cefalexin OR cephalexin",
  "Cefazolina": "cefazolin",
  "Cefovecina": "cefovecin",
  "Clomipramina": "clomipramine",
  "Cefpodoxima": "cefpodoxime",
  "Ciclosporina": "cyclosporine OR ciclosporin",
  "Cisaprida": "cisapride",
  "Clindamicina": "clindamycin",
  "Clorfeniramina": "chlorpheniramine",
  "Dexametasona": "dexamethasone",
  "Dexmedetomidina": "dexmedetomidine",
  "Difenhidramina": "diphenhydramine",
  "Digoxina": "digoxin",
  "Dipropionato de imidocarb": "imidocarb dipropionate",
  "Domperidona": "domperidone",
  "Doxiciclina": "doxycycline",
  "Efedrina": "ephedrine",
  "Enrofloxacina": "enrofloxacin",
  "Espironolactona": "spironolactone",
  "Etamsilato": "etamsylate",
  "Famotidina": "famotidine",
  "Fenbendazol": "fenbendazole",
  "Fenilpropanolamina": "phenylpropanolamine",
  "Fenobarbital": "phenobarbital",
  "Fentanilo": "fentanyl",
  "Fitomenadiona (Vitamina K1)": "phytomenadione OR phytonadione (vitamin K1)",
  "Fluoxetina": "fluoxetine",
  "Flumazenilo": "flumazenil",
  "Furazolidona": "furazolidone",
  "Furosemida": "furosemide",
  "Gentamicina": "gentamicin",
  "Gabapentina": "gabapentin",
  "Insulina glargina": "insulin glargine",
  "Imepitoina": "imepitoin",
  "Itraconazol": "itraconazole",
  "Ivermectina": "ivermectin",
  "Ketamina": "ketamine",
  "Levotiroxina": "levothyroxine",
  "Lidocaína": "lidocaine",
  "Marbofloxacina": "marbofloxacin",
  "Mebendazol": "mebendazole",
  "Nitenpiram": "nitenpyram",
  "Antimoniato de meglumina": "meglumine antimoniate",
  "Desoxicortona": "desoxycortone OR deoxycorticosterone pivalate",
  "Velagliflozina": "velagliflozin",
  "Tasipimidina": "tasipimidine",
  "Gluconato cálcico": "calcium gluconate",
  "Miltefosina": "miltefosine",
  "Pregabalina": "pregabalin",
  "Mirtazapina": "mirtazapine",
  "Ropinirol": "ropinirole",
  "Deslorelina": "deslorelin",
  "Osaterona": "osaterone acetate",
  "Medetomidina": "medetomidine",
  "Acetato de medroxiprogesterona": "medroxyprogesterone acetate",
  "Melarsomina": "melarsomine",
  "Metadona": "methadone",
  "Bencilpenicilina procaína + Dihidroestreptomicina": "procaine penicillin + dihydrostreptomycin",
  "Clortetraciclina (oftálmica)": "chlortetracycline ophthalmic",
  "Metergolina": "metergoline",
  "Ketoconazol": "ketoconazole",
  "Lactulosa": "lactulose",
  "Metamizol": "metamizole OR dipyrone",
  "Metilprednisolona": "methylprednisolone",
  "Metimazol": "methimazole",
  "Metoclopramida": "metoclopramide",
  "Metronidazol": "metronidazole",
  "Milbemicina oxima": "milbemycin oxime",
  "Nandrolona": "nandrolone",
  "Naloxona": "naloxone",
  "Nitazoxanida": "nitazoxanide",
  "Omeprazol": "omeprazole",
  "Oxitocina": "oxytocin",
  "Ondansetrón": "ondansetron",
  "Oxitetraciclina": "oxytetracycline",
  // "Acetaminophen" (no "paracetamol") es el término casi universal en la literatura en
  // inglés, sobre todo estadounidense — con una coma en vez de "/" se trata como sinónimo
  // independiente (ver terminosPubMed) tanto en la búsqueda como en el filtro de proximidad de
  // dosis de panel-bibliografia, no como un fármaco combinado.
  "Paracetamol": "Paracetamol, Acetaminophen",
  "Pentobarbital": "pentobarbital OR pentobarbitone",
  "Pimobendán": "pimobendan",
  "Tiletamina + Zolazepam": "tiletamine + zolazepam",
  "Pradofloxacina": "pradofloxacin",
  "Prednisolona": "prednisolone",
  "Propentofilina": "propentofylline",
  "Ronidazol": "ronidazole",
  "Selamectina": "selamectin",
  "Sucralfato": "sucralfate",
  "Telmisartán": "telmisartan",
  "Torasemida": "torasemide",
  "Terbinafina": "terbinafine",
  "Tetracosactida": "tetracosactide",
  "Tilosina": "tylosin",
  "Trilostano": "trilostane",
  "Trimetoprim/Sulfadiazina + Pirimetamina": "trimethoprim/sulfadiazine AND pyrimethamine",
  "Trimetoprim/Sulfametoxazol": "trimethoprim/sulfamethoxazole",
  "Xilazina": "xylazine",
  "Zonisamida": "zonisamide",
  "Espiramicina + Metronidazol": "spiramycin + metronidazole",

  // ---- Suplementos/nutracéuticos (principio activo en español, sin cognado directo en
  // inglés en muchos casos): sin esta traducción, terminosPubMed() igual separa los
  // ingredientes combinados, pero busca literalmente en español y no encuentra apenas nada
  // en PubMed (indexado casi todo en inglés). ----
  "Amoxicilina (retard/depot)": "amoxicillin (long-acting/depot)",
  "Silibina (cardo mariano) + fosfatidilcolina + vitamina E": "silibinin (milk thistle) + phosphatidylcholine + vitamin E",
  "Levadura de cerveza + silibina (cardo mariano) + taurina + vitaminas del grupo B": "brewer's yeast + silibinin (milk thistle) + taurine + B vitamins",
  "Producto de levadura (Saccharomyces cerevisiae)": "yeast product (Saccharomyces cerevisiae)",
  "L-triptófano + glucosamina + condroitín sulfato + ácido hialurónico": "L-tryptophan + glucosamine + chondroitin sulfate + hyaluronic acid",
  "Nucleoforce (nucleótidos de Saccharomyces cerevisiae) + Immunactive (Lentinus edodes)": "Nucleoforce (Saccharomyces cerevisiae nucleotides) + Immunactive (Lentinus edodes)",
  "Levadura de S. cerevisiae + hierro, cobre, vitaminas C, E, B1, B2, B3, B6, B9, B12 y K3": "S. cerevisiae yeast + iron, copper, vitamins C, E, B1, B2, B3, B6, B9, B12 and K3",
  "Lespedeza capitata + carbonato cálcico": "Lespedeza capitata + calcium carbonate",
  "Caseína hidrolizada (alfa-casozepina)": "hydrolyzed casein (alpha-casozepine)",
  "N-acetil-D-glucosamina": "N-acetyl-D-glucosamine",
  "N-acetil-D-glucosamina + L-teanina + quercetina dihidrato": "N-acetyl-D-glucosamine + L-theanine + quercetin dihydrate",
  "D-manosa + arándano (Vaccinium macrocarpon) + granada + Withania somnifera": "D-mannose + cranberry (Vaccinium macrocarpon) + pomegranate + Withania somnifera",
  "L-triptófano + Rhodiola rosea + lecitina + Passiflora incarnata": "L-tryptophan + Rhodiola rosea + lecithin + Passiflora incarnata",
  "DHA/EPA + fosfatidilserina + antioxidantes (vitamina E, coenzima Q10, ácido alfa lipoico)": "DHA/EPA + phosphatidylserine + antioxidants (vitamin E, coenzyme Q10, alpha lipoic acid)",
  "Glucosamina HCl + condroitín sulfato + ácido hialurónico + colágeno nativo tipo II": "glucosamine HCl + chondroitin sulfate + hyaluronic acid + native type II collagen",
  "Glucosamina HCl + condroitín sulfato + MSM + hialuronato sódico": "glucosamine HCl + chondroitin sulfate + MSM + sodium hyaluronate",
  "Cepa probiótica Enterococcus faecium SF68": "Enterococcus faecium SF68 probiotic strain",
  "Probiótico (Enterococcus faecium) + prebiótico (FOS/arabinogalactanos)": "probiotic (Enterococcus faecium) + prebiotic (FOS/arabinogalactans)",
  "Probiótico (Enterococcus faecium) + prebiótico (FOS/arabinogalactanos) + caolina + pectina": "probiotic (Enterococcus faecium) + prebiotic (FOS/arabinogalactans) + kaolin + pectin",
  "Complejo de plasma + probióticos (Enterococcus faecium) + prebióticos (FOS/MOS) + vitaminas + zinc + selenio": "plasma complex + probiotics (Enterococcus faecium) + prebiotics (FOS/MOS) + vitamins + zinc + selenium",
  "Carbonato cálcico + alginato sódico": "calcium carbonate + sodium alginate"
};

const INDICACION_PUBMED_EN = {
  "Alergia": ["allergy"],
  "Analgesia (CRI)": ["analgesia constant rate infusion"],
  "Analgesia (dosis subanestésicas)": ["subanesthetic analgesia"],
  "Analgesia leve": ["mild pain analgesia"],
  "Analgesia perioperatoria": ["perioperative analgesia"],
  "Analgesia postquirúrgica": ["postoperative analgesia"],
  "Anestesia (co-inducción)": ["co-induction anesthesia"],
  "Anestesia (inducción)": ["anesthesia induction"],
  "Anestesia local": ["local anesthesia"],
  "Ansiedad": ["anxiety"],
  "Ansiedad/estrés en consulta": ["situational anxiety", "fear"],
  "Arritmia supraventricular": ["supraventricular arrhythmia"],
  "Arritmia ventricular": ["ventricular arrhythmia"],
  "Bloqueo regional": ["regional anesthesia", "nerve block"],
  "Bradicardia": ["bradycardia"],
  "Cardiomiopatía": ["cardiomyopathy"],
  "Coadyuvante anticonvulsivo": ["adjunct anticonvulsant"],
  "Convulsiones": ["seizures", "epilepsy"],
  "Dermatitis atópica": ["atopic dermatitis"],
  "Dermatofitosis": ["dermatophytosis", "ringworm"],
  "Desparasitación externa e interna": ["endoparasite", "ectoparasite"],
  "Desparasitación interna (tenias)": ["tapeworm", "cestode"],
  "Desparasitación interna": ["deworming", "anthelmintic"],
  "Diabetes mellitus": ["diabetes mellitus"],
  "Diarrea": ["diarrhea"],
  "Dolor crónico": ["chronic pain"],
  "Dolor cólico/espasmódico": ["colic", "abdominal spasm"],
  "Dolor neuropático": ["neuropathic pain"],
  "Dolor por osteoartritis": ["osteoarthritis pain"],
  "Dolor postquirúrgico": ["postoperative pain"],
  "Dolor": ["pain"],
  "Edema": ["edema"],
  "Ehrlichiosis": ["ehrlichiosis"],
  "Emergencia/RCP": ["cardiopulmonary resuscitation"],
  "Emergencia/sobredosis": ["overdose", "toxicity"],
  "Enfermedad inmunomediada": ["immune-mediated disease"],
  "Enfermedad renal crónica": ["chronic kidney disease"],
  "Enfermedad respiratoria": ["respiratory disease"],
  "Epilepsia": ["epilepsy", "seizures"],
  "Esofagitis": ["esophagitis"],
  "Estreñimiento/megacolon (gato)": ["constipation", "megacolon"],
  "Fiebre": ["fever"],
  "Gastritis": ["gastritis"],
  "Gastroenteritis hemorrágica grave": ["hemorrhagic gastroenteritis"],
  "Giardiasis": ["giardiasis"],
  "Hiperadrenocorticismo (Cushing)": ["hyperadrenocorticism", "Cushing"],
  "Hipertensión arterial sistémica": ["systemic hypertension"],
  "Hipertiroidismo felino": ["feline hyperthyroidism"],
  "Hipomotilidad gastrointestinal": ["gastrointestinal hypomotility", "prokinetic"],
  "Hipotiroidismo": ["hypothyroidism"],
  "Inducción del vómito (perro)": ["emesis induction"],
  "Infección bacteriana anaerobia": ["anaerobic bacterial infection"],
  "Infección bacteriana": ["bacterial infection"],
  "Infección cutánea": ["skin infection", "pyoderma"],
  "Infección dental": ["dental infection"],
  "Infección fúngica": ["fungal infection"],
  "Infección respiratoria": ["respiratory infection"],
  "Infección urinaria": ["urinary tract infection"],
  "Infección ósea": ["osteomyelitis"],
  "Inflamación": ["inflammation"],
  "Insuficiencia cardíaca congestiva": ["congestive heart failure"],
  "Intoxicación por rodenticidas anticoagulantes": ["anticoagulant rodenticide toxicosis"],
  "Malassezia": ["malassezia dermatitis"],
  "Neumonía": ["pneumonia"],
  "Náuseas": ["nausea"],
  "Osteoartritis": ["osteoarthritis"],
  "Piotórax": ["pyothorax"],
  "Premedicación anticolinérgica": ["anticholinergic premedication"],
  "Premedicación": ["anesthetic premedication"],
  "Prevención cinetosis": ["motion sickness"],
  "Prevención de dirofilariosis": ["heartworm prevention"],
  "Prevención de tromboembolismo (cardiomiopatía felina)": ["thromboembolism prevention", "cardiomyopathy"],
  "Profilaxis quirúrgica": ["surgical prophylaxis"],
  "Proteinuria renal": ["renal proteinuria"],
  "Proteinuria": ["proteinuria"],
  "Prurito": ["pruritus", "itching"],
  "Reacción alérgica": ["allergic reaction"],
  "Reflujo": ["reflux"],
  "Reversión de benzodiazepinas (midazolam/diazepam)": ["flumazenil reversal"],
  "Reversión de opioides": ["naloxone reversal"],
  "Reversión de sedación con dexmedetomidina/medetomidina": ["atipamezole reversal"],
  "Sarna demodécica/sarcóptica": ["demodicosis", "sarcoptic mange"],
  "Sedación": ["sedation"],
  "Sepsis/bacteriemia": ["sepsis", "bacteremia"],
  "Shock": ["shock"],
  "Vómito": ["vomiting", "emesis"],
  "Íleo/reflujo": ["ileus", "reflux"],
  "Úlcera gástrica": ["gastric ulcer"]
};

// Construye un término de búsqueda amplio para PubMed: nombre genérico Y nombres comerciales
// (unidos con OR, ya que muchos artículos citan solo la marca) AND especie, y opcionalmente
// AND la indicación ya traducida al inglés. Se evita encadenar muchos conceptos obligatorios
// a la vez (cada AND adicional reduce drásticamente los resultados), por eso NO se exige
// además la palabra "dose"/"dosage": basta con el fármaco + la especie (+ la indicación).
// Construye solo el término de búsqueda (sin la URL), para poder reutilizarlo tanto en el
// enlace manual a pubmed.ncbi.nlm.nih.gov como en la llamada en vivo a la API de NCBI
// (esearch.fcgi) que hace la búsqueda automática de dosis en panel-bibliografia.
// Nombres (genérico traducido + comerciales) por los que un artículo en inglés probablemente
// se refiera a este fármaco — se reutiliza tanto para construir la consulta de PubMed como
// para, ya en el resumen de cada artículo encontrado, comprobar que una dosis detectada esté
// realmente cerca de una mención de ESTE fármaco (y no de otro citado en el mismo resumen).
function terminosBusquedaFarmaco(farmaco) {
  // El nombre en español apenas encuentra nada en PubMed (literatura casi toda en inglés):
  // se traduce si está en el diccionario, y si no, se usa tal cual (funciona igual para
  // nombres ya parecidos en ambos idiomas). terminosPubMed() separa ingredientes combinados
  // ("+"/",") y extrae paréntesis como término aparte en vez de dejarlos anidados (ej.
  // "Augmentin (uso humano)" o "Producto de levadura (Saccharomyces cerevisiae)"), que si no
  // rompen el anidamiento de la consulta y la vacían por completo.
  const principioActivoEn = PRINCIPIO_ACTIVO_PUBMED_EN[farmaco.principioActivo] || farmaco.principioActivo;
  return [...new Set([...terminosPubMed(principioActivoEn), ...(farmaco.nombresComerciales || []).flatMap(terminosPubMed)])];
}

function terminoPubMedQuery(farmaco, especie, indicacion) {
  const nombres = terminosBusquedaFarmaco(farmaco);
  const nombreTerm = nombres.length > 1 ? `(${nombres.join(" OR ")})` : nombres[0];
  const especieEn = especie === "gato" ? "(cat OR feline)" : "(dog OR canine)";
  const partes = [nombreTerm, especieEn];
  const sinonimos = indicacion ? INDICACION_PUBMED_EN[indicacion] : null;
  if (sinonimos && sinonimos.length) partes.push(`(${sinonimos.join(" OR ")})`);
  return partes.join(" AND ");
}

function urlPubMed(farmaco, especie, indicacion) {
  return "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(terminoPubMedQuery(farmaco, especie, indicacion));
}

function renderBibliografia(farmaco) {
  const especieLabel = paciente.especie === "gato" ? "gato" : "perro";
  const indicaciones = farmaco.indicaciones && farmaco.indicaciones.length ? farmaco.indicaciones : [];
  let html = "";
  for (const ind of indicaciones) {
    html += `<a class="boton-pubmed" target="_blank" rel="noopener" href="${urlPubMed(farmaco, paciente.especie, ind)}">
      🔎 ${escapeHtml(ind)} en ${especieLabel} — buscar en PubMed
    </a>`;
  }
  html += `<a class="boton-pubmed boton-pubmed-general" target="_blank" rel="noopener" href="${urlPubMed(farmaco, paciente.especie, null)}">
      🔎 Búsqueda general en ${especieLabel} — PubMed
    </a>`;
  bibliografiaBotonesEl.innerHTML = html;
  // La búsqueda automática de dosis (bibliografiaResultadosEl) es más costosa (llamadas en
  // vivo a la API de NCBI) y se difiere a cuando el usuario abre esa sub-pestaña — aquí solo
  // se limpia el resultado del fármaco anterior para no dejarlo visible por error.
  if (bibliografiaResultadosEl) bibliografiaResultadosEl.innerHTML = `<p class="placeholder">Abre esta pestaña para buscar dosis sugeridas en PubMed.</p>`;
}

// ============================================================
// Bibliografía — búsqueda automática de dosis en PubMed (API E-utilities de NCBI, en vivo)
// ============================================================
// Detecta menciones de dosis por kg en un texto libre (resumen de un artículo). Es una
// extracción "a ojo" por patrón de texto, no un análisis clínico: cubre los formatos más
// habituales en abstracts en inglés (mg/kg, mcg/kg, µg/kg, UI o U/kg, con o sin rango y con o
// sin frecuencia tipo "/day"), pero puede no detectar redacciones distintas o dar falsos
// positivos (ej. una dosis de otro fármaco citado en el mismo resumen) — por eso siempre se
// muestra junto al fragmento de texto donde apareció, para que el veterinario lo valore él
// mismo en contexto, nunca como una cifra ya verificada.
const RE_DOSIS_PUBMED = /\d+(?:[.,]\d+)?(?:\s?(?:-|–|to)\s?\d+(?:[.,]\d+)?)?\s?(?:mg|mcg|µg|ug|IU|U)\s?\/\s?kg(?:\s?(?:\/|per)\s?(?:day|d|24\s?h|dose|hr|h))?/gi;

// Divide un resumen en frases (separador: punto/interrogación/exclamación seguido de espacio y
// mayúscula o paréntesis). Es una heurística simple —no distingue abreviaturas como "e.g." o
// "vs."—, pero suficiente para resúmenes científicos en inglés y muchísimo más legible que
// cortar por un número fijo de caracteres a mitad de palabra o de frase.
function dividirEnFrases(texto) {
  return texto.split(/(?<=[.!?])\s+(?=[A-Z(])/);
}

// Recorta una frase alrededor de una posición, respetando límites de palabra (nunca a mitad de
// palabra), para que una frase excepcionalmente larga siga siendo concisa de leer.
function recortarPorPalabra(frase, centro, largoMax) {
  if (frase.length <= largoMax) return frase;
  const mitad = Math.floor(largoMax / 2);
  let inicio = Math.max(0, centro - mitad);
  let fin = Math.min(frase.length, centro + mitad);
  if (inicio > 0) inicio = frase.indexOf(" ", inicio) + 1 || inicio;
  if (fin < frase.length) {
    const corte = frase.lastIndexOf(" ", fin);
    if (corte > inicio) fin = corte;
  }
  let recorte = frase.slice(inicio, fin).trim();
  if (inicio > 0) recorte = "…" + recorte;
  if (fin < frase.length) recorte = recorte + "…";
  return recorte;
}

// terminosFarmaco (nombres en inglés del fármaco buscado, ver terminosBusquedaFarmaco): si se
// pasan, una dosis solo se cuenta cuando alguno de esos nombres aparece PEGADO a la propia
// dosis (ventana corta, no toda la frase) — muchos abstracts comparan varios fármacos en la
// misma frase (ej. "acetaminophen (10 mg/kg) was compared with buprenorphine (20 µg/kg)"), y
// comprobar solo que el nombre esté "en algún punto de la frase" atribuiría al fármaco buscado
// dosis que en realidad son de otro citado justo al lado. El CONTEXTO que se muestra, en
// cambio, sí es la frase completa (recortada solo si es muy larga, por palabra entera): así se
// lee de corrido y se traduce mejor, en vez de un trozo cortado a mitad de frase.
function extraerDosisDeTexto(texto, terminosFarmaco) {
  if (!texto) return [];
  const patronesFarmaco = (terminosFarmaco || []).map((t) => normalizar(t)).filter(Boolean);
  const frases = dividirEnFrases(texto);
  const vistos = new Set();
  const resultados = [];
  for (const frase of frases) {
    const fraseNorm = normalizar(frase);
    RE_DOSIS_PUBMED.lastIndex = 0;
    let m;
    while ((m = RE_DOSIS_PUBMED.exec(frase)) !== null) {
      const clave = m[0].toLowerCase().replace(/\s+/g, "");
      if (vistos.has(clave)) continue;
      if (patronesFarmaco.length) {
        const inicioVentana = Math.max(0, m.index - 50);
        const finVentana = Math.min(frase.length, m.index + m[0].length + 30);
        const ventana = fraseNorm.slice(inicioVentana, finVentana);
        if (!patronesFarmaco.some((p) => ventana.includes(p))) continue;
      }
      vistos.add(clave);
      const contexto = recortarPorPalabra(frase.trim(), m.index, 200);
      resultados.push({ dosis: m[0], contexto });
      if (resultados.length >= 4) break; // no saturar con menciones repetidas del mismo artículo
    }
    if (resultados.length >= 4) break;
  }
  return resultados;
}

// Traduce un texto corto (título o fragmento de resumen) al español con una API pública
// gratuita (MyMemory, sin necesidad de clave) — no es una traducción profesional, solo ayuda a
// leer rápido el resumen en español; el enlace al artículo original en PubMed siempre permite
// comprobar el texto exacto en inglés. Si falla (sin conexión, límite de la API...) se devuelve
// el texto original en inglés sin bloquear el resto de la pestaña.
async function traducirAEspanol(texto) {
  if (!texto) return texto;
  try {
    const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(texto) + "&langpair=en|es";
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return texto;
    const j = await r.json();
    return (j.responseData && j.responseData.translatedText) ? j.responseData.translatedText : texto;
  } catch (e) {
    return texto;
  }
}

function filaBibliografiaHtml(articulo) {
  const metaPartes = [articulo.revista, articulo.anio].filter(Boolean).join(" · ");
  const url = `https://pubmed.ncbi.nlm.nih.gov/${articulo.pmid}/`;
  return `
    <div class="bibliografia-articulo">
      <a class="bibliografia-titulo" href="${url}" target="_blank" rel="noopener">${escapeHtml(articulo.titulo)}</a>
      <div class="bibliografia-meta">${metaPartes ? escapeHtml(metaPartes) + " · " : ""}PMID ${escapeHtml(articulo.pmid)}</div>
      ${articulo.dosisEncontradas.length ? `
        <ul class="bibliografia-dosis-lista">
          ${articulo.dosisEncontradas.map((d) => `<li><strong>${escapeHtml(d.dosis)}</strong> — <span class="bibliografia-contexto">"${escapeHtml(d.contexto)}"</span></li>`).join("")}
        </ul>
      ` : ""}
      <a class="boton-enlace" href="${url}" target="_blank" rel="noopener">Ver artículo en PubMed →</a>
    </div>
  `;
}

let bibliografiaRequestId = 0;

// Búsqueda EN VIVO (sin réplica local, igual que CIMAVET/CIMA): se lanza solo al abrir la
// sub-pestaña "Bibliografía" con un fármaco activo (no en cada tecleo ni en cada cálculo de
// dosis), para no bombardear la API de NCBI. Añade "AND (dose OR dosage OR dosing OR
// posology)" a la búsqueda general del fármaco+especie (a diferencia de los botones de arriba,
// aquí SÍ interesa sesgar hacia artículos que hablen de dosis, ya que es justo lo que se va a
// intentar extraer del resumen).
// contenedorEl es opcional (por defecto el de la sub-pestaña Bibliografía de la ficha de un
// fármaco); se puede pasar otro para reutilizar la misma búsqueda+extracción+traducción en
// cualquier otro sitio donde aparezcan resultados de CIMAVET/CIMA (ver
// cargarBibliografiaPubMedParaTexto, para medicamentos que no están en la base de datos interna).
async function cargarBibliografiaPubMed(farmaco, contenedorEl) {
  const el = contenedorEl || bibliografiaResultadosEl;
  const requestId = ++bibliografiaRequestId;
  if (!el) return;
  el.innerHTML = `<p class="placeholder">Buscando y traduciendo dosis de artículos de PubMed...</p>`;
  try {
    const query = terminoPubMedQuery(farmaco, paciente.especie, null) + " AND (dose OR dosage OR dosing OR posology)";
    const esearchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=12&sort=relevance&retmode=json&term=" + encodeURIComponent(query);
    const esearchRes = await fetch(esearchUrl, { cache: "no-store" });
    if (requestId !== bibliografiaRequestId) return;
    if (!esearchRes.ok) throw new Error("esearch " + esearchRes.status);
    const esearchData = await esearchRes.json();
    const ids = (esearchData.esearchresult && esearchData.esearchresult.idlist) || [];

    if (!ids.length) {
      el.innerHTML = `<p class="placeholder">No se han encontrado artículos en PubMed para esta búsqueda.</p>`;
      return;
    }

    const efetchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=" + ids.join(",");
    const efetchRes = await fetch(efetchUrl, { cache: "no-store" });
    if (requestId !== bibliografiaRequestId) return;
    if (!efetchRes.ok) throw new Error("efetch " + efetchRes.status);
    const xmlTexto = await efetchRes.text();
    const xml = new DOMParser().parseFromString(xmlTexto, "text/xml");
    const articulosXml = Array.from(xml.querySelectorAll("PubmedArticle"));

    const terminosFarmaco = terminosBusquedaFarmaco(farmaco);
    const articulos = articulosXml.map((art) => {
      const pmid = art.querySelector("PMID")?.textContent || "";
      const titulo = art.querySelector("ArticleTitle")?.textContent || "(sin título)";
      const abstractTexto = Array.from(art.querySelectorAll("AbstractText")).map((n) => n.textContent).join(" ");
      const revista = art.querySelector("Journal ISOAbbreviation")?.textContent || art.querySelector("Journal Title")?.textContent || "";
      const anio = art.querySelector("PubDate Year")?.textContent || art.querySelector("PubDate MedlineDate")?.textContent || "";
      return { pmid, titulo, revista, anio, dosisEncontradas: extraerDosisDeTexto(abstractTexto, terminosFarmaco) };
    }).filter((a) => a.pmid);

    if (requestId !== bibliografiaRequestId) return;

    // Los abstracts de PubMed están casi siempre en inglés: se traduce el título de cada
    // artículo y, de los que tienen dosis detectada, el fragmento de contexto de cada una (los
    // que no tienen dosis no llevan fragmento que traducir). En paralelo para no encadenar
    // decenas de peticiones secuenciales.
    await Promise.all(articulos.map(async (a) => {
      a.titulo = await traducirAEspanol(a.titulo);
      await Promise.all(a.dosisEncontradas.map(async (d) => {
        d.contexto = await traducirAEspanol(d.contexto);
      }));
    }));

    if (requestId !== bibliografiaRequestId) return;

    const conDosis = articulos.filter((a) => a.dosisEncontradas.length);
    const sinDosis = articulos.filter((a) => !a.dosisEncontradas.length);

    let html = "";
    if (conDosis.length) {
      html += conDosis.map(filaBibliografiaHtml).join("");
    } else {
      html += `<p class="placeholder">Ninguno de los artículos encontrados menciona una dosis explícita (mg/kg, mcg/kg...) en su resumen — puede que solo aparezca en el texto completo.</p>`;
    }
    if (sinDosis.length) {
      html += `<details class="bibliografia-sin-dosis"><summary>${sinDosis.length} artículo(s) más sin dosis detectada en el resumen</summary>${sinDosis.map(filaBibliografiaHtml).join("")}</details>`;
    }
    el.innerHTML = html;
  } catch (err) {
    if (requestId !== bibliografiaRequestId) return;
    el.innerHTML = `<p class="aviso-inline">⚠ No se ha podido conectar con PubMed ahora mismo. Comprueba tu conexión a internet e inténtalo de nuevo.</p>`;
  }
}

// Para un texto que no corresponde a ningún fármaco de la base de datos interna (ej.
// "Metalgial", solo encontrado en CIMA): monta un fármaco "de mentira" solo con ese texto para
// reutilizar toda la búsqueda+extracción+traducción ya construida para panel-bibliografia,
// dentro del propio respaldo de CIMA/CIMAVET (ver buscarEnCimaComoRespaldo) — así se puede
// calcular una dosis rápidamente sin tener que añadir antes el fármaco a la base de datos.
function cargarBibliografiaPubMedParaTexto(texto, contenedorEl) {
  cargarBibliografiaPubMed({ principioActivo: texto, nombresComerciales: [] }, contenedorEl);
}

// ============================================================
// CIMAVET — API pública de la AEMPS (en vivo, sin réplica local)
// ============================================================
const CIMAVET_BASE = "https://cimavet.aemps.es/cimavet/rest/medicamentos";

async function buscarCimavet(query, pagesize) {
  const url = `${CIMAVET_BASE}?multiple=${encodeURIComponent(query)}&cargaprincipiosactivos=true&cargaespecies=true&pagesize=${pagesize || 50}&pagina=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo conectar con CIMAVET (HTTP " + r.status + ")");
  return r.json();
}

function estadoTexto(estado) {
  if (!estado) return "Desconocido";
  if (estado.rev) return "Anulado (" + new Date(estado.rev).toLocaleDateString("es-ES") + ")";
  if (estado.aut) return "Autorizado (" + new Date(estado.aut).toLocaleDateString("es-ES") + ")";
  return "Desconocido";
}

// ============================================================
// Cuadro plegable "Calcular dosis" para una fila de CIMAVET o CIMA: detecta automáticamente
// la concentración/comprimido del producto a partir de su nombre (extraerPresentacionMed) y,
// con la dosis en mg/kg que indique el usuario y el peso del paciente activo, calcula ml o
// fracción de comprimidos — sin necesitar que el fármaco ya esté en la base de datos interna.
// Pensado sobre todo para medicamentos que solo existen en CIMA (uso humano), que buscarLocal
// no encuentra y que hasta ahora se mostraban como simple ficha informativa sin poder calcular
// nada con ellos.
// ============================================================
let cajaCalculoDosisContador = 0;

// Todas las concentraciones por ml que aparecen en el nombre (ej. "149 mg/ml (2 mEq/ml)" ->
// mg y mEq), para poder indicar la dosis en cualquiera de esas unidades. Solo formas líquidas.
function extraerConcentracionesMed(med) {
  if (esFormaSolida(med)) return [];
  const re = /(\d+(?:[.,]\d+)?)\s*(mEq|mmol|mg|mcg|µg|ug|UI|g)\s*\/\s*ml/gi;
  const nombre = med.nombre || "";
  const vistas = new Map();
  let m;
  while ((m = re.exec(nombre))) {
    let u = m[2].toLowerCase();
    u = u === "meq" ? "mEq" : u === "ui" ? "UI" : u === "µg" || u === "ug" ? "mcg" : u;
    if (!vistas.has(u)) vistas.set(u, parseFloat(m[1].replace(",", ".")));
  }
  return [...vistas].map(([u, v]) => ({ u, v }));
}

function cajaCalculoDosisHtml(med, principioActivo, nombreCorto) {
  const id = ++cajaCalculoDosisContador;
  const p = extraerPresentacionMed(med);
  const concs = extraerConcentracionesMed(med);
  const multi = concs.length > 1;
  const detectadoTexto = multi
    ? `Detectado en el nombre del producto: ${concs.map((c) => `${formatNum(c.v)} ${c.u}/ml`).join(" · ")}. Elige en qué unidad indicas la dosis.`
    : p
    ? `Detectado en el nombre del producto: ${etiquetaPresentacion(p)}.`
    : "No se ha podido detectar la concentración automáticamente en el nombre del producto — indícala tú abajo.";
  const mostrarConcManual = !multi && (!p || p.tipo === "liquido");
  return `
    <details class="calculo-dosis-detalle">
      <summary>🧮 Calcular dosis con este medicamento</summary>
      <div class="calculo-dosis-caja" data-tipo="${p ? p.tipo : ""}" data-valor="${p ? p.valor : ""}" data-principio="${escapeHtml(principioActivo || "")}" data-nombre="${escapeHtml(nombreCorto || "")}" ${multi ? `data-concs="${encodeURIComponent(JSON.stringify(concs))}"` : ""}>
        <p class="ayuda">${detectadoTexto}</p>
        <div class="fila">
          <div class="campo">
            <label for="calculo-dosis-valor-${id}">Dosis (${multi ? "por kg" : "mg/kg"})</label>
            <input type="number" id="calculo-dosis-valor-${id}" class="calculo-dosis-valor" min="0" step="any" placeholder="Ej. 5" />
          </div>
          ${multi ? `
          <div class="campo">
            <label for="calculo-dosis-unidad-${id}">Unidad</label>
            <select id="calculo-dosis-unidad-${id}" class="calculo-dosis-unidad">${concs.map((c) => `<option value="${escapeHtml(c.u)}">${escapeHtml(c.u)}/kg</option>`).join("")}</select>
          </div>` : ""}
          ${mostrarConcManual ? `
          <div class="campo">
            <label for="calculo-dosis-conc-${id}">${p ? "Concentración (si prefieres indicarla tú)" : "Concentración (mg/ml)"}</label>
            <input type="number" id="calculo-dosis-conc-${id}" class="calculo-dosis-conc" min="0" step="any" placeholder="${p ? formatNum(p.valor) : "Ej. 10"}" />
          </div>` : ""}
        </div>
        <div class="calculo-dosis-resultado"><p class="placeholder">${paciente.peso ? "Indica la dosis en mg/kg." : "Introduce antes el peso del paciente en la pestaña Calculadora."}</p></div>
      </div>
    </details>`;
}

// Si la caja de cálculo está en la ficha de un fármaco de la base de datos, añade su vía y
// frecuencia de referencia (ej. "VO · cada 8-12 h") para que aparezcan en el resumen del paciente.
function pautaAdministracionCaja(caja) {
  if (!caja.closest("#comercial-cimavet-detalle")) return "";
  const datos = datosEspecieActiva();
  if (!datos) return "";
  const partes = [datos.via, datos.frecuencia].filter(Boolean);
  return partes.length ? " · " + partes.join(" · ") : "";
}

function recalcularCajaDosis(inputEl) {
  const caja = inputEl.closest(".calculo-dosis-caja");
  if (!caja) return;
  const resultadoEl = caja.querySelector(".calculo-dosis-resultado");
  const dosisMgKg = parseFloat(caja.querySelector(".calculo-dosis-valor").value);
  const tipo = caja.dataset.tipo;
  const valorAuto = caja.dataset.valor ? parseFloat(caja.dataset.valor) : null;
  const nombreCorto = caja.dataset.nombre || "este medicamento";

  if (!paciente.peso || paciente.peso <= 0) {
    resultadoEl.innerHTML = `<p class="placeholder">Introduce el peso del paciente en la pestaña Calculadora.</p>`;
    return;
  }
  if (!dosisMgKg || dosisMgKg <= 0) {
    resultadoEl.innerHTML = `<p class="placeholder">Indica la dosis en mg/kg.</p>`;
    return;
  }
  const dosisTotalMg = dosisMgKg * paciente.peso;

  if (caja.dataset.concs) {
    const concs = JSON.parse(decodeURIComponent(caja.dataset.concs));
    const u = caja.querySelector(".calculo-dosis-unidad").value;
    const c = concs.find((x) => x.u === u) || concs[0];
    const ml = dosisTotalMg / c.v;
    resultadoEl.innerHTML = `
      <div class="resultado-volumen">${formatNum(dosisTotalMg)} ${c.u} totales ÷ ${formatNum(c.v)} ${c.u}/ml = <strong>${formatNum(ml)} ml</strong></div>
      <button type="button" class="boton-anadir calculo-dosis-anadir">+ Añadir al paciente (${formatNum(ml)} ml)</button>`;
    caja.dataset.dosisTexto = `${formatNum(dosisTotalMg)} ${c.u} totales (${formatNum(dosisMgKg)} ${c.u}/kg)`;
    caja.dataset.detalle = `${formatNum(ml)} ml de ${nombreCorto}${pautaAdministracionCaja(caja)}`;
    return;
  }

  if (tipo === "solido" && valorAuto) {
    const cantidad = dosisTotalMg / valorAuto;
    const texto = textoComprimidos(cantidad, cantidad);
    resultadoEl.innerHTML = `
      <div class="resultado-volumen">${formatNum(dosisTotalMg)} mg totales ÷ ${formatNum(valorAuto)} mg/comprimido = <strong>${texto}</strong></div>
      <button type="button" class="boton-anadir calculo-dosis-anadir">+ Añadir al paciente (${texto})</button>`;
    caja.dataset.dosisTexto = `${formatNum(dosisTotalMg)} mg totales (${formatNum(dosisMgKg)} mg/kg)`;
    caja.dataset.detalle = `${texto} de ${nombreCorto}${pautaAdministracionCaja(caja)}`;
    return;
  }

  const concInput = caja.querySelector(".calculo-dosis-conc");
  const concManual = concInput ? parseFloat(concInput.value) : NaN;
  const concentracion = !isNaN(concManual) && concManual > 0 ? concManual : (tipo === "liquido" ? valorAuto : null);
  if (!concentracion) {
    resultadoEl.innerHTML = `<p class="aviso-inline">⚠ Indica la concentración (mg/ml) para poder calcular el volumen a administrar.</p>`;
    delete caja.dataset.dosisTexto;
    return;
  }
  const ml = dosisTotalMg / concentracion;
  resultadoEl.innerHTML = `
    <div class="resultado-volumen">${formatNum(dosisTotalMg)} mg totales ÷ ${formatNum(concentracion)} mg/ml = <strong>${formatNum(ml)} ml</strong></div>
    <button type="button" class="boton-anadir calculo-dosis-anadir">+ Añadir al paciente (${formatNum(ml)} ml)</button>`;
  caja.dataset.dosisTexto = `${formatNum(dosisTotalMg)} mg totales (${formatNum(dosisMgKg)} mg/kg)`;
  caja.dataset.detalle = `${formatNum(ml)} ml de ${nombreCorto}${pautaAdministracionCaja(caja)}`;
}

document.addEventListener("input", (e) => {
  if (e.target.classList.contains("calculo-dosis-valor") || e.target.classList.contains("calculo-dosis-conc") || e.target.classList.contains("calculo-dosis-unidad")) {
    recalcularCajaDosis(e.target);
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".calculo-dosis-anadir");
  if (!btn) return;
  const caja = btn.closest(".calculo-dosis-caja");
  if (!caja || !caja.dataset.dosisTexto) return;
  añadirAlPaciente({
    principioActivo: caja.dataset.principio || caja.dataset.nombre || "Medicamento",
    principioActivoReal: caja.dataset.principio || null,
    categoria: null,
    dosisTexto: caja.dataset.dosisTexto,
    detalle: caja.dataset.detalle,
    origen: "Calculado desde CIMAVET/CIMA"
  });
  btn.textContent = "✓ Añadido al resumen del paciente";
  btn.disabled = true;
});

function filaCimavetHtml(med, textoBuscado) {
  const especies = (med.especies || []).map((e) => e.nombre).join(", ");
  const principios = med.pactivos || (med.principiosActivos || []).map((p) => p.nombre).join(", ");
  const ft = (med.docs || []).find((d) => d.tipo === 1);
  const prospecto = (med.docs || []).find((d) => d.tipo === 2);
  return `
    <div class="cimavet-fila">
      <div class="cimavet-nombre">${escapeHtml(med.nombre)}</div>
      <div class="cimavet-meta">
        <span>${escapeHtml(med.labtitular || "")}</span>
        <span>·</span><span>${escapeHtml(principios)}</span>
        ${especies ? `<span>·</span><span>${escapeHtml(especies)}</span>` : ""}
      </div>
      <div class="cimavet-meta">
        <span>Nº registro: ${escapeHtml(med.nregistro || "-")}</span>
        <span>·</span><span>${escapeHtml(estadoTexto(med.estado))}</span>
        <span>·</span><span class="${med.comerc ? "badge-si" : "badge-no"}">${med.comerc ? "Comercializado" : "No comercializado"}</span>
      </div>
      <div class="cimavet-enlaces">
        ${ft ? `<a href="${ft.url}" target="_blank" rel="noopener">📄 Ficha técnica (posología del laboratorio)</a>` : ""}
        ${prospecto ? `<a href="${prospecto.url}" target="_blank" rel="noopener">📄 Prospecto</a>` : ""}
        <a href="${urlPubMedTexto(textoBuscado || med.nombre, principios, paciente.especie)}" target="_blank" rel="noopener">🔎 Buscar en PubMed</a>
      </div>
      ${cajaCalculoDosisHtml(med, principios, med.nombre)}
    </div>`;
}

// ============================================================
// CIMA — medicamentos de USO HUMANO (AEMPS). Se consulta como
// respaldo cuando un principio activo no existe como veterinario
// en CIMAVET, para saber si existe una alternativa humana que el
// veterinario pueda valorar usar fuera de ficha técnica (off-label).
// ============================================================
const CIMA_BASE = "https://cima.aemps.es/cima/rest/medicamentos";

async function buscarCimaPor(param, query) {
  const url = `${CIMA_BASE}?${param}=${encodeURIComponent(query)}&pagina=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo conectar con CIMA (HTTP " + r.status + ")");
  return r.json();
}

// Busca por principio activo (practiv1) y también por nombre de producto, y combina
// resultados: practiv1 encuentra marcas cuyo nombre comercial no incluye el principio
// activo (ej. "Lanacordin" para digoxina), que una búsqueda solo por nombre no encontraría.
async function buscarCima(query) {
  const [porPrincipioActivo, porNombre] = await Promise.all([
    buscarCimaPor("practiv1", query).catch(() => ({ resultados: [] })),
    buscarCimaPor("nombre", query).catch(() => ({ resultados: [] }))
  ]);
  const vistos = new Map();
  for (const med of [...(porPrincipioActivo.resultados || []), ...(porNombre.resultados || [])]) {
    if (!vistos.has(med.nregistro)) vistos.set(med.nregistro, med);
  }
  return { resultados: [...vistos.values()] };
}

function filaCimaHtml(med, textoBuscado) {
  const ft = (med.docs || []).find((d) => d.tipo === 1);
  const prospecto = (med.docs || []).find((d) => d.tipo === 2);
  const principioActivo = med.vtm ? med.vtm.nombre : null;
  const principioActivoCapitalizado = principioActivo
    ? principioActivo.charAt(0).toUpperCase() + principioActivo.slice(1).toLowerCase()
    : (textoBuscado ? textoBuscado.charAt(0).toUpperCase() + textoBuscado.slice(1) : "");
  // Para el campo "Composición" de Mi base de datos, la concentración YA detectada en el
  // nombre (ej. "50 mg/ml") es mucho más útil que el texto genérico de forma farmacéutica
  // (ej. "solución inyectable"): así, si luego se busca este fármaco personalizado, la
  // concentración se detecta sola en vez de tener que volver a indicarla a mano.
  const presentacionDetectada = extraerPresentacionMed(med);
  const composicionTexto = presentacionDetectada
    ? etiquetaPresentacion(presentacionDetectada)
    : (med.formaFarmaceutica ? med.formaFarmaceutica.nombre : "");
  return `
    <div class="cimavet-fila">
      <div class="cimavet-nombre">${escapeHtml(med.nombre)} <span class="badge-humano">Uso humano</span></div>
      <div class="cimavet-meta">
        <span>${escapeHtml(med.labtitular || "")}</span>
        ${med.dosis ? `<span>·</span><span>${escapeHtml(med.dosis)}</span>` : ""}
        ${med.formaFarmaceutica ? `<span>·</span><span>${escapeHtml(med.formaFarmaceutica.nombre)}</span>` : ""}
      </div>
      <div class="cimavet-meta">
        <span>Nº registro: ${escapeHtml(med.nregistro || "-")}</span>
        <span>·</span><span>${escapeHtml(estadoTexto(med.estado))}</span>
        <span>·</span><span class="${med.comerc ? "badge-si" : "badge-no"}">${med.comerc ? "Comercializado" : "No comercializado"}</span>
      </div>
      <div class="cimavet-enlaces">
        ${ft ? `<a href="${ft.url}" target="_blank" rel="noopener">📄 Ficha técnica</a>` : ""}
        ${prospecto ? `<a href="${prospecto.url}" target="_blank" rel="noopener">📄 Prospecto</a>` : ""}
        <a href="${urlPubMedTexto(textoBuscado || med.nombre, principioActivo, paciente.especie)}" target="_blank" rel="noopener">🔎 Buscar en PubMed</a>
        <button type="button" class="boton-enlace boton-anadir-cima-bd"
          data-nombre="${escapeHtml(marcaCorta(med.nombre) || med.nombre)}"
          data-principio="${escapeHtml(principioActivoCapitalizado)}"
          data-composicion="${escapeHtml(composicionTexto)}"
          data-nregistro="${escapeHtml(med.nregistro || "")}"
        >+ Añadir a Mi base de datos</button>
      </div>
      ${cajaCalculoDosisHtml(med, principioActivoCapitalizado, med.nombre)}
    </div>`;
}

// Delegado: el botón "+ Añadir a Mi base de datos" de cada fila de CIMA (uso humano) puede
// aparecer en varios listados generados por innerHTML (respaldo de la Calculadora, Buscador
// general), así que se engancha aquí una sola vez en vez de repetir addEventListener cada
// vez que se regenera el HTML. Abre el formulario de "Mi base de datos" precargado con el
// principio activo, el nombre comercial y una nota recordando que es de uso humano (off-label),
// dejando solo la dosis por rellenar.
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".boton-anadir-cima-bd");
  if (!btn) return;
  document.querySelector('.tab-principal[data-vista="misfarmacos"]').click();
  abrirFormulario();
  cfPrincipioActivo.value = btn.dataset.principio || "";
  cfComerciales.value = btn.dataset.nombre || "";
  cfComposicion.value = btn.dataset.composicion || "";
  const notaOffLabel = `Medicamento de uso humano (CIMA${btn.dataset.nregistro ? ", nº registro " + btn.dataset.nregistro : ""}), no autorizado como veterinario. Uso en animales fuera de ficha técnica (off-label), bajo prescripción y responsabilidad del veterinario. Verifica y completa la dosis antes de guardar.`;
  const primeraFila = cfPatologiasLista.querySelector(".patologia-fila");
  if (primeraFila) {
    const notasInput = primeraFila.querySelector(".pf-notas");
    if (notasInput) notasInput.value = notaOffLabel;
    // Si ya se calculó una dosis (mg/kg) en el cuadro "Calcular dosis" de esta misma fila, se
    // precarga también aquí en vez de dejarla en blanco para que el usuario tenga que
    // volver a escribirla.
    const cajaValor = btn.closest(".cimavet-fila")?.querySelector(".calculo-dosis-valor");
    const dosisValor = cajaValor ? parseFloat(cajaValor.value) : NaN;
    if (!isNaN(dosisValor) && dosisValor > 0) {
      const minInput = primeraFila.querySelector(".pf-min");
      const maxInput = primeraFila.querySelector(".pf-max");
      const especieSelect = primeraFila.querySelector(".pf-especie");
      if (minInput) minInput.value = dosisValor;
      if (maxInput) maxInput.value = dosisValor;
      if (especieSelect) especieSelect.value = paciente.especie;
    }
  }
});

async function buscarEnCimaComoRespaldo(texto, contenedorEl, principioActivo, nombreComercialBuscado) {
  contenedorEl.innerHTML = `<p class="placeholder">No autorizado como veterinario. Buscando en CIMA (medicina humana)...</p>`;
  try {
    const data = await buscarCima(texto);
    // Sin límite arbitrario: para principios activos muy comunes (ej. paracetamol) CIMA puede
    // devolver cientos de marcas/combinaciones, y un corte a los primeros 20-30 (orden
    // básicamente alfabético) escondía casi todas las marcas habituales sin ningún criterio.
    const resultados = data.resultados || [];
    // Fármaco que NO está en la base de datos interna (si lo estuviera, farmacoActivo ya
    // tendría su propia sub-pestaña "Bibliografía" con esta misma búsqueda — repetirla aquí
    // solo duplicaría contenido): el texto buscado no tiene ninguna dosis por kg conocida por
    // la app, así que se busca también en PubMed la dosis (igual que en panel-bibliografia)
    // para poder calcularla rápido con el cuadro "Calcular dosis" de cada producto de abajo,
    // en vez de tener que añadir antes el fármaco a mano solo para consultar una dosis
    // orientativa. El principio activo real que trae CIMA en el primer resultado (ej.
    // "METAMIZOL SODICO" para la marca "Metalgial") busca en PubMed mucho mejor que el nombre
    // comercial español, que ahí casi nunca aparece citado.
    const principioActivoDetectado = resultados.length && resultados[0].vtm && resultados[0].vtm.nombre
      ? resultados[0].vtm.nombre.charAt(0).toUpperCase() + resultados[0].vtm.nombre.slice(1).toLowerCase()
      : null;
    const terminoBibliografia = principioActivoDetectado || principioActivo || nombreComercialBuscado || texto;
    const bibliografiaHtml = farmacoActivo ? "" : `
      <div class="calculo-dosis-detalle-bibliografia">
        <h3 class="subtitulo">Dosis sugeridas encontradas en PubMed</h3>
        <p class="ayuda">Este fármaco no está en tu base de datos de dosis, así que no hay una pauta propia con la que comparar — estas son solo menciones de dosis detectadas en resúmenes de PubMed, con su artículo de origen. Verifica siempre antes de usar cualquiera.</p>
        <div class="bibliografia-busqueda-resultados"><p class="placeholder">Buscando en PubMed...</p></div>
      </div>`;
    if (!resultados.length) {
      // Sin resultados en CIMAVET ni en CIMA (habitual en suplementos/nutracéuticos que no
      // son medicamento autorizado bajo ningún nombre): se ofrece igualmente un enlace a
      // PubMed. Se usa el nombre comercial buscado (ej. "Zylkene") en vez de "texto" cuando
      // se conoce, ya que "texto" aquí es el principio activo usado para la consulta a
      // CIMA/CIMAVET (ej. "Caseína hidrolizada (alfa-casozepina)") y buscar solo por ese
      // texto en PubMed es mucho menos fiable que por el nombre comercial real del producto.
      contenedorEl.innerHTML = `<p class="placeholder">"${escapeHtml(texto)}" no se ha encontrado ni como medicamento veterinario (CIMAVET) ni como medicamento de uso humano (CIMA).</p>` +
        `<a class="boton-enlace" target="_blank" rel="noopener" href="${urlPubMedTexto(nombreComercialBuscado || texto, principioActivo, paciente.especie)}">🔎 Buscar en PubMed</a>` +
        bibliografiaHtml;
      if (!farmacoActivo) cargarBibliografiaPubMedParaTexto(terminoBibliografia, contenedorEl.querySelector(".bibliografia-busqueda-resultados"));
      return;
    }
    contenedorEl.innerHTML = `<p class="aviso-inline">⚠ "${escapeHtml(texto)}" no es un medicamento veterinario autorizado en España, pero sí existe como medicamento de uso humano en CIMA (${resultados.length} resultado(s)). Su uso en animales sería fuera de ficha técnica (off-label), bajo prescripción y responsabilidad del veterinario.</p>` +
      bibliografiaHtml +
      resultados.map((m) => filaCimaHtml(m, texto)).join("");
    if (!farmacoActivo) cargarBibliografiaPubMedParaTexto(terminoBibliografia, contenedorEl.querySelector(".bibliografia-busqueda-resultados"));
  } catch (err) {
    contenedorEl.innerHTML += `<p class="aviso-inline">⚠ No se ha podido conectar con CIMA (${escapeHtml(err.message)}).</p>`;
  }
}

function principioActivoCorto(farmaco) {
  return farmaco.principioActivo.split("/")[0];
}

// Descarta de un listado de CIMAVET los medicamentos que no sean EXCLUSIVAMENTE para perros
// y/o gatos, ya que esta calculadora es solo para pequeños animales. Un producto se mantiene
// si está indicado para perro, para gato, o para ambos — por ejemplo Cerenia en comprimidos
// solo está autorizado para perros, pero un veterinario viendo una ficha de gato puede querer
// verlo igualmente (p. ej. para valorar un uso off-label). En cambio se descarta en cuanto
// mezcle CUALQUIER otra especie (ganado, aves, caballos...), aunque también liste perros: un
// inyectable "para caballos, bovino, porcino y perros" (ej. combinados de metamizol) no es en
// la práctica un producto de pequeños animales solo porque perros aparezca en la lista.
// Si un principio activo (ej. paracetamol) solo existe en CIMAVET para otras especies, esta
// función devuelve una lista VACÍA a propósito — quien la llama debe entonces buscar en CIMA
// (medicina humana) como corresponde, no mostrar productos de otra especie como si valieran.
function filtrarCimavetPorEspecie(resultados) {
  return resultados.filter((m) => {
    const especies = m.especies || [];
    if (!especies.length) return false;
    return especies.every((e) => {
      const n = normalizar(e.nombre);
      return n.includes("perro") || n.includes("gato");
    });
  });
}

// A diferencia de filtrarCimavetPorEspecie (que mantiene un resultado con que sea de perro O
// gato, para no esconder p. ej. Cerenia comprimidos —solo perro— viendo la ficha de un gato),
// esta comprueba si hay AL MENOS UNO específico para la especie del paciente ACTIVO. Sirve
// para decidir si, aun habiendo productos veterinarios de la especie "hermana", conviene
// complementar con CIMA: p. ej. metamizol solo existe en CIMAVET combinado para perros (nunca
// gatos), así que para un gato hay que ofrecer también las alternativas humanas.
function hayResultadoParaEspecieActiva(resultados) {
  const especieNombre = paciente.especie === "gato" ? "gato" : "perro";
  return resultados.some((m) => (m.especies || []).some((e) => normalizar(e.nombre).includes(especieNombre)));
}

async function cargarCimavetParaFarmaco(farmaco) {
  cimavetFarmacoResultadoEl.innerHTML = `<p class="placeholder">Buscando en CIMAVET...</p>`;
  try {
    const data = await buscarCimavet(principioActivoCorto(farmaco), 100);
    const resultados = data.resultados || [];
    // Filtrar por especie ANTES de decidir si hay resultados: si CIMAVET solo tiene
    // presentaciones para otra especie (ej. paracetamol solo para porcino), esto debe
    // tratarse como "sin resultados para perro/gato" y buscar en CIMA, no mostrarlas igual.
    const mostrar = filtrarCimavetPorEspecie(resultados);

    if (!mostrar.length) {
      await buscarEnCimaComoRespaldo(principioActivoCorto(farmaco), cimavetFarmacoResultadoEl, farmaco.principioActivo);
      return;
    }

    let html = mostrar.length === resultados.length
      ? `<p class="ayuda">${resultados.length} presentaciones autorizadas encontradas.</p>`
      : `<p class="ayuda">Mostrando ${mostrar.length} de ${resultados.length} presentaciones autorizadas para "${escapeHtml(principioActivoCorto(farmaco))}", filtradas para perro/gato.</p>`;
    html += mostrar.map((m) => filaCimavetHtml(m, principioActivoCorto(farmaco))).join("");

    // Hay productos veterinarios, pero ninguno autorizado expresamente para la especie del
    // paciente activo (ej. metamizol: combinados solo para perros, nunca para gatos). Se
    // complementa con las alternativas humanas de CIMA en vez de dar por buena la de la otra especie.
    if (!hayResultadoParaEspecieActiva(mostrar)) {
      const especieNombre = paciente.especie === "gato" ? "gatos" : "perros";
      html += `<p class="aviso-inline">⚠ Ninguna de estas presentaciones está autorizada expresamente para ${especieNombre}. También puedes valorar estas alternativas de uso humano (CIMA), fuera de ficha técnica y bajo tu responsabilidad:</p>`;
      try {
        const cimaData = await buscarCima(principioActivoCorto(farmaco));
        const cimaResultados = cimaData.resultados || [];
        html += cimaResultados.length
          ? cimaResultados.map((m) => filaCimaHtml(m, principioActivoCorto(farmaco))).join("")
          : `<p class="placeholder">Sin resultados en CIMA.</p>`;
      } catch (e) {
        html += `<p class="aviso-inline">⚠ No se ha podido conectar con CIMA ahora mismo.</p>`;
      }
    }
    cimavetFarmacoResultadoEl.innerHTML = html;
  } catch (err) {
    cimavetFarmacoResultadoEl.innerHTML = `<p class="aviso-inline">⚠ No se ha podido conectar con CIMAVET ahora mismo (${escapeHtml(err.message)}). Comprueba tu conexión a internet e inténtalo de nuevo.</p>`;
  }
}

// ---- Desplegable de nombre comercial (campo separado, junto a "Principio activo") ----
function resetComercialSelect(mensaje) {
  comercialSelect.innerHTML = `<option value="">${escapeHtml(mensaje)}</option>`;
  comercialSelect.disabled = true;
  comercialSelect._resultados = null;
  comercialDetalleEl.innerHTML = "";
}

// CIMAVET responde a búsquedas parciales (ej. "feno" de camino a "fenobarbital") con
// coincidencias muy amplias y poco relacionadas (carprofeno, fenofloxacino...). Sin esta
// guarda, si esa respuesta parcial llega DESPUÉS que la de la búsqueda completa (habitual:
// una búsqueda más amplia tarda más en resolverse), se queda pintada en pantalla como si
// fuera el resultado de lo que el usuario terminó escribiendo. Solo se aplica la respuesta
// si el texto buscado sigue siendo el que hay en el campo en ese momento.
let comercialesRequestId = 0;
async function cargarComercialesParaTexto(texto, nombreComercialBuscado) {
  const requestId = ++comercialesRequestId;
  comercialSelect.innerHTML = `<option value="">Buscando en CIMAVET...</option>`;
  comercialSelect.disabled = true;
  try {
    let data = await buscarCimavet(texto, 150);
    if (requestId !== comercialesRequestId) return; // ha llegado una búsqueda más reciente entretanto
    // Filtrar por especie ANTES de decidir si hay resultados: si CIMAVET solo tiene
    // presentaciones para otra especie (ej. paracetamol solo para porcino), esto debe
    // tratarse como "sin resultados para perro/gato" y buscar en CIMA, no mostrarlas igual.
    let resultados = filtrarCimavetPorEspecie(data.resultados || []);
    // Si buscar por principio activo no encuentra nada, pero se conoce el nombre comercial
    // con el que se encontró el fármaco (y es distinto del texto ya probado), se reintenta
    // con ese nombre antes de rendirse: CIMAVET no sabe interpretar principios activos
    // combinados tal cual se escriben en "Mi base de datos" (ej. "Espiramicina, Metronidazol"
    // para Stomorgyl, que sí está registrado en CIMAVET, pero indexado por el nombre del
    // combinado, no por esa lista de ingredientes unida por comas).
    if (!resultados.length && nombreComercialBuscado && normalizar(nombreComercialBuscado) !== normalizar(texto)) {
      data = await buscarCimavet(nombreComercialBuscado, 150);
      if (requestId !== comercialesRequestId) return;
      resultados = filtrarCimavetPorEspecie(data.resultados || []);
    }
    if (!resultados.length) {
      resetComercialSelect("Sin resultados en CIMAVET (no autorizado como veterinario)");
      actualizarConcentracionesDetectadas([]);
      await buscarEnCimaComoRespaldo(texto, comercialDetalleEl, farmacoActivo ? farmacoActivo.principioActivo : null, nombreComercialBuscado);
      return;
    }
    const principioActivoParaFavoritos = farmacoActivo ? farmacoActivo.principioActivo : texto;
    const { lista: resultadosOrdenados, esFavorito } = marcarYOrdenarFavoritos(resultados, principioActivoParaFavoritos);
    resultados = resultadosOrdenados;
    comercialSelect.innerHTML = `<option value="">— ${resultados.length} medicamento(s), elige uno —</option>` +
      resultados.map((m, i) => `<option value="${i}">${esFavorito(m.nombre) ? "⭐ " : ""}${escapeHtml(m.nombre)}${m.labtitular ? " — " + escapeHtml(m.labtitular) : ""}</option>`).join("");
    comercialSelect.disabled = false;
    comercialSelect._resultados = resultados;
    comercialSelect._textoBuscado = texto;
    comercialDetalleEl.innerHTML = "";
    actualizarConcentracionesDetectadas(resultados);

    // Hay productos veterinarios, pero ninguno autorizado expresamente para la especie del
    // paciente activo (ej. metamizol: combinados solo para perros, nunca para gatos). Se
    // complementa con las alternativas humanas de CIMA en vez de dar por buena la de la otra especie.
    if (!hayResultadoParaEspecieActiva(resultados)) {
      const especieNombre = paciente.especie === "gato" ? "gatos" : "perros";
      let html = `<p class="aviso-inline">⚠ Ninguna presentación de CIMAVET está autorizada expresamente para ${especieNombre}. También puedes valorar estas alternativas de uso humano (CIMA), fuera de ficha técnica y bajo tu responsabilidad:</p>`;
      try {
        const cimaData = await buscarCima(texto);
        if (requestId !== comercialesRequestId) return;
        const cimaResultados = cimaData.resultados || [];
        html += cimaResultados.length
          ? cimaResultados.map((m) => filaCimaHtml(m, texto)).join("")
          : `<p class="placeholder">Sin resultados en CIMA.</p>`;
      } catch (e) {
        html += `<p class="aviso-inline">⚠ No se ha podido conectar con CIMA ahora mismo.</p>`;
      }
      comercialDetalleEl.innerHTML = html;
    }
  } catch (err) {
    if (requestId !== comercialesRequestId) return;
    resetComercialSelect("Error al conectar con CIMAVET");
    actualizarConcentracionesDetectadas([]);
  }
}

comercialSelect.addEventListener("change", () => {
  const idx = comercialSelect.value;
  const resultados = comercialSelect._resultados;
  if (idx === "" || !resultados) {
    comercialDetalleEl.innerHTML = "";
    marcaComercialActiva = null;
    calcularReferencia();
    calcularPersonalizada();
    return;
  }
  const med = resultados[idx];
  comercialDetalleEl.innerHTML = filaCimavetHtml(med, comercialSelect._textoBuscado);

  // Al elegir un medicamento concreto, su presentación manda sobre la detección genérica.
  const datos = datosEspecieActiva();
  const esUI = datos && datos.unidad === "UI/kg";
  const p = extraerPresentacionMed(med);
  const esValida = p && (esUI ? p.unidad === "UI/ml" : (p.unidad === "mg/ml" || p.unidad === "mg/comprimido"));
  if (esValida) {
    concentracionCimavetSelect.classList.add("oculto");
    marcaComercialActiva = med.nombre;
    aplicarPresentacion(p);
    concentracionCimavetEstadoEl.textContent = `Presentación de "${med.nombre}": ${etiquetaPresentacion(p)}` +
      (p.tipo === "solido" ? " — se calculará en fracción de comprimido." : " (CIMAVET).");
  } else {
    marcaComercialActiva = null;
    concentracionCimavetEstadoEl.textContent = `No se ha podido detectar automáticamente la concentración de "${med.nombre}"; indícala manualmente si la conoces.`;
  }
});

// ---- Detección automática de la presentación (mg/ml, UI/ml o mg/comprimido) a partir de CIMAVET ----
// Incluye microgramos/mcg/µg (ej. "FENTADON 50 microgramos/ml..."), muy habituales en CRI
// (fentanilo, dexmedetomidina...); se convierten a mg/ml para mantener un único sistema de
// unidades de concentración en toda la app (igual que ya se hace con las dosis en mcg/kg).
// "g" (gramos, sin la "m") va el último en la alternancia a propósito: como las alternativas se
// prueban en orden en cada posición, "mg"/"mcg"/etc. se intentan primero y solo caen a "g" suelto
// cuando de verdad no hay una "m" delante (ej. "NOLOTIL 0,4 g/ml", metamizol de uso humano) — así
// no hay ambigüedad entre "50 mg/ml" y "2 g/ml" aunque ambos acaben en "g".
const PATRON_CONCENTRACION_LIQUIDA = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|[uµ]g|microgramos?|UI|g)\s*\/\s*ml/i;
// "g" también el último aquí por el mismo motivo (ej. "NOLOTIL 2 g COMPRIMIDOS", si existiera).
const PATRON_MG_COMPRIMIDO = /(\d+(?:[.,]\d+)?)\s*(mg|g)\b/i;

// A partir del match de PATRON_CONCENTRACION_LIQUIDA, devuelve { valor, unidad } ya
// normalizado a mg/ml o UI/ml (convirtiendo gramos ×1000 y microgramos/mcg/µg ÷1000).
function normalizarConcentracionLiquida(match) {
  const valorBruto = parseFloat(match[1].replace(",", "."));
  const unidadRaw = match[2].toLowerCase();
  if (unidadRaw === "ui") return { valor: valorBruto, unidad: "UI/ml" };
  if (unidadRaw === "mg") return { valor: valorBruto, unidad: "mg/ml" };
  if (unidadRaw === "g") return { valor: valorBruto * 1000, unidad: "mg/ml" };
  return { valor: valorBruto / 1000, unidad: "mg/ml" }; // mcg, µg, ug, microgramo(s)
}

// "250 mg/25 ml" (cantidad total en un volumen, ej. SEGURIL) = 10 mg/ml.
const PATRON_CANTIDAD_EN_VOLUMEN = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|[uµ]g|microgramos?|UI|g)\s*\/\s*(\d+(?:[.,]\d+)?)\s*ml/i;

// Busca la concentración líquida en un texto: primero "X mg/ml" y, si no, "X mg/Y ml".
function buscarConcentracionLiquida(texto) {
  const m = PATRON_CONCENTRACION_LIQUIDA.exec(texto || "");
  if (m) return normalizarConcentracionLiquida(m);
  const v = PATRON_CANTIDAD_EN_VOLUMEN.exec(texto || "");
  if (!v) return null;
  const ml = parseFloat(v[3].replace(",", "."));
  if (!ml) return null;
  const n = normalizarConcentracionLiquida(v);
  return { valor: n.valor / ml, unidad: n.unidad };
}

// A partir del match de PATRON_MG_COMPRIMIDO, devuelve el valor ya normalizado a mg
// (convirtiendo gramos ×1000, ej. "2 g" -> 2000 mg por comprimido).
function normalizarValorSolido(match) {
  const valorBruto = parseFloat(match[1].replace(",", "."));
  return match[2].toLowerCase() === "g" ? valorBruto * 1000 : valorBruto;
}

// CIMAVET (veterinario) devuelve la forma farmacéutica en "formasFarmaceuticas" (array);
// CIMA (uso humano) la devuelve en "formaFarmaceutica" (objeto único, sin "s"). Si solo se
// mira el campo de CIMAVET, ningún medicamento de CIMA en comprimido/cápsula se detecta
// nunca como sólido (ej. "URSOBILANE 150 mg CAPSULAS", que solo existe en CIMA).
function esFormaSolida(med) {
  const formas = med.formasFarmaceuticas || (med.formaFarmaceutica ? [med.formaFarmaceutica] : []);
  return formas.some((f) => /comprimid|tableta|c[aá]psula/i.test(f.nombre || ""));
}

// Devuelve { tipo: "liquido"|"solido", valor, unidad } o null si no se puede determinar.
function extraerPresentacionMed(med) {
  const nombre = med.nombre || "";
  if (esFormaSolida(med)) {
    const m = PATRON_MG_COMPRIMIDO.exec(nombre);
    if (!m) return null;
    return { tipo: "solido", valor: normalizarValorSolido(m), unidad: "mg/comprimido" };
  }
  const liq = buscarConcentracionLiquida(nombre);
  if (!liq) return null;
  return { tipo: "liquido", ...liq };
}

function etiquetaPresentacion(p) {
  return `${formatNum(p.valor)} ${p.unidad}`;
}

// Extrae la presentación líquida directamente de un texto (ej. el nombre de un
// componente de protocolo ya guardado), sin necesitar el objeto completo de
// CIMAVET/CIMA. Sirve de red de seguridad: si el nombre del medicamento ya
// indica la concentración (p. ej. "BUTOMIDOR 10 mg/ml..."), se lee de ahí
// aunque no se capturara al elegirlo en el desplegable.
function extraerPresentacionDeTexto(nombre) {
  const liq = buscarConcentracionLiquida(nombre);
  if (!liq) return null;
  return { tipo: "liquido", ...liq };
}

// Extrae la presentación (líquida o en comprimido/cápsula) directamente del campo
// "Composición" de un fármaco personalizado (Mi base de datos), ej. "200 mg/ml" o
// "Amoxicilina trihidrato 250 mg/comprimido". A diferencia de extraerPresentacionDeTexto
// (solo líquidos, pensada para nombres de producto de CIMAVET/CIMA), aquí también se
// reconoce la forma sólida si el texto la menciona explícitamente.
function extraerPresentacionDeComposicion(composicion) {
  if (!composicion) return null;
  const liqComp = buscarConcentracionLiquida(composicion);
  if (liqComp) return { tipo: "liquido", ...liqComp };
  if (/comprimid|c[aá]psula|tableta/i.test(composicion)) {
    const mSolido = PATRON_MG_COMPRIMIDO.exec(composicion);
    if (mSolido) return { tipo: "solido", valor: normalizarValorSolido(mSolido), unidad: "mg/comprimido" };
  }
  return null;
}

// Presentación de un componente de protocolo: usa la guardada si existe y, si no,
// intenta deducirla igualmente a partir de su nombre (ver extraerPresentacionDeTexto).
function obtenerPresentacionComponente(componenteRaw) {
  if (typeof componenteRaw !== "object" || !componenteRaw) return null;
  if (componenteRaw.presentacion) return componenteRaw.presentacion;
  return extraerPresentacionDeTexto(componenteRaw.nombre);
}

// Categoría terapéutica y principio activo real de un componente de protocolo
// (para el comprobador de interacciones): si es un id de DRUGS, se toma de ahí;
// si es un componente personalizado, de los datos capturados al elegirlo.
function obtenerCategoriaComponente(componenteRaw) {
  if (typeof componenteRaw === "string") {
    const farmaco = DRUGS.find((d) => d.id === componenteRaw);
    return farmaco ? farmaco.categoria : null;
  }
  return (componenteRaw && componenteRaw.categoria) || null;
}

function obtenerPrincipioActivoRealComponente(componenteRaw) {
  if (typeof componenteRaw === "string") {
    const farmaco = DRUGS.find((d) => d.id === componenteRaw);
    return farmaco ? farmaco.principioActivo : null;
  }
  if (!componenteRaw) return null;
  return componenteRaw.principioActivoReal || componenteRaw.nombre || null;
}

// Aplica una presentación detectada: si es sólida, activa el cálculo en comprimidos;
// si es líquida, rellena el campo de concentración (mg/ml o UI/ml) para el cálculo en ml.
function aplicarPresentacion(p) {
  if (p.tipo === "solido") {
    comprimidoActivo = { mg: p.valor };
    concentracionInput.value = "";
  } else {
    comprimidoActivo = null;
    concentracionInput.value = p.valor;
  }
  calcularReferencia();
  calcularPersonalizada();
  calcularDosisUsoEspecifico();
  calcularDosisIndicacion();
}

function extraerPresentaciones(resultados) {
  const vistos = new Map();
  for (const med of resultados || []) {
    const p = extraerPresentacionMed(med);
    if (!p) continue;
    const key = p.tipo + "|" + p.valor + "|" + p.unidad;
    if (!vistos.has(key)) vistos.set(key, p);
  }
  return [...vistos.values()].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "liquido" ? -1 : 1;
    return a.valor - b.valor;
  });
}

function actualizarConcentracionesDetectadas(resultados) {
  const datos = datosEspecieActiva();
  const esUI = datos && datos.unidad === "UI/kg";
  const presentaciones = extraerPresentaciones(resultados).filter((p) =>
    esUI ? p.unidad === "UI/ml" : (p.unidad === "mg/ml" || p.unidad === "mg/comprimido")
  );

  concentracionCimavetSelect.innerHTML = "";
  concentracionCimavetSelect.classList.add("oculto");
  concentracionCimavetSelect._presentaciones = null;

  if (!presentaciones.length) {
    concentracionCimavetEstadoEl.textContent = farmacoActivo
      ? "No se ha detectado una concentración líquida ni un comprimido claro en CIMAVET para este principio activo; indícalo manualmente si lo conoces."
      : "";
    return;
  }

  if (presentaciones.length === 1) {
    const p = presentaciones[0];
    concentracionCimavetEstadoEl.textContent = `Presentación detectada automáticamente en CIMAVET: ${etiquetaPresentacion(p)}` +
      (p.tipo === "solido" ? " (fracción de comprimido)." : ".");
    marcaComercialActiva = null; // concentración detectada entre varios productos, no un medicamento concreto
    aplicarPresentacion(p);
    return;
  }

  concentracionCimavetEstadoEl.textContent = "CIMAVET registra varias presentaciones para este principio activo (líquidas y/o en comprimidos, para distintas especies o tamaños): elige la de tu envase.";
  concentracionCimavetSelect.innerHTML = `<option value="">— Elige la presentación de tu envase —</option>` +
    presentaciones.map((p, i) => `<option value="${i}">${etiquetaPresentacion(p)}${p.tipo === "solido" ? " (comprimido)" : " (líquido)"}</option>`).join("");
  concentracionCimavetSelect.classList.remove("oculto");
  concentracionCimavetSelect._presentaciones = presentaciones;
}

concentracionCimavetSelect.addEventListener("change", () => {
  const idx = concentracionCimavetSelect.value;
  const presentaciones = concentracionCimavetSelect._presentaciones;
  if (idx === "" || !presentaciones) return;
  marcaComercialActiva = null; // concentración elegida de una lista genérica, no un medicamento concreto
  aplicarPresentacion(presentaciones[idx]);
});

// Buscador CIMAVET independiente (catálogo completo, no limitado a la BD interna)
cimavetBuscarBoton.addEventListener("click", ejecutarBusquedaCimavetGeneral);
cimavetBusquedaInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ejecutarBusquedaCimavetGeneral();
});

// A diferencia del buscador de producto dentro de un protocolo (donde CIMA es solo un
// respaldo si CIMAVET no tiene nada, para no distraer con marcas humanas irrelevantes), esta
// pestaña de búsqueda general consulta SIEMPRE las dos fuentes a la vez y muestra ambas por
// separado: aquí el objetivo es explorar qué existe, veterinario y humano, no solo calcular.
async function ejecutarBusquedaCimavetGeneral() {
  const query = cimavetBusquedaInput.value.trim();
  if (!query) return;
  cimavetResultadoGeneralEl.innerHTML = `<p class="placeholder">Buscando en CIMAVET y CIMA...</p>`;

  const [cimavetRes, cimaRes] = await Promise.all([
    buscarCimavet(query, 50).catch((err) => ({ error: err })),
    buscarCima(query).catch((err) => ({ error: err }))
  ]);
  const errorVet = cimavetRes && cimavetRes.error;
  const errorHum = cimaRes && cimaRes.error;
  const resultadosVet = errorVet ? [] : (cimavetRes.resultados || []);
  const resultadosHum = errorHum ? [] : (cimaRes.resultados || []);

  if (!resultadosVet.length && !resultadosHum.length) {
    if (errorVet && errorHum) {
      cimavetResultadoGeneralEl.innerHTML = `<p class="aviso-inline">⚠ No se ha podido conectar ni con CIMAVET ni con CIMA ahora mismo. Comprueba tu conexión a internet e inténtalo de nuevo.</p>`;
    } else {
      cimavetResultadoGeneralEl.innerHTML = `<p class="placeholder">"${escapeHtml(query)}" no se ha encontrado ni como medicamento veterinario (CIMAVET) ni como medicamento de uso humano (CIMA).</p>`;
    }
    return;
  }

  let html = "";
  html += `<h3 class="subtitulo-seccion">CIMAVET — medicamentos veterinarios</h3>`;
  if (errorVet) {
    html += `<p class="aviso-inline">⚠ No se ha podido conectar con CIMAVET ahora mismo.</p>`;
  } else if (resultadosVet.length) {
    html += `<p class="ayuda">${cimavetRes.totalFilas} resultado(s) encontrados en el catálogo oficial` +
      (cimavetRes.totalFilas > resultadosVet.length ? `, mostrando los primeros ${resultadosVet.length}. Refina la búsqueda para acotar más.` : ".") +
      `</p>`;
    html += resultadosVet.map((m) => filaCimavetHtml(m, query)).join("");
  } else {
    html += `<p class="placeholder">Sin resultados en CIMAVET para "${escapeHtml(query)}".</p>`;
  }

  html += `<h3 class="subtitulo-seccion">CIMA — medicamentos de uso humano</h3>`;
  if (errorHum) {
    html += `<p class="aviso-inline">⚠ No se ha podido conectar con CIMA ahora mismo.</p>`;
  } else if (resultadosHum.length) {
    html += `<p class="aviso-inline">⚠ Uso en animales fuera de ficha técnica (off-label), bajo prescripción y responsabilidad del veterinario.</p>`;
    html += `<p class="ayuda">${resultadosHum.length} resultado(s).</p>`;
    html += resultadosHum.map((m) => filaCimaHtml(m, query)).join("");
  } else {
    html += `<p class="placeholder">Sin resultados en CIMA para "${escapeHtml(query)}".</p>`;
  }

  cimavetResultadoGeneralEl.innerHTML = html;
}

// ============================================================
// Imágenes por fármaco (fotos de libros/revistas con dosis por patología)
// Guardadas en IndexedDB, solo en este dispositivo/navegador.
// ============================================================
imagenInput.addEventListener("change", async () => {
  if (!farmacoActivo || !imagenInput.files.length) return;
  const descripcion = imagenDescripcionInput.value.trim();
  for (const file of Array.from(imagenInput.files)) {
    try {
      const dataUrl = await redimensionarImagen(file, 1600);
      await dbPut("imagenes", {
        id: generarId(),
        farmacoId: farmacoActivo.id,
        descripcion,
        dataUrl,
        fecha: Date.now()
      });
    } catch (err) {
      // Si una imagen falla al procesarse, se omite y se continúa con el resto.
    }
  }
  imagenInput.value = "";
  imagenDescripcionInput.value = "";
  renderImagenes();
});

function redimensionarImagen(file, maxAncho) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > maxAncho) {
          height = Math.round(height * (maxAncho / width));
          width = maxAncho;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function renderImagenes() {
  if (!farmacoActivo) { imagenesGaleriaEl.innerHTML = ""; return; }
  const imagenes = await dbGetByIndex("imagenes", "farmacoId", farmacoActivo.id);
  if (!imagenes.length) {
    imagenesGaleriaEl.innerHTML = `<p class="placeholder">Todavía no hay imágenes guardadas para este fármaco.</p>`;
    return;
  }
  imagenesGaleriaEl.innerHTML = imagenes.sort((a, b) => b.fecha - a.fecha).map((img) => `
    <div class="imagen-item">
      <img src="${img.dataUrl}" alt="${escapeHtml(img.descripcion || "Imagen")}" class="imagen-miniatura" />
      ${img.descripcion ? `<p class="imagen-descripcion">${escapeHtml(img.descripcion)}</p>` : ""}
      <button class="boton-eliminar-imagen" data-id="${img.id}" type="button">✕ Eliminar</button>
    </div>
  `).join("");

  imagenesGaleriaEl.querySelectorAll(".imagen-miniatura").forEach((el) => {
    el.addEventListener("click", () => el.classList.toggle("imagen-grande"));
  });
  imagenesGaleriaEl.querySelectorAll(".boton-eliminar-imagen").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await dbDelete("imagenes", btn.dataset.id);
      renderImagenes();
    });
  });
}

// ============================================================
// Resumen del paciente (varios fármacos / protocolos a la vez)
// ============================================================
function añadirAlPaciente(entry) {
  listaPaciente.push(Object.assign({ id: generarId() }, entry));
  renderResumenPaciente();
}

function eliminarDelPaciente(id) {
  listaPaciente = listaPaciente.filter((e) => e.id !== id);
  renderResumenPaciente();
}

const imprimirResumenBtn = document.getElementById("imprimir-resumen");
imprimirResumenBtn.addEventListener("click", () => {
  document.getElementById("resumen-fecha-impresion").textContent = "Tratamiento prescrito · " + new Date().toLocaleDateString("es-ES");
  window.print();
});

vaciarResumenBtn.addEventListener("click", () => {
  listaPaciente = [];
  renderResumenPaciente();
});

function renderResumenPaciente() {
  resumenContadorEl.textContent = listaPaciente.length ? `(${listaPaciente.length})` : "";
  vaciarResumenBtn.classList.toggle("oculto", listaPaciente.length === 0);
  imprimirResumenBtn.classList.toggle("oculto", listaPaciente.length === 0);

  if (!listaPaciente.length) {
    resumenListaEl.innerHTML = `<p class="placeholder">Todavía no has añadido ningún fármaco para este paciente.</p>`;
    interaccionesEl.innerHTML = "";
    return;
  }

  const nombrePaciente = paciente.nombre ? escapeHtml(paciente.nombre) : "Paciente sin nombre";
  const cabecera = `<p class="resumen-paciente-info">${nombrePaciente} · ${paciente.especie === "gato" ? "Gato" : "Perro"}${paciente.peso ? " · " + paciente.peso + " kg" : ""}</p>`;

  const filas = listaPaciente.map((e) => `
    <div class="resumen-fila">
      <div>
        <div class="resumen-farmaco">${escapeHtml(e.principioActivo)}</div>
        <div class="resumen-dosis">${escapeHtml(e.dosisTexto)}</div>
        <div class="resumen-detalle">${escapeHtml(e.detalle || "")} <span class="tag-origen">${escapeHtml(e.origen)}</span></div>
      </div>
      <button class="boton-eliminar" data-id="${e.id}" title="Quitar">✕</button>
    </div>
  `).join("");

  resumenListaEl.innerHTML = cabecera + filas;
  resumenListaEl.querySelectorAll(".boton-eliminar").forEach((btn) => {
    btn.addEventListener("click", () => eliminarDelPaciente(btn.dataset.id));
  });

  renderInteracciones();
}

// ============================================================
// Comprobador de interacciones y aviso de mezcla en jeringa/sueroterapia
// ============================================================
// Ver el aviso legal en REGLAS_INTERACCION (data.js): selección curada, no
// exhaustiva, no sustituye la consulta de una fuente de referencia farmacológica.
function coincideGrupo(entry, grupo) {
  if (!grupo) return false;
  const nombreReal = normalizar(entry.principioActivoReal || entry.principioActivo || "");
  if (grupo.categorias && entry.categoria) {
    const categoriaEntry = normalizar(entry.categoria);
    if (grupo.categorias.some((c) => normalizar(c) === categoriaEntry)) return true;
  }
  if (grupo.principiosActivos && nombreReal) {
    if (grupo.principiosActivos.some((p) => nombreReal.includes(normalizar(p)))) return true;
  }
  return false;
}

function evaluarInteracciones(lista) {
  const avisos = [];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = lista[i], b = lista[j];
      const nombreA = normalizar(a.principioActivoReal || a.principioActivo || "");
      const nombreB = normalizar(b.principioActivoReal || b.principioActivo || "");
      if (nombreA && nombreA === nombreB) continue; // mismo principio activo añadido dos veces: no es una interacción

      for (const regla of REGLAS_INTERACCION) {
        const directo = coincideGrupo(a, regla.grupoA) && coincideGrupo(b, regla.grupoB);
        const inverso = coincideGrupo(a, regla.grupoB) && coincideGrupo(b, regla.grupoA);
        if (directo || inverso) {
          avisos.push({ farmacoA: a.principioActivo, farmacoB: b.principioActivo, gravedad: regla.gravedad, texto: regla.texto });
        }
      }
    }
  }
  return avisos;
}

const ETIQUETA_GRAVEDAD = { alta: "⛔ Riesgo alto", media: "⚠️ Precaución", baja: "ℹ️ A tener en cuenta" };

function renderInteracciones() {
  if (listaPaciente.length < 2) {
    interaccionesEl.innerHTML = "";
    return;
  }

  const avisos = evaluarInteracciones(listaPaciente);
  let html = `<h3 class="subtitulo-seccion">Comprobación de interacciones</h3>`;

  if (avisos.length) {
    html += avisos.map((a) => `
      <div class="interaccion-aviso interaccion-${a.gravedad}">
        <div class="interaccion-cabecera">${ETIQUETA_GRAVEDAD[a.gravedad] || "Aviso"} — ${escapeHtml(a.farmacoA)} + ${escapeHtml(a.farmacoB)}</div>
        <p>${escapeHtml(a.texto)}</p>
      </div>
    `).join("");
  } else {
    html += `<p class="ayuda">No se ha detectado ninguna interacción conocida entre estos fármacos en la comprobación curada de esta app.</p>`;
  }

  html += `
    <p class="aviso-inline">⚠ Esta comprobación se basa en una selección curada de interacciones conocidas por categoría/principio activo; no es una base de datos exhaustiva. Verifica siempre en una fuente de referencia (ej. Plumb's) o consulta con el veterinario responsable.</p>
    <div class="interaccion-aviso interaccion-info">
      <div class="interaccion-cabecera">💉 Mezcla en la misma jeringa o en la bolsa de sueroterapia</div>
      <p>No se ha comprobado la compatibilidad física/química específica entre estos fármacos (requiere tablas farmacéuticas especializadas que esta app no tiene). Como norma general:</p>
      <ul>
        <li>No mezcles fármacos distintos en la misma jeringa ni los añadas al mismo suero salvo que tengas confirmada su compatibilidad (ficha técnica o tabla de compatibilidad física).</li>
        <li>Si tienes dudas, adminístralos por separado, purgando la vía (o usando llaves de tres pasos distintas) entre uno y otro.</li>
        <li>El diazepam, en concreto, no es compatible con la mayoría de fármacos ni con soluciones de sueroterapia en la misma jeringa/línea (se adsorbe al plástico y puede precipitar): adminístralo siempre solo, por una vía independiente.</li>
        <li>Ten especial cuidado con sueros que contienen calcio (ej. Ringer lactato), ya que pueden ser incompatibles con determinados fármacos y formar precipitados.</li>
      </ul>
    </div>
  `;

  interaccionesEl.innerHTML = html;
}

// ============================================================
// Protocolos combinados (predefinidos + personalizados)
// ============================================================
let customProtocols = []; // cargado desde IndexedDB

async function cargarCustomProtocols() {
  customProtocols = await dbGetAll("customProtocols");
}

// Protocolos PREDEFINIDOS ocultados en este dispositivo (ver comentario en storage.js):
// no se borran del código, solo se dejan de mostrar aquí.
let protocolosOcultos = new Set();
async function cargarProtocolosOcultos() {
  const filas = await dbGetAll("protocolosOcultos");
  protocolosOcultos = new Set(filas.map((f) => f.id));
}

const protocolosOcultosListaEl = document.getElementById("protocolos-ocultos-lista");
const protocolosOcultosTarjetaEl = document.getElementById("protocolos-ocultos-tarjeta");

async function renderProtocolosOcultos() {
  const filas = await dbGetAll("protocolosOcultos");
  protocolosOcultosTarjetaEl.classList.toggle("oculto", !filas.length);
  if (!filas.length) {
    protocolosOcultosListaEl.innerHTML = "";
    return;
  }
  protocolosOcultosListaEl.innerHTML = filas.map((f) => `
    <div class="protocolo-componente">
      <span class="protocolo-componente-nombre">${escapeHtml(f.nombre || f.id)}</span>
      <button type="button" class="boton-secundario boton-restaurar-protocolo" data-id="${escapeHtml(f.id)}">↩ Restaurar</button>
    </div>
  `).join("");
  protocolosOcultosListaEl.querySelectorAll(".boton-restaurar-protocolo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await dbDelete("protocolosOcultos", btn.dataset.id);
      await cargarProtocolosOcultos();
      renderProtocolos();
      renderProtocolosOcultos();
    });
  });
}

// Un "componente" es o bien el id de un fármaco de DRUGS (protocolos predefinidos,
// con dosis por especie), o bien un objeto ya con su propia dosis (protocolos
// personalizados, dosis fija indicada por el usuario para cualquiera de las especies).
function calcularComponenteProtocolo(componente) {
  let nombre, datos;
  if (typeof componente === "string") {
    const farmaco = DRUGS.find((d) => d.id === componente);
    if (!farmaco) return null;
    nombre = farmaco.principioActivo;
    datos = farmaco.especies[paciente.especie];
    if (!datos) return { nombre, datos: null };
  } else {
    nombre = componente.nombre;
    datos = componente;
  }

  let dosisTexto = null, min = null, max = null;
  if (paciente.peso && paciente.peso > 0) {
    min = datos.dosisMin * paciente.peso;
    max = datos.dosisMax * paciente.peso;
    if (datos.dosisMaxima) {
      min = Math.min(min, datos.dosisMaxima);
      max = Math.min(max, datos.dosisMaxima);
    }
    dosisTexto = datos.dosisMin === datos.dosisMax
      ? formatNum(min) + " " + unidadTotal(datos.unidad)
      : `${formatNum(min)} – ${formatNum(max)} ${unidadTotal(datos.unidad)}`;
  }
  return { nombre, datos, dosisTexto, min, max };
}

// Convierte un componente de protocolo predefinido (que puede ser un id de DRUGS en forma de
// string, o ya un objeto con su propia dosis) a un objeto editable completo, para poder
// copiarlo al editor de protocolos personalizados ("Copiar y editar"). Si ya es un objeto, se
// devuelve tal cual. Si es un string, resuelve su dosis desde DRUGS usando la especie "perro"
// si el protocolo la incluye (si no, la primera especie del protocolo con datos).
function convertirComponenteAEditable(componenteRaw, especiesProtocolo) {
  if (typeof componenteRaw !== "string") return componenteRaw;
  const farmaco = DRUGS.find((d) => d.id === componenteRaw);
  if (!farmaco) return { nombre: componenteRaw, dosisMin: null, dosisMax: null, unidad: "mg/kg", via: "", frecuencia: "", notas: "" };
  const especie = especiesProtocolo.includes("perro") ? "perro" : especiesProtocolo.find((e) => farmaco.especies[e]);
  const datos = farmaco.especies[especie];
  return {
    nombre: farmaco.principioActivo,
    principioActivoReal: farmaco.principioActivo,
    categoria: farmaco.categoria,
    dosisMin: datos ? datos.dosisMin : null,
    dosisMax: datos ? datos.dosisMax : null,
    unidad: datos ? datos.unidad : "mg/kg",
    via: datos ? datos.via : "",
    frecuencia: datos ? datos.frecuencia : "",
    notas: (datos ? datos.notas || "" : "") + (especiesProtocolo.length > 1 && datos ? ` (dosis de referencia: ${especie})` : "")
  };
}

function etiquetaEspecies(especies) {
  if (especies.includes("perro") && especies.includes("gato")) return "Perro y gato";
  if (especies.includes("perro")) return "Perro";
  if (especies.includes("gato")) return "Gato";
  return "";
}

// Presentación concreta (producto de CIMAVET/CIMA) que el usuario ha elegido para un
// componente de un protocolo YA CREADO (predefinido o personalizado), buscada en vivo desde
// la propia tarjeta del protocolo. No se persiste entre sesiones (se resetea al recargar),
// igual que las demás búsquedas en vivo de la app. Clave: `${protocolo.id}::${idx}`.
// Valor: { presentacion: {tipo,valor,unidad} | null, nombreProducto, fuente }
const protocoloPresentacionesElegidas = {};

// Convierte la dosis en mg/kg (o mcg/kg, UI/kg) ya calculada de un componente de protocolo
// (resultado de calcularComponenteProtocolo) a una dosis práctica de administración (ml o
// fracción de comprimido) según una presentación/concentración concreta — ya sea detectada
// automáticamente en CIMAVET/CIMA o indicada manualmente. La usan tanto la tarjeta del
// protocolo (para mostrarla) como aplicarProtocolo (al añadirla al paciente), para que el
// cálculo sea siempre exactamente el mismo.
function formatearDosisPractica(c, presentacion) {
  const concentracion = presentacion.valor;
  const unidadConc = presentacion.unidad;
  const esComprimido = presentacion.tipo === "solido";
  const minBase = c.datos.unidad === "mcg/kg" ? c.min / 1000 : c.min;
  const maxBase = c.datos.unidad === "mcg/kg" ? c.max / 1000 : c.max;

  let texto;
  if (esComprimido) {
    texto = textoComprimidos(minBase / concentracion, maxBase / concentracion);
  } else {
    const volMin = minBase / concentracion;
    const volMax = maxBase / concentracion;
    texto = c.datos.dosisMin === c.datos.dosisMax
      ? formatNum(volMin) + " ml"
      : `${formatNum(volMin)} – ${formatNum(volMax)} ml`;
  }
  const detalle = esComprimido
    ? `${c.dosisTexto} (${concentracion} mg/comprimido) · ${c.datos.via} · ${c.datos.frecuencia}`
    : `${c.dosisTexto} a ${concentracion} ${unidadConc} · ${c.datos.via} · ${c.datos.frecuencia}`;
  return { texto, detalle };
}

function renderTarjetaProtocolo(protocolo) {
  const esPersonalizado = !!protocolo.personalizado;
  const aplicaEspecie = protocolo.especies.includes(paciente.especie);

  if (!aplicaEspecie) {
    const especieActualTexto = paciente.especie === "gato" ? "Gato" : "Perro";
    return `
      <div class="tarjeta protocolo-card protocolo-card-deshabilitada" data-id="${protocolo.id}" data-tipo="${esPersonalizado ? "custom" : "predefinido"}">
        <h3 class="titulo-tarjeta">${escapeHtml(protocolo.nombre)}${esPersonalizado ? ' <span class="tipo-tag tipo-tag-personalizado">Personalizado</span>' : ""}</h3>
        <p class="categoria">${escapeHtml(protocolo.indicacion)}</p>
        ${protocolo.notas ? `<p class="notas">${escapeHtml(protocolo.notas)}</p>` : ""}
        <div class="aviso-inline">⚠ Este protocolo está definido solo para <strong>${escapeHtml(etiquetaEspecies(protocolo.especies))}</strong>. No se puede calcular para el paciente actual (${especieActualTexto}).</div>
        <button class="boton-primario boton-protocolo" disabled>+ Añadir todos al paciente</button>
        <div class="fila-botones-form">
          ${esPersonalizado
            ? `<button type="button" class="boton-secundario boton-editar-protocolo" data-id="${protocolo.id}">Editar</button>
               <button type="button" class="boton-secundario boton-eliminar-protocolo" data-id="${protocolo.id}">Eliminar</button>`
            : `<button type="button" class="boton-secundario boton-copiar-protocolo" data-id="${protocolo.id}">📋 Copiar y editar</button>
               <button type="button" class="boton-secundario boton-ocultar-protocolo" data-id="${protocolo.id}">🗑 Eliminar</button>`}
        </div>
      </div>
    `;
  }

  const filas = protocolo.componentes
    .map((componenteRaw, idx) => ({ componenteRaw, idx, c: calcularComponenteProtocolo(componenteRaw) }))
    .filter((f) => f.c);

  let faltaAlgunaConcentracion = false;

  const filasComponentes = filas.map(({ componenteRaw, idx, c }) => {
    const key = protocolo.id + "::" + idx;
    const presentacionAuto = obtenerPresentacionComponente(componenteRaw);
    const elegida = protocoloPresentacionesElegidas[key];
    const presentacionEfectiva = presentacionAuto || (elegida && elegida.presentacion) || null;
    const unidadConc = c.datos && c.datos.unidad === "UI/kg" ? "UI/ml" : "mg/ml";

    let dosisMostrar = c.dosisTexto ? escapeHtml(c.dosisTexto) : (c.datos ? "Introduce el peso del paciente" : "Sin pauta para esta especie");
    if (c.datos && c.dosisTexto && presentacionEfectiva) {
      const practico = formatearDosisPractica(c, presentacionEfectiva);
      dosisMostrar = `${escapeHtml(practico.texto)} <span class="protocolo-dosis-mgkg">(${escapeHtml(c.dosisTexto)})</span>`;
    }

    let bloqueConcentracion = "";
    if (c.datos && presentacionAuto) {
      bloqueConcentracion = `<p class="ayuda presentacion-detectada">📐 ${escapeHtml(etiquetaPresentacion(presentacionAuto))} (detectada automáticamente, no hace falta indicarla)</p>`;
    } else if (c.datos && elegida) {
      bloqueConcentracion = `
        <p class="ayuda presentacion-detectada">📐 ${escapeHtml(elegida.nombreProducto)}${elegida.presentacion ? " — " + escapeHtml(etiquetaPresentacion(elegida.presentacion)) : ""}
          <button type="button" class="boton-enlace protocolo-comp-cambiar" data-key="${escapeHtml(key)}">Cambiar</button>
        </p>` +
        (!elegida.presentacion ? `<div class="protocolo-concentracion">
          <label>No se detectó la concentración de "${escapeHtml(elegida.nombreProducto)}": indícala (${unidadConc})</label>
          <input type="number" step="0.01" min="0" class="protocolo-concentracion-input" data-idx="${idx}" placeholder="Ej. 10" />
        </div>` : "");
      if (!elegida.presentacion) faltaAlgunaConcentracion = true;
    } else if (c.datos) {
      faltaAlgunaConcentracion = true;
      bloqueConcentracion = `
        <div class="protocolo-comp-buscador campo-busqueda" data-key="${escapeHtml(key)}" data-principio-activo="${escapeHtml(obtenerPrincipioActivoRealComponente(componenteRaw) || c.nombre)}">
          <label>Busca el producto concreto (tu base de datos, CIMAVET o CIMA)</label>
          <input type="text" class="protocolo-comp-buscador-input" placeholder="Ej. ${escapeHtml(c.nombre)}" autocomplete="off" />
          <ul class="protocolo-comp-sugerencias sugerencias oculto"></ul>
        </div>
        <div class="protocolo-concentracion">
          <label>...o indica la concentración manualmente (${unidadConc})</label>
          <input type="number" step="0.01" min="0" class="protocolo-concentracion-input" data-idx="${idx}" placeholder="Ej. 10" />
        </div>`;
    }

    return `
    <div class="protocolo-componente">
      <span class="protocolo-componente-nombre">${escapeHtml(c.nombre)}</span>
      <span class="protocolo-componente-dosis">${dosisMostrar}</span>
      <span class="protocolo-componente-via">${c.datos ? escapeHtml(c.datos.via + " · " + c.datos.frecuencia) : ""}</span>
      ${bloqueConcentracion}
    </div>
  `;
  }).join("");

  return `
    <div class="tarjeta protocolo-card" data-id="${protocolo.id}" data-tipo="${esPersonalizado ? "custom" : "predefinido"}">
      <h3 class="titulo-tarjeta">${escapeHtml(protocolo.nombre)}${esPersonalizado ? ' <span class="tipo-tag tipo-tag-personalizado">Personalizado</span>' : ""}</h3>
      <p class="categoria">${escapeHtml(protocolo.indicacion)}</p>
      ${protocolo.notas ? `<p class="notas">${escapeHtml(protocolo.notas)}</p>` : ""}
      <div class="protocolo-componentes">${filasComponentes}</div>
      <button class="boton-primario boton-protocolo" data-id="${protocolo.id}" data-tipo="${esPersonalizado ? "custom" : "predefinido"}" ${paciente.peso ? "" : "disabled"}>
        + Añadir todos al paciente
      </button>
      ${paciente.peso
        ? (faltaAlgunaConcentracion ? `<p class="ayuda">Indica la concentración de los fármacos que lo necesiten para poder añadirlos.</p>` : "")
        : `<p class="aviso-inline">Introduce el peso del paciente en la pestaña Calculadora para poder añadir este protocolo.</p>`}
      <div class="fila-botones-form">
        ${esPersonalizado
          ? `<button type="button" class="boton-secundario boton-editar-protocolo" data-id="${protocolo.id}">Editar</button>
             <button type="button" class="boton-secundario boton-eliminar-protocolo" data-id="${protocolo.id}">Eliminar</button>`
          : `<button type="button" class="boton-secundario boton-copiar-protocolo" data-id="${protocolo.id}">📋 Copiar y editar</button>
             <button type="button" class="boton-secundario boton-ocultar-protocolo" data-id="${protocolo.id}">🗑 Eliminar</button>`}
      </div>
    </div>
  `;
}

// Texto de búsqueda de un protocolo: nombre, indicación y los fármacos que lo componen
// (por principio activo y nombres comerciales), para poder filtrar por cualquiera de ellos.
function textoBusquedaProtocolo(protocolo) {
  const partes = [protocolo.nombre, protocolo.indicacion || ""];
  for (const componenteRaw of protocolo.componentes) {
    if (typeof componenteRaw === "string") {
      const farmaco = DRUGS.find((d) => d.id === componenteRaw);
      if (farmaco) partes.push(farmaco.principioActivo, ...(farmaco.nombresComerciales || []));
    } else if (componenteRaw) {
      partes.push(componenteRaw.nombre || "", componenteRaw.principioActivoReal || "");
    }
  }
  return normalizar(partes.join(" "));
}

function renderProtocolos() {
  if (!PROTOCOLS.length && !customProtocols.length) {
    protocolosListaEl.innerHTML = `<p class="placeholder">Todavía no hay ningún protocolo.</p>`;
    return;
  }

  const filtro = normalizar(protocolosBuscadorEl.value.trim());
  const coincide = (p) => !filtro || textoBusquedaProtocolo(p).includes(filtro);
  const customFiltrados = customProtocols.filter(coincide);
  const predefinidosFiltrados = PROTOCOLS.filter((p) => !protocolosOcultos.has(p.id)).filter(coincide);

  if (filtro && !customFiltrados.length && !predefinidosFiltrados.length) {
    protocolosListaEl.innerHTML = `<p class="placeholder">Ningún protocolo coincide con "${escapeHtml(protocolosBuscadorEl.value.trim())}".</p>`;
    return;
  }

  // Se muestran todos los protocolos que coinciden con el filtro, incluso los que no
  // aplican a la especie actual del paciente: esos quedan visibles pero bloqueados,
  // con un aviso, en vez de desaparecer silenciosamente de la lista.
  let html = "";
  if (customFiltrados.length) {
    html += `<h3 class="subtitulo-seccion">Tus protocolos personalizados</h3>`;
    html += customFiltrados.map(renderTarjetaProtocolo).join("");
  }
  if (predefinidosFiltrados.length) {
    if (customFiltrados.length) html += `<h3 class="subtitulo-seccion">Protocolos predefinidos</h3>`;
    html += predefinidosFiltrados.map(renderTarjetaProtocolo).join("");
  }
  protocolosListaEl.innerHTML = html;

  protocolosListaEl.querySelectorAll(".boton-protocolo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const protocolo = btn.dataset.tipo === "custom"
        ? customProtocols.find((p) => p.id === btn.dataset.id)
        : PROTOCOLS.find((p) => p.id === btn.dataset.id);
      aplicarProtocolo(protocolo, btn.closest(".protocolo-card"));
    });
  });
  protocolosListaEl.querySelectorAll(".boton-editar-protocolo").forEach((btn) => {
    btn.addEventListener("click", () => abrirFormularioProtocolo(customProtocols.find((p) => p.id === btn.dataset.id)));
  });
  // Un protocolo predefinido no se edita en el sitio (es el mismo para todos los
  // dispositivos): "Copiar y editar" abre el editor de protocolos personalizados con sus
  // mismos fármacos y dosis ya rellenados, para guardarlo como copia propia y modificable
  // (añadir/quitar/cambiar fármacos) sin tocar el protocolo original.
  protocolosListaEl.querySelectorAll(".boton-copiar-protocolo").forEach((btn) => {
    btn.addEventListener("click", () => {
      const protocolo = PROTOCOLS.find((p) => p.id === btn.dataset.id);
      if (!protocolo) return;
      abrirFormularioProtocolo({
        nombre: "Copia de " + protocolo.nombre,
        indicacion: protocolo.indicacion,
        especies: protocolo.especies,
        notas: protocolo.notas,
        componentes: protocolo.componentes.map((c) => convertirComponenteAEditable(c, protocolo.especies))
      });
      editandoProtocoloId = null; // se guarda como protocolo personalizado nuevo, no sobrescribe el original
    });
  });
  // Ocultar un protocolo PREDEFINIDO en este dispositivo (ver comentario en storage.js): no
  // borra nada del código compartido, solo deja de mostrarse aquí. Útil cuando hay varios
  // protocolos parecidos y solo se quiere usar uno, o si otro hospital usa esta misma base de
  // datos y quiere quitar protocolos que no le aplican. Se puede deshacer desde "Mi base de
  // datos" → Protocolos ocultados.
  protocolosListaEl.querySelectorAll(".boton-ocultar-protocolo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const protocolo = PROTOCOLS.find((p) => p.id === btn.dataset.id);
      if (!protocolo) return;
      if (!confirm(`¿Eliminar "${protocolo.nombre}" de tu lista de protocolos? Solo se ocultará en este dispositivo (no se borra del código compartido ni afecta a otros dispositivos); puedes recuperarlo luego desde "Mi base de datos".`)) return;
      await dbPut("protocolosOcultos", { id: protocolo.id, nombre: protocolo.nombre });
      await cargarProtocolosOcultos();
      renderProtocolos();
      if (typeof renderProtocolosOcultos === "function") renderProtocolosOcultos();
    });
  });
  protocolosListaEl.querySelectorAll(".boton-eliminar-protocolo").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este protocolo personalizado?")) return;
      await dbDelete("customProtocols", btn.dataset.id);
      await cargarCustomProtocols();
      renderProtocolos();
    });
  });

  // Buscador de producto concreto (CIMAVET/CIMA/tu base de datos) para cada componente
  // que aún no tiene una concentración detectada automáticamente ni elegida por el usuario.
  protocolosListaEl.querySelectorAll(".protocolo-comp-buscador").forEach((div) => {
    const key = div.dataset.key;
    const input = div.querySelector(".protocolo-comp-buscador-input");
    const sugerenciasEl = div.querySelector(".protocolo-comp-sugerencias");
    let debounceTimer = null;
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const texto = input.value.trim();
      if (texto.length < 3) {
        sugerenciasEl.innerHTML = "";
        sugerenciasEl.classList.add("oculto");
        return;
      }
      debounceTimer = setTimeout(() => buscarProductoParaComponenteProtocolo(texto, key, div), 400);
    });
    input.addEventListener("focus", () => {
      if (sugerenciasEl.innerHTML && input.value.trim().length >= 3) sugerenciasEl.classList.remove("oculto");
    });
  });
  protocolosListaEl.querySelectorAll(".protocolo-comp-cambiar").forEach((btn) => {
    btn.addEventListener("click", () => {
      delete protocoloPresentacionesElegidas[btn.dataset.key];
      renderProtocolos();
    });
  });
}

// Cierra cualquier desplegable de sugerencias de producto (buscador por componente de
// protocolo) si se hace clic fuera de su campo de búsqueda.
document.addEventListener("click", (e) => {
  document.querySelectorAll(".protocolo-comp-sugerencias:not(.oculto)").forEach((ul) => {
    const wrap = ul.closest(".protocolo-comp-buscador");
    if (wrap && !wrap.contains(e.target)) ul.classList.add("oculto");
  });
});

function aplicarProtocolo(protocolo, cardEl) {
  if (!protocolo || !paciente.peso) return;
  if (!protocolo.especies.includes(paciente.especie)) {
    alert(`Este protocolo es solo para ${etiquetaEspecies(protocolo.especies)} y no se puede aplicar a un paciente de especie "${paciente.especie === "gato" ? "Gato" : "Perro"}".`);
    return;
  }
  const faltanConcentracion = [];
  protocolo.componentes.forEach((componenteRaw, idx) => {
    const c = calcularComponenteProtocolo(componenteRaw);
    if (!c || !c.datos || !c.dosisTexto) return;

    const key = protocolo.id + "::" + idx;
    const presentacionAuto = obtenerPresentacionComponente(componenteRaw);
    const elegida = protocoloPresentacionesElegidas[key];
    let presentacion = presentacionAuto || (elegida && elegida.presentacion) || null;

    if (!presentacion) {
      const input = cardEl.querySelector(`.protocolo-concentracion-input[data-idx="${idx}"]`);
      const valor = input ? parseFloat(input.value) : NaN;
      if (!valor || valor <= 0) {
        faltanConcentracion.push(c.nombre);
        return;
      }
      presentacion = { tipo: "liquido", valor, unidad: c.datos.unidad === "UI/kg" ? "UI/ml" : "mg/ml" };
    }

    const { texto: dosisTextoFinal, detalle: detalleBase } = formatearDosisPractica(c, presentacion);
    const detalleFinal = elegida && elegida.nombreProducto ? `${detalleBase} · Producto: ${elegida.nombreProducto}` : detalleBase;

    añadirAlPaciente({
      principioActivo: c.nombre,
      principioActivoReal: obtenerPrincipioActivoRealComponente(componenteRaw),
      categoria: obtenerCategoriaComponente(componenteRaw),
      dosisTexto: dosisTextoFinal,
      detalle: detalleFinal,
      origen: "Protocolo: " + protocolo.nombre
    });
  });
  if (faltanConcentracion.length) {
    alert("No se han añadido al paciente (falta indicar su concentración): " + faltanConcentracion.join(", "));
  }
}

// ---- Formulario de protocolo personalizado ----
const nuevoProtocoloBoton = document.getElementById("nuevo-protocolo-boton");
const formularioProtocoloEl = document.getElementById("formulario-protocolo");
const formularioProtocoloTituloEl = document.getElementById("formulario-protocolo-titulo");
const cpNombreInput = document.getElementById("cp-nombre");
const cpIndicacionInput = document.getElementById("cp-indicacion");
const cpEspeciePerro = document.getElementById("cp-especie-perro");
const cpEspecieGato = document.getElementById("cp-especie-gato");
const cpNotasInput = document.getElementById("cp-notas");
const cpComponentesLista = document.getElementById("cp-componentes-lista");
const cpAnadirComponente = document.getElementById("cp-anadir-componente");
const cpGuardar = document.getElementById("cp-guardar");
const cpCancelar = document.getElementById("cp-cancelar");

let editandoProtocoloId = null;

nuevoProtocoloBoton.addEventListener("click", () => abrirFormularioProtocolo());
cpCancelar.addEventListener("click", cerrarFormularioProtocolo);
cpAnadirComponente.addEventListener("click", () => cpComponentesLista.appendChild(crearFilaComponenteProtocolo()));

function abrirFormularioProtocolo(protocolo) {
  editandoProtocoloId = protocolo ? protocolo.id : null;
  formularioProtocoloTituloEl.textContent = protocolo ? "Editar protocolo" : "Nuevo protocolo";
  cpNombreInput.value = protocolo ? protocolo.nombre : "";
  cpIndicacionInput.value = protocolo ? (protocolo.indicacion || "") : "";
  cpEspeciePerro.checked = protocolo ? protocolo.especies.includes("perro") : true;
  cpEspecieGato.checked = protocolo ? protocolo.especies.includes("gato") : true;
  cpNotasInput.value = protocolo ? (protocolo.notas || "") : "";
  cpComponentesLista.innerHTML = "";

  if (protocolo && protocolo.componentes.length) {
    protocolo.componentes.forEach((c) => cpComponentesLista.appendChild(crearFilaComponenteProtocolo(c)));
  } else {
    cpComponentesLista.appendChild(crearFilaComponenteProtocolo());
  }

  formularioProtocoloEl.classList.remove("oculto");
  formularioProtocoloEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarFormularioProtocolo() {
  formularioProtocoloEl.classList.add("oculto");
  editandoProtocoloId = null;
}

function etiquetaFuente(fuente) {
  if (fuente === "local") return "tu base de datos";
  if (fuente === "cimavet") return "CIMAVET (veterinario)";
  if (fuente === "cima") return "CIMA (uso humano)";
  return "";
}

function crearFilaComponenteProtocolo(datos) {
  const div = document.createElement("div");
  div.className = "patologia-fila";
  div.dataset.fuente = (datos && datos.fuente) || "";
  div.innerHTML = `
    <div class="campo campo-busqueda">
      <label>Fármaco</label>
      <input type="text" class="cpf-nombre" placeholder="Busca en tu base de datos, CIMAVET o CIMA..." autocomplete="off" />
      <ul class="cpf-sugerencias sugerencias oculto"></ul>
      <p class="cpf-fuente-texto ayuda"></p>
    </div>
    <div class="fila">
      <div class="campo"><label>Dosis mín. (por kg)</label><input type="number" class="cpf-min" step="any" /></div>
      <div class="campo"><label>Dosis máx. (por kg)</label><input type="number" class="cpf-max" step="any" /></div>
    </div>
    <div class="fila">
      <div class="campo"><label>Unidad</label>
        <select class="cpf-unidad">
          <option value="mg/kg">mg/kg</option>
          <option value="mcg/kg">µg/kg (mcg/kg)</option>
          <option value="UI/kg">UI/kg</option>
        </select>
      </div>
      <div class="campo"><label>Vía</label><input type="text" class="cpf-via" placeholder="Ej. IV/IM" /></div>
    </div>
    <div class="campo"><label>Frecuencia</label><input type="text" class="cpf-frecuencia" placeholder="Ej. dosis única" /></div>
    <div class="campo"><label>Notas (opcional)</label><input type="text" class="cpf-notas" /></div>
    <button type="button" class="boton-eliminar-patologia cpf-quitar">✕ Quitar este fármaco</button>
  `;

  const nombreInput = div.querySelector(".cpf-nombre");
  const sugerenciasEl = div.querySelector(".cpf-sugerencias");
  const fuenteTextoEl = div.querySelector(".cpf-fuente-texto");

  div.dataset.presentacion = (datos && datos.presentacion) ? JSON.stringify(datos.presentacion) : "";
  div.dataset.categoria = (datos && datos.categoria) || "";
  div.dataset.principioActivoReal = (datos && datos.principioActivoReal) || "";

  if (datos) {
    nombreInput.value = datos.nombre || "";
    div.querySelector(".cpf-min").value = datos.dosisMin ?? "";
    div.querySelector(".cpf-max").value = datos.dosisMax ?? "";
    div.querySelector(".cpf-unidad").value = datos.unidad || "mg/kg";
    div.querySelector(".cpf-via").value = datos.via || "";
    div.querySelector(".cpf-frecuencia").value = datos.frecuencia || "";
    div.querySelector(".cpf-notas").value = datos.notas || "";
    if (datos.fuente) {
      fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(datos.fuente) +
        (datos.presentacion ? ` · ${etiquetaPresentacion(datos.presentacion)} (detectada automáticamente)` : "");
    }
  }

  let debounceTimer = null;
  nombreInput.addEventListener("input", () => {
    div.dataset.fuente = "";
    div.dataset.presentacion = "";
    fuenteTextoEl.textContent = "";
    clearTimeout(debounceTimer);
    const texto = nombreInput.value.trim();
    if (texto.length < 3) {
      sugerenciasEl.innerHTML = "";
      sugerenciasEl.classList.add("oculto");
      return;
    }
    debounceTimer = setTimeout(() => buscarParaComponenteProtocolo(texto, div), 400);
  });
  nombreInput.addEventListener("focus", () => {
    if (sugerenciasEl.innerHTML && nombreInput.value.trim().length >= 3) {
      sugerenciasEl.classList.remove("oculto");
    }
  });
  document.addEventListener("click", (e) => {
    if (!sugerenciasEl.contains(e.target) && e.target !== nombreInput) sugerenciasEl.classList.add("oculto");
  });

  div.querySelector(".cpf-quitar").addEventListener("click", () => div.remove());
  return div;
}

async function buscarParaComponenteProtocolo(texto, filaEl) {
  const nombreInput = filaEl.querySelector(".cpf-nombre");
  const sugerenciasEl = filaEl.querySelector(".cpf-sugerencias");
  const fuenteTextoEl = filaEl.querySelector(".cpf-fuente-texto");

  sugerenciasEl.innerHTML = `<li class="sugerencia-info">Buscando en tu base de datos, CIMAVET y CIMA...</li>`;
  sugerenciasEl.classList.remove("oculto");

  const localResultados = buscarLocal(texto).slice(0, 6);
  let cimavetResultados = [], cimaResultados = [];
  try {
    const data = await buscarCimavet(texto, 20);
    cimavetResultados = (data.resultados || []).slice(0, 6);
  } catch (e) { /* si CIMAVET falla, seguimos con lo demás */ }
  try {
    const data = await buscarCima(texto);
    cimaResultados = (data.resultados || []).slice(0, 6);
  } catch (e) { /* si CIMA falla, seguimos con lo demás */ }

  // Si el usuario ha seguido escribiendo mientras llegaban los resultados, se descartan.
  if (nombreInput.value.trim() !== texto) return;

  const items = [
    ...localResultados.map((r) => ({
      nombre: r.termino, fuente: "local",
      detalle: r.farmaco.principioActivo !== r.termino ? r.farmaco.principioActivo : (r.farmaco.categoria || ""),
      presentacion: null, farmaco: r.farmaco,
      categoria: r.farmaco.categoria, principioActivoReal: r.farmaco.principioActivo
    })),
    ...cimavetResultados.map((m) => ({
      nombre: m.nombre, fuente: "cimavet", detalle: m.labtitular || "",
      presentacion: extraerPresentacionMed(m),
      categoria: null, principioActivoReal: m.pactivos || (m.principiosActivos || []).map((p) => p.nombre).join(", ")
    })),
    ...cimaResultados.map((m) => ({
      nombre: m.nombre, fuente: "cima", detalle: m.labtitular || "",
      presentacion: extraerPresentacionMed(m),
      categoria: null, principioActivoReal: m.vtm ? m.vtm.nombre : null
    }))
  ];

  if (!items.length) {
    sugerenciasEl.innerHTML = `<li class="sugerencia-info">Sin resultados. Puedes escribir el nombre igualmente.</li>`;
    return;
  }

  sugerenciasEl.innerHTML = items.map((it, i) => `
    <li data-idx="${i}">
      <span class="termino">${escapeHtml(it.nombre)}</span>
      <span class="tipo-tag ${it.fuente === "local" ? "tipo-tag-personalizado" : ""}">${escapeHtml(etiquetaFuente(it.fuente))}</span>
      ${it.detalle ? `<span class="submeta">${escapeHtml(it.detalle)}</span>` : ""}
      ${it.presentacion ? `<span class="submeta">📐 ${escapeHtml(etiquetaPresentacion(it.presentacion))} — se rellenará solo</span>` : ""}
    </li>
  `).join("");

  sugerenciasEl.querySelectorAll("li[data-idx]").forEach((li) => {
    li.addEventListener("click", async () => {
      const it = items[Number(li.dataset.idx)];
      nombreInput.value = it.nombre;
      filaEl.dataset.fuente = it.fuente;
      filaEl.dataset.presentacion = it.presentacion ? JSON.stringify(it.presentacion) : "";
      filaEl.dataset.categoria = it.categoria || "";
      filaEl.dataset.principioActivoReal = it.principioActivoReal || "";
      fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente) +
        (it.presentacion ? ` · ${etiquetaPresentacion(it.presentacion)} (detectada automáticamente)` : "");
      sugerenciasEl.classList.add("oculto");

      // Un fármaco de "tu base de datos" no tiene una concentración propia (es un
      // principio activo, no un producto concreto): buscamos en CIMAVET si hay una
      // única presentación inequívoca para rellenarla igualmente sin preguntar.
      if (it.fuente === "local" && it.farmaco) {
        fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente) + " · buscando su concentración en CIMAVET...";
        try {
          const data = await buscarCimavet(principioActivoCorto(it.farmaco), 100);
          if (nombreInput.value !== it.nombre) return; // el usuario ha cambiado de selección mientras tanto
          const presentaciones = extraerPresentaciones(data.resultados || []);
          if (presentaciones.length === 1) {
            filaEl.dataset.presentacion = JSON.stringify(presentaciones[0]);
            fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente) + ` · ${etiquetaPresentacion(presentaciones[0])} (detectada automáticamente en CIMAVET)`;
          } else if (presentaciones.length > 1) {
            fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente) + " · CIMAVET tiene varias concentraciones para este principio activo; indícala manualmente abajo.";
          } else {
            fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente) + " · no se ha encontrado una concentración en CIMAVET; indícala manualmente abajo.";
          }
        } catch (e) {
          fuenteTextoEl.textContent = "Fuente: " + etiquetaFuente(it.fuente);
        }
      }
    });
  });
}

// ---- Buscador de producto concreto para un componente de un protocolo YA CREADO ----
// (a diferencia de buscarParaComponenteProtocolo, que sirve para definir un componente nuevo
// al crear/editar un protocolo personalizado, esta busca solo la PRESENTACIÓN/concentración
// de un producto concreto para una dosis mg/kg que ya está fijada, y no toca esa dosis).
async function buscarProductoParaComponenteProtocolo(texto, key, contenedorEl) {
  const input = contenedorEl.querySelector(".protocolo-comp-buscador-input");
  const sugerenciasEl = contenedorEl.querySelector(".protocolo-comp-sugerencias");

  sugerenciasEl.innerHTML = `<li class="sugerencia-info">Buscando en tu base de datos, CIMAVET y CIMA...</li>`;
  sugerenciasEl.classList.remove("oculto");

  const localResultados = buscarLocal(texto).slice(0, 6);
  let cimavetResultados = [];
  try {
    const data = await buscarCimavet(texto, 30);
    // Descarta primero productos que no sean para perros/gatos (premezclas para pollos,
    // productos de caballos/rumiantes, etc.) para que no desplacen a los que sí interesan.
    cimavetResultados = filtrarCimavetPorEspecie(data.resultados || []).slice(0, 10);
  } catch (e) { /* si CIMAVET falla, seguimos con lo demás */ }

  // CIMA (medicina humana) se consulta SIEMPRE, no solo cuando CIMAVET no tiene nada: hay
  // fármacos con presentación veterinaria autorizada pero solo en una vía/forma (ej. fenobarbital
  // veterinario es oral únicamente), y para una urgencia puede hacer falta la vía inyectable de
  // uso humano aunque exista un producto veterinario oral. Mezclar ambas fuentes es justo lo que
  // se necesita aquí, igual que en el buscador general de CIMAVET y CIMA.
  let cimaResultados = [];
  try {
    const data = await buscarCima(texto);
    cimaResultados = (data.resultados || []).slice(0, 8);
  } catch (e) { /* si CIMA falla, seguimos con lo demás */ }

  if (input.value.trim() !== texto) return; // el usuario ha seguido escribiendo mientras tanto

  let items = [
    ...localResultados.map((r) => ({
      nombre: r.termino, fuente: "local",
      detalle: r.farmaco.principioActivo !== r.termino ? r.farmaco.principioActivo : (r.farmaco.categoria || ""),
      presentacion: null
    })),
    ...cimavetResultados.map((m) => {
      const especies = (m.especies || []).map((e) => e.nombre).join(", ");
      return {
        nombre: m.nombre, fuente: "cimavet",
        detalle: [m.labtitular || "", especies].filter(Boolean).join(" · "),
        presentacion: extraerPresentacionMed(m)
      };
    }),
    ...cimaResultados.map((m) => ({
      nombre: m.nombre, fuente: "cima", detalle: m.labtitular || "",
      presentacion: extraerPresentacionMed(m)
    }))
  ];

  if (!items.length) {
    sugerenciasEl.innerHTML = `<li class="sugerencia-info">Sin resultados en tu base de datos, CIMAVET ni CIMA para "${escapeHtml(texto)}".</li>`;
    return;
  }

  // Los resultados de "tu base de datos" (principio activo genérico, sin producto concreto)
  // nunca traen concentración detectable, así que si van primero tapan justo los resultados
  // de CIMAVET/CIMA que sí permiten calcular el volumen solos. Se anteponen aquí los que
  // tienen presentación detectada (orden estable: no reordena dentro de cada grupo).
  items.sort((a, b) => (a.presentacion ? 0 : 1) - (b.presentacion ? 0 : 1));

  const principioActivoParaFavoritos = contenedorEl.dataset.principioActivo || texto;
  const { lista: itemsOrdenados, esFavorito } = marcarYOrdenarFavoritos(items, principioActivoParaFavoritos);
  items = itemsOrdenados;

  sugerenciasEl.innerHTML = items.map((it, i) => `
    <li data-idx="${i}">
      <span class="termino">${esFavorito(it.nombre) ? "⭐ " : ""}${escapeHtml(it.nombre)}</span>
      <span class="tipo-tag ${it.fuente === "local" ? "tipo-tag-personalizado" : ""}">${escapeHtml(etiquetaFuente(it.fuente))}</span>
      ${it.detalle ? `<span class="submeta">${escapeHtml(it.detalle)}</span>` : ""}
      ${it.presentacion
        ? `<span class="submeta">📐 ${escapeHtml(etiquetaPresentacion(it.presentacion))} — se calculará solo</span>`
        : `<span class="submeta">Concentración no detectada automáticamente: habrá que indicarla a mano</span>`}
    </li>
  `).join("");

  sugerenciasEl.querySelectorAll("li[data-idx]").forEach((li) => {
    li.addEventListener("click", () => {
      const it = items[Number(li.dataset.idx)];
      protocoloPresentacionesElegidas[key] = { presentacion: it.presentacion, nombreProducto: it.nombre, fuente: it.fuente };
      // renderProtocolos() regenera todo el HTML de la lista de protocolos, incluidos los
      // campos de "indica la concentración manualmente" de TODOS los demás componentes que
      // aún no tienen un producto elegido — sin este guardado/restaurado, elegir un producto
      // para un fármaco borraba silenciosamente cualquier concentración ya escrita a mano en
      // otro fármaco del mismo protocolo (había que volver a escribirla, o directamente
      // parecía que "no calculaba" al pulsar "Añadir todos al paciente").
      const valoresGuardados = capturarConcentracionesManualesProtocolos();
      renderProtocolos();
      restaurarConcentracionesManualesProtocolos(valoresGuardados);
    });
  });
}

// Ver comentario en el listener de selección de producto de arriba: preserva lo que el
// usuario ya haya escrito en los campos de concentración manual de CUALQUIER protocolo/
// componente visible, para restaurarlo tras un renderProtocolos() disparado por elegir un
// producto en OTRO componente distinto.
function capturarConcentracionesManualesProtocolos() {
  const valores = {};
  protocolosListaEl.querySelectorAll(".protocolo-card").forEach((card) => {
    card.querySelectorAll(".protocolo-concentracion-input").forEach((input) => {
      if (input.value) valores[card.dataset.id + "::" + input.dataset.idx] = input.value;
    });
  });
  return valores;
}

function restaurarConcentracionesManualesProtocolos(valores) {
  protocolosListaEl.querySelectorAll(".protocolo-card").forEach((card) => {
    card.querySelectorAll(".protocolo-concentracion-input").forEach((input) => {
      const guardado = valores[card.dataset.id + "::" + input.dataset.idx];
      if (guardado != null) input.value = guardado;
    });
  });
}

cpGuardar.addEventListener("click", async () => {
  const nombre = cpNombreInput.value.trim();
  if (!nombre) { alert("Indica un nombre para el protocolo."); return; }

  const especies = [];
  if (cpEspeciePerro.checked) especies.push("perro");
  if (cpEspecieGato.checked) especies.push("gato");
  if (!especies.length) { alert("Selecciona al menos una especie."); return; }

  const componentes = [];
  cpComponentesLista.querySelectorAll(".patologia-fila").forEach((fila) => {
    const nombreFarmaco = fila.querySelector(".cpf-nombre").value.trim();
    const min = parseFloat(fila.querySelector(".cpf-min").value);
    const max = parseFloat(fila.querySelector(".cpf-max").value);
    if (!nombreFarmaco || isNaN(min) || isNaN(max)) return;
    componentes.push({
      nombre: nombreFarmaco,
      fuente: fila.dataset.fuente || "manual",
      presentacion: fila.dataset.presentacion ? JSON.parse(fila.dataset.presentacion) : null,
      categoria: fila.dataset.categoria || null,
      principioActivoReal: fila.dataset.principioActivoReal || null,
      dosisMin: min,
      dosisMax: max,
      unidad: fila.querySelector(".cpf-unidad").value,
      via: fila.querySelector(".cpf-via").value.trim() || "-",
      frecuencia: fila.querySelector(".cpf-frecuencia").value.trim() || "-",
      notas: fila.querySelector(".cpf-notas").value.trim()
    });
  });
  if (!componentes.length) {
    alert("Añade al menos un fármaco completo (nombre, dosis mín. y máx. por kg).");
    return;
  }

  const protocolo = {
    id: editandoProtocoloId || ("protocolo-" + generarId()),
    nombre,
    indicacion: cpIndicacionInput.value.trim() || "Personalizado",
    especies,
    notas: cpNotasInput.value.trim(),
    componentes,
    personalizado: true
  };

  await dbPut("customProtocols", protocolo);
  await cargarCustomProtocols();
  cerrarFormularioProtocolo();
  renderProtocolos();
});

// ============================================================
// CRI — Infusión a ritmo constante (Constant Rate Infusion)
// Dos calculadoras independientes que comparten la misma fórmula:
//   dosis total por minuto (mg o UI) = dosis por kg y minuto × peso
//   ml/h = (dosis total por minuto × 60) / concentración de la mezcla (por ml)
// La única diferencia es qué dato se conoce (la concentración ya preparada, o el
// ritmo de la bomba ya fijado) y cuál se despeja.
// ============================================================

// Factor para convertir cada unidad de dosis a "por kg y por minuto" (misma familia,
// mg o UI, que la unidad del fármaco elegida). Todas las unidades mg-family se muestran
// si se elige "mg"; las UI-family, si se elige "UI".
const CRI_UNIDADES_DOSIS = {
  mg: [
    { value: "mcgkgmin", label: "µg/kg/min", factor: 1 / 1000 },
    { value: "mcgkgh", label: "µg/kg/h", factor: 1 / 1000 / 60 },
    { value: "mgkgmin", label: "mg/kg/min", factor: 1 },
    { value: "mgkgh", label: "mg/kg/h", factor: 1 / 60 },
    { value: "mgkgdia", label: "mg/kg/día", factor: 1 / 1440 }
  ],
  UI: [
    { value: "uikgmin", label: "UI/kg/min", factor: 1 },
    { value: "mukgmin", label: "mU/kg/min", factor: 1 / 1000 },
    { value: "uikgh", label: "UI/kg/h", factor: 1 / 60 },
    { value: "uikgdia", label: "UI/kg/día", factor: 1 / 1440 }
  ]
};

function poblarUnidadesDosisCri(selectUnidadFarmaco, selectDosisUnidad) {
  const opciones = CRI_UNIDADES_DOSIS[selectUnidadFarmaco.value] || CRI_UNIDADES_DOSIS.mg;
  const valorPrevio = selectDosisUnidad.value;
  selectDosisUnidad.innerHTML = opciones.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
  if (opciones.some((o) => o.value === valorPrevio)) selectDosisUnidad.value = valorPrevio;
}

function factorDosisCri(unidadFarmaco, dosisUnidadValue) {
  const opciones = CRI_UNIDADES_DOSIS[unidadFarmaco] || CRI_UNIDADES_DOSIS.mg;
  const opcion = opciones.find((o) => o.value === dosisUnidadValue);
  return opcion ? opcion.factor : null;
}

const criAvisoPesoEl = document.getElementById("cri-aviso-peso");

const criANombreInput = document.getElementById("cri-a-nombre");
const criASugerenciasEl = document.getElementById("cri-a-sugerencias");
const criAConcentracionEstadoEl = document.getElementById("cri-a-concentracion-estado");
const criAUnidadFarmacoSelect = document.getElementById("cri-a-unidad-farmaco");
const criAConcVialInput = document.getElementById("cri-a-conc-vial");
const criAVolExtraidoInput = document.getElementById("cri-a-vol-extraido");
const criAVolTotalInput = document.getElementById("cri-a-vol-total");
const criADosisValorInput = document.getElementById("cri-a-dosis-valor");
const criADosisUnidadSelect = document.getElementById("cri-a-dosis-unidad");
const criAResultadoEl = document.getElementById("cri-a-resultado");

const criBNombreInput = document.getElementById("cri-b-nombre");
const criBSugerenciasEl = document.getElementById("cri-b-sugerencias");
const criBConcentracionEstadoEl = document.getElementById("cri-b-concentracion-estado");
const criBUnidadFarmacoSelect = document.getElementById("cri-b-unidad-farmaco");
const criBConcVialInput = document.getElementById("cri-b-conc-vial");
const criBRitmoInput = document.getElementById("cri-b-ritmo");
const criBVolTotalInput = document.getElementById("cri-b-vol-total");
const criBDosisValorInput = document.getElementById("cri-b-dosis-valor");
const criBDosisUnidadSelect = document.getElementById("cri-b-dosis-unidad");
const criBResultadoEl = document.getElementById("cri-b-resultado");

poblarUnidadesDosisCri(criAUnidadFarmacoSelect, criADosisUnidadSelect);
poblarUnidadesDosisCri(criBUnidadFarmacoSelect, criBDosisUnidadSelect);
criAUnidadFarmacoSelect.addEventListener("change", () => { poblarUnidadesDosisCri(criAUnidadFarmacoSelect, criADosisUnidadSelect); calcularCriA(); });
criBUnidadFarmacoSelect.addEventListener("change", () => { poblarUnidadesDosisCri(criBUnidadFarmacoSelect, criBDosisUnidadSelect); calcularCriB(); });

// ---- Buscador de fármaco para CRI (CIMAVET primero, CIMA como respaldo si no hay nada) ----
// La mayoría de fármacos usados en CRI (fentanilo, ketamina, dopamina, nitroprusiato...) son
// de uso humano, así que aquí SIEMPRE tiene sentido buscar en CIMA aunque haya resultados en
// CIMAVET (a diferencia del buscador de protocolos, donde CIMA es solo un respaldo puro).
// Al elegir un producto se detecta su concentración líquida (mg/ml o UI/ml) automáticamente;
// las presentaciones sólidas (comprimidos/cápsulas) no sirven para una infusión IV, así que
// en ese caso se avisa en vez de rellenar nada.
function crearBuscadorFarmacoCri(nombreInput, sugerenciasEl, estadoEl, unidadFarmacoSelect, dosisUnidadSelect, concVialInput, recalcular, dosisValorInput, notasEl) {
  let debounceTimer = null;
  nombreInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const texto = nombreInput.value.trim();
    estadoEl.textContent = "";
    if (texto.length < 3) {
      sugerenciasEl.innerHTML = "";
      sugerenciasEl.classList.add("oculto");
      return;
    }
    debounceTimer = setTimeout(() => buscarFarmacoParaCri(texto, { nombreInput, sugerenciasEl, estadoEl, unidadFarmacoSelect, dosisUnidadSelect, concVialInput, recalcular, dosisValorInput, notasEl }), 400);
  });
  nombreInput.addEventListener("focus", () => {
    if (sugerenciasEl.innerHTML && nombreInput.value.trim().length >= 3) sugerenciasEl.classList.remove("oculto");
  });
}

// Fármacos de la tabla de CRI (CRI_FARMACOS_UCI) cuyo principio activo coincide con el del producto
// elegido (ej. SEGURIL -> furosemida).
function pautasCriDeProducto(it) {
  const tokens = normalizar(`${it.principio || ""} ${it.nombre || ""}`).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !/^\d/.test(w));
  const vistas = new Set();
  const res = [];
  for (const f of CRI_FARMACOS_UCI) {
    const n = normalizar(f.nombre);
    if (tokens.some((t) => n.includes(t)) && !vistas.has(f.nombre)) { vistas.add(f.nombre); res.push(f); }
  }
  return res;
}

// Sugiere la dosis de CRI de la guía para el producto elegido: rellena unidad, dosis (punto medio)
// y notas, y lista el resto de pautas del mismo fármaco.
function sugerirDosisCri(it, ctx) {
  const { unidadFarmacoSelect, dosisUnidadSelect, dosisValorInput, notasEl, estadoEl } = ctx;
  if (!dosisValorInput) return;
  const pautas = pautasCriDeProducto(it);
  if (!pautas.length) return;
  const esp = paciente.especie;
  const aplicable = (f) => f.dosis.ambas || f.dosis[esp];
  const f = pautas.find(aplicable) || pautas[0];
  const rango = f.dosis.ambas || f.dosis[esp] || f.dosis.perro || f.dosis.gato;
  const unidadDetectada = it.presentacion && it.presentacion.tipo === "liquido" ? (it.presentacion.unidad === "UI/ml" ? "UI" : "mg") : null;
  if (unidadDetectada && unidadDetectada !== f.unidadFarmaco) return;
  unidadFarmacoSelect.value = f.unidadFarmaco;
  poblarUnidadesDosisCri(unidadFarmacoSelect, dosisUnidadSelect);
  dosisUnidadSelect.value = f.dosisUnidad;
  dosisValorInput.value = (rango.min + rango.max) / 2;
  const etiqueta = dosisUnidadSelect.selectedOptions[0].textContent;
  const otras = pautas.filter((x) => x !== f).map((x) => x.nombre).join(", ");
  const texto = `💡 Dosis de CRI sugerida (tabla de CRI, ${f.nombre}): ${formatNum(rango.min)}${rango.min === rango.max ? "" : "-" + formatNum(rango.max)} ${etiqueta}${rango.min === rango.max ? "" : " (se ha puesto el punto medio)"}. ${f.notas}${otras ? " Otras pautas: " + otras + "." : ""}`;
  if (notasEl) notasEl.textContent = texto;
  else estadoEl.textContent += ` ${texto}`;
}

async function buscarFarmacoParaCri(texto, ctx) {
  const { nombreInput, sugerenciasEl, estadoEl, unidadFarmacoSelect, dosisUnidadSelect, concVialInput, recalcular, dosisValorInput, notasEl } = ctx;
  sugerenciasEl.innerHTML = `<li class="sugerencia-info">Buscando en CIMAVET y CIMA...</li>`;
  sugerenciasEl.classList.remove("oculto");

  let cimavetResultados = [];
  try {
    const data = await buscarCimavet(texto, 30);
    cimavetResultados = filtrarCimavetPorEspecie(data.resultados || []).slice(0, 10);
  } catch (e) { /* seguimos */ }

  let cimaResultados = [];
  try {
    const data = await buscarCima(texto);
    cimaResultados = (data.resultados || []).slice(0, 10);
  } catch (e) { /* seguimos */ }

  if (nombreInput.value.trim() !== texto) return; // el usuario ha seguido escribiendo mientras tanto

  let items = [
    ...cimavetResultados.map((m) => ({ nombre: m.nombre, fuente: "cimavet", detalle: m.labtitular || "", presentacion: extraerPresentacionMed(m), principio: m.pactivos || (m.principiosActivos || []).map((x) => x.nombre).join(" ") || "" })),
    ...cimaResultados.map((m) => ({ nombre: m.nombre, fuente: "cima", detalle: m.labtitular || "", presentacion: extraerPresentacionMed(m), principio: (m.vtm && m.vtm.nombre) || "" }))
  ];
  items.sort((a, b) => (esFavoritoCri(b.nombre) ? 1 : 0) - (esFavoritoCri(a.nombre) ? 1 : 0));

  if (!items.length) {
    sugerenciasEl.innerHTML = `<li class="sugerencia-info">Sin resultados en CIMAVET ni CIMA para "${escapeHtml(texto)}".</li>`;
    return;
  }

  sugerenciasEl.innerHTML = items.map((it, i) => {
    const esLiquido = it.presentacion && it.presentacion.tipo === "liquido";
    const esFav = esFavoritoCri(it.nombre);
    return `
    <li data-idx="${i}">
      <button type="button" class="cri-favorito-boton${esFav ? " es-favorito" : ""}" data-nombre="${escapeHtml(it.nombre)}" title="${esFav ? "Quitar de favoritos" : "Marcar como favorito para pedir siempre este a la farmacia"}">${esFav ? "⭐" : "☆"}</button>
      <span class="termino">${escapeHtml(it.nombre)}</span>
      <span class="tipo-tag">${escapeHtml(etiquetaFuente(it.fuente))}</span>
      ${it.detalle ? `<span class="submeta">${escapeHtml(it.detalle)}</span>` : ""}
      ${esLiquido
        ? `<span class="submeta">📐 ${escapeHtml(etiquetaPresentacion(it.presentacion))} — se rellenará solo</span>`
        : `<span class="submeta">⚠ No es una presentación líquida detectada; para CRI hace falta el vial inyectable, indica la concentración a mano</span>`}
    </li>`;
  }).join("");

  sugerenciasEl.querySelectorAll(".cri-favorito-boton").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavoritoCri(btn.dataset.nombre);
      buscarFarmacoParaCri(texto, ctx); // re-pinta con el orden/estrella actualizados
    });
  });

  sugerenciasEl.querySelectorAll("li[data-idx]").forEach((li) => {
    li.addEventListener("click", (e) => {
      if (e.target.closest(".cri-favorito-boton")) return;
      const it = items[Number(li.dataset.idx)];
      nombreInput.value = it.nombre;
      sugerenciasEl.classList.add("oculto");
      if (it.presentacion && it.presentacion.tipo === "liquido") {
        unidadFarmacoSelect.value = it.presentacion.unidad === "UI/ml" ? "UI" : "mg";
        poblarUnidadesDosisCri(unidadFarmacoSelect, dosisUnidadSelect);
        concVialInput.value = it.presentacion.valor;
        estadoEl.textContent = `📐 Concentración detectada: ${etiquetaPresentacion(it.presentacion)} (${it.nombre}).`;
      } else {
        estadoEl.textContent = `⚠ No se ha detectado una concentración líquida para "${it.nombre}"; indícala manualmente si conoces el vial inyectable.`;
      }
      sugerirDosisCri(it, ctx);
      recalcular();
    });
  });
}

crearBuscadorFarmacoCri(criANombreInput, criASugerenciasEl, criAConcentracionEstadoEl, criAUnidadFarmacoSelect, criADosisUnidadSelect, criAConcVialInput, calcularCriA, criADosisValorInput, null);
crearBuscadorFarmacoCri(criBNombreInput, criBSugerenciasEl, criBConcentracionEstadoEl, criBUnidadFarmacoSelect, criBDosisUnidadSelect, criBConcVialInput, calcularCriB, criBDosisValorInput, null);

document.addEventListener("click", (e) => {
  [criASugerenciasEl, criBSugerenciasEl, criCSugerenciasEl].forEach((ul) => {
    if (!ul.classList.contains("oculto") && !ul.contains(e.target) && e.target !== ul.previousElementSibling) {
      ul.classList.add("oculto");
    }
  });
});

[criAConcVialInput, criAVolExtraidoInput, criAVolTotalInput, criADosisValorInput, criADosisUnidadSelect].forEach((el) => {
  el.addEventListener("input", calcularCriA);
  el.addEventListener("change", calcularCriA);
});
[criBConcVialInput, criBRitmoInput, criBVolTotalInput, criBDosisValorInput, criBDosisUnidadSelect].forEach((el) => {
  el.addEventListener("input", calcularCriB);
  el.addEventListener("change", calcularCriB);
});

function actualizarCri() {
  criAvisoPesoEl.classList.toggle("oculto", !!(paciente.peso && paciente.peso > 0));
  calcularCriA();
  calcularCriB();
  calcularCriC();
}

// Calculadora A: mezcla ya preparada (concentración conocida) -> ritmo de la bomba (ml/h)
function calcularCriA() {
  const peso = paciente.peso;
  const unidadFarmaco = criAUnidadFarmacoSelect.value;
  const concVial = parseFloat(criAConcVialInput.value);
  const volExtraido = parseFloat(criAVolExtraidoInput.value);
  const volTotal = parseFloat(criAVolTotalInput.value);
  const dosisValor = parseFloat(criADosisValorInput.value);
  const factor = factorDosisCri(unidadFarmaco, criADosisUnidadSelect.value);

  if (!peso || !concVial || !volExtraido || !volTotal || !dosisValor || !factor) {
    criAResultadoEl.classList.add("oculto");
    criAResultadoEl.innerHTML = "";
    return;
  }

  const cantidadAnadida = concVial * volExtraido;
  const concentracionFinal = cantidadAnadida / volTotal;
  const dosisPorKgMin = dosisValor * factor;
  const dosisTotalPorMin = dosisPorKgMin * peso;
  const ritmoMlH = (dosisTotalPorMin * 60) / concentracionFinal;

  if (!isFinite(ritmoMlH) || ritmoMlH <= 0) {
    criAResultadoEl.classList.add("oculto");
    criAResultadoEl.innerHTML = "";
    return;
  }

  criAResultadoEl.classList.remove("oculto");
  criAResultadoEl.innerHTML = `
    <div class="resultado-dosis">${formatNum(ritmoMlH)} ml/h</div>
    <div class="resultado-detalle">
      <span>Mezcla: ${formatNum(cantidadAnadida)} ${unidadFarmaco} en ${formatNum(volTotal)} ml → ${formatNum(concentracionFinal)} ${unidadFarmaco}/ml</span>
    </div>
    <div class="resultado-volumen">Programa la bomba/perfusor a <strong>${formatNum(ritmoMlH)} ml/h</strong> para un paciente de ${formatNum(peso)} kg.</div>
    <button class="boton-anadir" id="cri-a-anadir-boton">+ Añadir al paciente</button>
  `;
  document.getElementById("cri-a-anadir-boton").addEventListener("click", () => {
    añadirAlPaciente({
      principioActivo: criANombreInput.value.trim() || "CRI",
      principioActivoReal: criANombreInput.value.trim() || null,
      categoria: "CRI (infusión a ritmo constante)",
      dosisTexto: `${formatNum(ritmoMlH)} ml/h`,
      detalle: `Mezcla ${formatNum(cantidadAnadida)} ${unidadFarmaco} en ${formatNum(volTotal)} ml (${formatNum(concentracionFinal)} ${unidadFarmaco}/ml) · dosis ${dosisValor} ${criADosisUnidadSelect.selectedOptions[0].textContent}`,
      origen: "CRI"
    });
  });
}

// Calculadora B: ritmo de bomba ya fijado -> cuánto fármaco añadir a la bolsa/jeringa
function calcularCriB() {
  const peso = paciente.peso;
  const unidadFarmaco = criBUnidadFarmacoSelect.value;
  const ritmoMlH = parseFloat(criBRitmoInput.value);
  const volTotal = parseFloat(criBVolTotalInput.value);
  const dosisValor = parseFloat(criBDosisValorInput.value);
  const concVial = parseFloat(criBConcVialInput.value); // opcional
  const factor = factorDosisCri(unidadFarmaco, criBDosisUnidadSelect.value);

  if (!peso || !ritmoMlH || !volTotal || !dosisValor || !factor) {
    criBResultadoEl.classList.add("oculto");
    criBResultadoEl.innerHTML = "";
    return;
  }

  const dosisPorKgMin = dosisValor * factor;
  const dosisTotalPorMin = dosisPorKgMin * peso;
  const concentracionNecesaria = (dosisTotalPorMin * 60) / ritmoMlH; // por ml
  const cantidadAnadir = concentracionNecesaria * volTotal;
  const duracionHoras = volTotal / ritmoMlH;

  if (!isFinite(cantidadAnadir) || cantidadAnadir <= 0) {
    criBResultadoEl.classList.add("oculto");
    criBResultadoEl.innerHTML = "";
    return;
  }

  const volDelVialTexto = concVial ? ` (= ${formatNum(cantidadAnadir / concVial)} ml del vial de ${formatNum(concVial)} ${unidadFarmaco}/ml)` : "";

  criBResultadoEl.classList.remove("oculto");
  criBResultadoEl.innerHTML = `
    <div class="resultado-dosis">${formatNum(cantidadAnadir)} ${unidadFarmaco}</div>
    <div class="resultado-detalle">
      <span>Añadir a los ${formatNum(volTotal)} ml de la bolsa/jeringa${volDelVialTexto}</span>
    </div>
    <div class="resultado-volumen">A ${formatNum(ritmoMlH)} ml/h, la mezcla dura ${formatNum(duracionHoras)} h para un paciente de ${formatNum(peso)} kg.</div>
    <button class="boton-anadir" id="cri-b-anadir-boton">+ Añadir al paciente</button>
  `;
  document.getElementById("cri-b-anadir-boton").addEventListener("click", () => {
    añadirAlPaciente({
      principioActivo: criBNombreInput.value.trim() || "CRI",
      principioActivoReal: criBNombreInput.value.trim() || null,
      categoria: "CRI (infusión a ritmo constante)",
      dosisTexto: `${formatNum(cantidadAnadir)} ${unidadFarmaco}${volDelVialTexto}`,
      detalle: `Añadido a ${formatNum(volTotal)} ml, a pasar a ${formatNum(ritmoMlH)} ml/h · dosis ${dosisValor} ${criBDosisUnidadSelect.selectedOptions[0].textContent}`,
      origen: "CRI"
    });
  });
}

// ---- Calculadora C: preparar una jeringa/bolsa para que dure un tiempo determinado ----
// A diferencia de A (mezcla ya preparada -> ritmo) y B (ritmo ya fijado -> cantidad), aquí
// se parte de CUÁNTO SE QUIERE QUE DURE la preparación (horas) y de QUÉ VOLUMEN FINAL se
// va a usar (jeringa de un perfusor de 12/15/20/24/48 ml, bolsa de 100 ml...), y se calcula
// tanto el volumen de fármaco a extraer como el ritmo resultante de la bomba. Reutiliza el
// mismo sistema de unidades/factores que A y B (CRI_UNIDADES_DOSIS / factorDosisCri).
const criCNombreInput = document.getElementById("cri-c-nombre");
const criCSugerenciasEl = document.getElementById("cri-c-sugerencias");
const criCConcentracionEstadoEl = document.getElementById("cri-c-concentracion-estado");
const criCFarmacoListaSelect = document.getElementById("cri-c-farmaco-lista");
const criCFarmacoNotasEl = document.getElementById("cri-c-farmaco-notas");
const criCUnidadFarmacoSelect = document.getElementById("cri-c-unidad-farmaco");
const criCConcVialInput = document.getElementById("cri-c-conc-vial");
const criCDosisValorInput = document.getElementById("cri-c-dosis-valor");
const criCDosisUnidadSelect = document.getElementById("cri-c-dosis-unidad");
const criCDuracionInput = document.getElementById("cri-c-duracion");
const criCVolFinalInput = document.getElementById("cri-c-vol-final");
const criCResultadoEl = document.getElementById("cri-c-resultado");

poblarUnidadesDosisCri(criCUnidadFarmacoSelect, criCDosisUnidadSelect);
criCUnidadFarmacoSelect.addEventListener("change", () => { poblarUnidadesDosisCri(criCUnidadFarmacoSelect, criCDosisUnidadSelect); calcularCriC(); });

// El nombre del fármaco busca en vivo en CIMAVET/CIMA igual que en las calculadoras A y B,
// para poder enlazar con un producto real y detectar su concentración automáticamente; el
// desplegable de abajo es solo un atajo para precargar dosis/notas de la guía de CRI.
crearBuscadorFarmacoCri(criCNombreInput, criCSugerenciasEl, criCConcentracionEstadoEl, criCUnidadFarmacoSelect, criCDosisUnidadSelect, criCConcVialInput, calcularCriC, criCDosisValorInput, criCFarmacoNotasEl);

// Agrupa el desplegable por categoría (Analgesia, Vasopresores e inotropos...) para que sea
// fácil de recorrer con ~35 fármacos.
(function poblarListaCriC() {
  const categorias = [...new Set(CRI_FARMACOS_UCI.map((f) => f.categoria))];
  criCFarmacoListaSelect.innerHTML = `<option value="">— Elige un fármaco —</option>` +
    categorias.map((cat) => {
      const items = CRI_FARMACOS_UCI.filter((f) => f.categoria === cat);
      return `<optgroup label="${escapeHtml(cat)}">` +
        items.map((f, i) => `<option value="${escapeHtml(f.nombre)}">${escapeHtml(f.nombre)}</option>`).join("") +
        `</optgroup>`;
    }).join("");
})();

criCFarmacoListaSelect.addEventListener("change", () => {
  const f = CRI_FARMACOS_UCI.find((x) => x.nombre === criCFarmacoListaSelect.value);
  if (!f) {
    criCFarmacoNotasEl.textContent = "";
    return;
  }
  // Si el fármaco tiene rango específico por especie (ej. fentanilo, propofol, lidocaína) y
  // se conoce la especie del paciente activo, se usa ese rango; si no, se muestran ambos.
  const rango = f.dosis.ambas || f.dosis[paciente.especie] || f.dosis.perro || f.dosis.gato;
  criCNombreInput.value = f.nombre;
  criCConcentracionEstadoEl.textContent = "";
  criCUnidadFarmacoSelect.value = f.unidadFarmaco;
  poblarUnidadesDosisCri(criCUnidadFarmacoSelect, criCDosisUnidadSelect);
  criCDosisUnidadSelect.value = f.dosisUnidad;
  criCDosisValorInput.value = (rango.min + rango.max) / 2;
  criCConcVialInput.value = f.concentracionSugerida != null ? f.concentracionSugerida : "";

  const rangoTexto = f.dosis.ambas
    ? `${formatNum(rango.min)}-${formatNum(rango.max)}`
    : Object.entries(f.dosis).map(([esp, r]) => `${esp}: ${formatNum(r.min)}-${formatNum(r.max)}`).join(" · ");
  criCFarmacoNotasEl.textContent = `Rango habitual: ${rangoTexto} ${criCDosisUnidadSelect.selectedOptions[0].textContent}. ${f.notas}`;
  calcularCriC();
});

[criCUnidadFarmacoSelect, criCConcVialInput, criCDosisValorInput, criCDosisUnidadSelect, criCDuracionInput, criCVolFinalInput].forEach((el) => {
  el.addEventListener("input", calcularCriC);
  el.addEventListener("change", calcularCriC);
});

function calcularCriC() {
  const peso = paciente.peso;
  const unidadFarmaco = criCUnidadFarmacoSelect.value;
  const concVial = parseFloat(criCConcVialInput.value);
  const dosisValor = parseFloat(criCDosisValorInput.value);
  const duracionHoras = parseFloat(criCDuracionInput.value);
  const volFinal = parseFloat(criCVolFinalInput.value);
  const factor = factorDosisCri(unidadFarmaco, criCDosisUnidadSelect.value);

  if (!peso || !concVial || !dosisValor || !duracionHoras || !volFinal || !factor) {
    criCResultadoEl.classList.add("oculto");
    criCResultadoEl.innerHTML = "";
    return;
  }

  const dosisPorKgMin = dosisValor * factor;
  const dosisTotalPorMin = dosisPorKgMin * peso;
  const cantidadFarmacoNecesaria = dosisTotalPorMin * 60 * duracionHoras; // mg o UI totales para toda la duración
  const mlFarmaco = cantidadFarmacoNecesaria / concVial;
  const ritmoMlH = volFinal / duracionHoras;

  if (!isFinite(mlFarmaco) || mlFarmaco <= 0) {
    criCResultadoEl.classList.add("oculto");
    criCResultadoEl.innerHTML = "";
    return;
  }

  criCResultadoEl.classList.remove("oculto");

  if (mlFarmaco > volFinal) {
    // El volumen de fármaco necesario ya supera el volumen final elegido: no cabe SSF (o
    // directamente no cabe el fármaco). Se avisa en vez de mostrar un resultado imposible.
    criCResultadoEl.innerHTML = `
      <p class="aviso-inline">⚠ Para esa dosis y duración harían falta ${formatNum(mlFarmaco)} ml de fármaco, que no caben en un volumen final de ${formatNum(volFinal)} ml. Prueba con una jeringa/bolsa más grande, menos horas de duración, o un vial más concentrado.</p>
    `;
    return;
  }

  const mlSsf = volFinal - mlFarmaco;

  criCResultadoEl.innerHTML = `
    <div class="resultado-dosis">${formatNum(mlFarmaco)} ml de fármaco</div>
    <div class="resultado-detalle">
      <span>+ ${formatNum(mlSsf)} ml de SSF hasta completar ${formatNum(volFinal)} ml</span>
    </div>
    <div class="resultado-volumen">Programa la bomba/perfusor a <strong>${formatNum(ritmoMlH)} ml/h</strong> para que dure ${formatNum(duracionHoras)} h, en un paciente de ${formatNum(peso)} kg.</div>
    <button class="boton-anadir" id="cri-c-anadir-boton">+ Añadir al paciente</button>
  `;
  document.getElementById("cri-c-anadir-boton").addEventListener("click", () => {
    añadirAlPaciente({
      principioActivo: criCNombreInput.value.trim() || criCFarmacoListaSelect.value || "CRI",
      principioActivoReal: criCNombreInput.value.trim() || criCFarmacoListaSelect.value || null,
      categoria: "CRI (infusión a ritmo constante)",
      dosisTexto: `${formatNum(mlFarmaco)} ml de fármaco + ${formatNum(mlSsf)} ml SSF (${formatNum(volFinal)} ml)`,
      detalle: `Dura ${formatNum(duracionHoras)} h a ${formatNum(ritmoMlH)} ml/h · dosis ${dosisValor} ${criCDosisUnidadSelect.selectedOptions[0].textContent}`,
      origen: "CRI"
    });
  });
}

// ============================================================
// Mi base de datos: fármacos personalizados con dosis por patología
// ============================================================
const nuevoFarmacoBoton = document.getElementById("nuevo-farmaco-boton");
const formularioFarmacoEl = document.getElementById("formulario-farmaco");
const formularioFarmacoTituloEl = document.getElementById("formulario-farmaco-titulo");
const cfPrincipioActivo = document.getElementById("cf-principio-activo");
const cfComposicion = document.getElementById("cf-composicion");
const cfCategoria = document.getElementById("cf-categoria");
const cfComerciales = document.getElementById("cf-comerciales");
const cfPatologiasLista = document.getElementById("cf-patologias-lista");
const cfAnadirPatologia = document.getElementById("cf-anadir-patologia");
const cfGuardar = document.getElementById("cf-guardar");
const cfCancelar = document.getElementById("cf-cancelar");
const misFarmacosListaEl = document.getElementById("mis-farmacos-lista");
const misFarmacosBuscadorEl = document.getElementById("misfarmacos-buscador");
misFarmacosBuscadorEl.addEventListener("input", renderMisFarmacos);

let editandoId = null;

nuevoFarmacoBoton.addEventListener("click", () => abrirFormulario());
cfCancelar.addEventListener("click", cerrarFormulario);
cfAnadirPatologia.addEventListener("click", () => cfPatologiasLista.appendChild(crearFilaPatologia()));

function abrirFormulario(farmaco) {
  editandoId = farmaco ? farmaco.id : null;
  formularioFarmacoTituloEl.textContent = farmaco ? "Editar fármaco" : "Nuevo fármaco";
  cfPrincipioActivo.value = farmaco ? farmaco.principioActivo : "";
  cfComposicion.value = farmaco ? (farmaco.composicion || "") : "";
  cfCategoria.value = farmaco ? (farmaco.categoria || "") : "";
  cfComerciales.value = farmaco ? farmaco.nombresComerciales.join(", ") : "";
  cfPatologiasLista.innerHTML = "";

  if (farmaco) {
    const filas = [];
    for (const especie of ["perro", "gato"]) {
      for (const entrada of (farmaco.especies[especie] || [])) {
        filas.push(Object.assign({ especie }, entrada));
      }
    }
    // Si una misma patología/dosis está guardada igual en perro y en gato, se muestra como
    // una sola fila "Perro y gato" en vez de dos filas idénticas (más cómodo para editar).
    const mismaEntrada = (a, b) => a.patologia === b.patologia && a.dosisMin === b.dosisMin && a.dosisMax === b.dosisMax &&
      a.unidad === b.unidad && a.via === b.via && a.frecuencia === b.frecuencia && (a.notas || "") === (b.notas || "");
    const filasFusionadas = [];
    const usadas = new Set();
    filas.forEach((f, i) => {
      if (usadas.has(i)) return;
      const j = filas.findIndex((g, k) => k > i && !usadas.has(k) && g.especie !== f.especie && mismaEntrada(f, g));
      if (j !== -1) { usadas.add(j); filasFusionadas.push(Object.assign({}, f, { especie: "ambas" })); }
      else filasFusionadas.push(f);
    });
    if (filasFusionadas.length) filasFusionadas.forEach((f) => cfPatologiasLista.appendChild(crearFilaPatologia(f)));
    else cfPatologiasLista.appendChild(crearFilaPatologia());
  } else {
    cfPatologiasLista.appendChild(crearFilaPatologia());
  }

  formularioFarmacoEl.classList.remove("oculto");
  formularioFarmacoEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cerrarFormulario() {
  formularioFarmacoEl.classList.add("oculto");
  editandoId = null;
}

function crearFilaPatologia(datos) {
  const div = document.createElement("div");
  div.className = "patologia-fila";
  div.innerHTML = `
    <div class="fila">
      <div class="campo"><label>Patología / indicación</label><input type="text" class="pf-patologia" placeholder="Ej. Sedación" /></div>
      <div class="campo"><label>Especie</label>
        <select class="pf-especie"><option value="perro">Perro</option><option value="gato">Gato</option><option value="ambas">Perro y gato</option></select>
      </div>
    </div>
    <div class="fila">
      <div class="campo"><label>Dosis mín.</label><input type="number" class="pf-min" step="any" /></div>
      <div class="campo"><label>Dosis máx.</label><input type="number" class="pf-max" step="any" /></div>
    </div>
    <div class="fila">
      <div class="campo"><label>Unidad</label>
        <select class="pf-unidad">
          <option value="mg/kg">mg/kg</option>
          <option value="mcg/kg">µg/kg (mcg/kg)</option>
          <option value="UI/kg">UI/kg</option>
        </select>
      </div>
      <div class="campo"><label>Vía</label><input type="text" class="pf-via" placeholder="Ej. VO" /></div>
    </div>
    <div class="campo"><label>Frecuencia</label><input type="text" class="pf-frecuencia" placeholder="Ej. cada 12 h" /></div>
    <div class="campo"><label>Notas (opcional)</label><input type="text" class="pf-notas" /></div>
    <button type="button" class="boton-eliminar-patologia">✕ Quitar esta patología</button>
  `;
  if (datos) {
    div.querySelector(".pf-patologia").value = datos.patologia || "";
    div.querySelector(".pf-especie").value = datos.especie || "perro";
    div.querySelector(".pf-min").value = datos.dosisMin ?? "";
    div.querySelector(".pf-max").value = datos.dosisMax ?? "";
    div.querySelector(".pf-unidad").value = datos.unidad || "mg/kg";
    div.querySelector(".pf-via").value = datos.via || "";
    div.querySelector(".pf-frecuencia").value = datos.frecuencia || "";
    div.querySelector(".pf-notas").value = datos.notas || "";
  }
  div.querySelector(".boton-eliminar-patologia").addEventListener("click", () => div.remove());
  return div;
}

cfGuardar.addEventListener("click", async () => {
  const principioActivo = cfPrincipioActivo.value.trim();
  if (!principioActivo) { alert("Indica el principio activo."); return; }

  const especies = {};
  const filas = cfPatologiasLista.querySelectorAll(".patologia-fila");
  for (const fila of filas) {
    const especie = fila.querySelector(".pf-especie").value;
    const minRaw = parseFloat(fila.querySelector(".pf-min").value);
    const maxRaw = parseFloat(fila.querySelector(".pf-max").value);
    const patologia = fila.querySelector(".pf-patologia").value.trim();
    const notas = fila.querySelector(".pf-notas").value.trim();
    const tieneDosis = !isNaN(minRaw) && !isNaN(maxRaw);
    // Se admite guardar una patología sin dosis por kg (ej. fármacos con dosis fija por
    // tramo de peso, tipo "0-10 kg: 1 comprimido, 10-20 kg: 2 comprimidos...") siempre que
    // se indiquen las notas con esa pauta: sin dosis Y sin notas no aporta nada, se descarta.
    // Si hay notas pero no se ha escrito una patología/indicación (ej. un suplemento de uso
    // general como un probiótico), se guarda igual con la etiqueta genérica "General" en vez
    // de descartar la fila entera y perder silenciosamente las notas ya escritas.
    if (!patologia && !tieneDosis && !notas) continue;
    const entrada = {
      patologia: patologia || "General",
      dosisMin: tieneDosis ? minRaw : null,
      dosisMax: tieneDosis ? maxRaw : null,
      unidad: fila.querySelector(".pf-unidad").value,
      via: fila.querySelector(".pf-via").value.trim() || "-",
      frecuencia: fila.querySelector(".pf-frecuencia").value.trim() || "-",
      notas
    };
    // "Perro y gato": la misma dosis se guarda igual en las dos especies, para no tener que
    // rellenar la fila dos veces cuando la pauta no cambia entre ambas.
    const especiesDestino = especie === "ambas" ? ["perro", "gato"] : [especie];
    for (const esp of especiesDestino) {
      if (!especies[esp]) especies[esp] = [];
      especies[esp].push(Object.assign({}, entrada));
    }
  }
  // No es obligatorio indicar ya una dosis: se puede guardar el fármaco solo con el
  // principio activo (y composición, nombres comerciales...) y volver más tarde a
  // completar la dosis por patología cuando se tenga. Sin dosis, la ficha mostrará
  // "sin pauta para esta especie" en la Calculadora hasta que se edite y se añada.

  const farmaco = {
    id: editandoId || ("custom-" + generarId()),
    esPersonalizado: true,
    principioActivo,
    composicion: cfComposicion.value.trim(),
    categoria: cfCategoria.value.trim() || "Personalizado",
    nombresComerciales: cfComerciales.value.split(",").map((s) => s.trim()).filter(Boolean),
    indicaciones: [...new Set(Object.values(especies).flat().map((e) => e.patologia))],
    especies
  };

  await dbPut("customDrugs", farmaco);
  await cargarCustomDrugs();
  cerrarFormulario();
  renderMisFarmacos();
});

// Texto de búsqueda de un fármaco personalizado: principio activo y nombres comerciales
// como campos principales, más composición y categoría como apoyo.
function textoBusquedaMiFarmaco(f) {
  return normalizar([f.principioActivo, ...(f.nombresComerciales || []), f.composicion || "", f.categoria || ""].join(" "));
}

function renderMisFarmacos() {
  if (!customDrugs.length) {
    misFarmacosListaEl.innerHTML = `<p class="placeholder">Todavía no has añadido ningún fármaco propio.</p>`;
    return;
  }

  const filtro = normalizar(misFarmacosBuscadorEl.value.trim());
  const filtrados = !filtro ? customDrugs : customDrugs.filter((f) => textoBusquedaMiFarmaco(f).includes(filtro));

  if (!filtrados.length) {
    misFarmacosListaEl.innerHTML = `<p class="placeholder">Ningún fármaco coincide con "${escapeHtml(misFarmacosBuscadorEl.value.trim())}".</p>`;
    return;
  }

  misFarmacosListaEl.innerHTML = filtrados.map((f) => {
    const filas = [];
    for (const especie of ["perro", "gato"]) {
      for (const e of (f.especies[especie] || [])) {
        const tieneDosis = e.dosisMin != null && e.dosisMax != null;
        filas.push(`<div class="protocolo-componente">
          <span class="protocolo-componente-nombre">${escapeHtml(e.patologia)} (${especie === "gato" ? "Gato" : "Perro"})</span>
          <span class="protocolo-componente-dosis">${tieneDosis ? `${e.dosisMin}${e.dosisMin !== e.dosisMax ? "–" + e.dosisMax : ""} ${escapeHtml(e.unidad)}` : "Sin dosis por kg (ver notas)"}</span>
          <span class="protocolo-componente-via">${escapeHtml(e.via)} · ${escapeHtml(e.frecuencia)}</span>
          ${e.notas ? `<p class="notas">${escapeHtml(e.notas)}</p>` : ""}
        </div>`);
      }
    }
    return `
      <div class="tarjeta">
        <h3 class="titulo-tarjeta">${escapeHtml(f.nombresComerciales.length ? f.nombresComerciales.join(", ") : f.principioActivo)}</h3>
        <p class="categoria">${escapeHtml(f.principioActivo)}</p>
        ${f.composicion ? `<p class="ayuda">${escapeHtml(f.composicion)}</p>` : ""}
        <div class="protocolo-componentes">${filas.join("")}</div>
        <div class="fila-botones-form">
          <button type="button" class="boton-secundario boton-editar-mifarmaco" data-id="${f.id}">Editar</button>
          <button type="button" class="boton-secundario boton-eliminar-mifarmaco" data-id="${f.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join("");

  misFarmacosListaEl.querySelectorAll(".boton-editar-mifarmaco").forEach((btn) => {
    btn.addEventListener("click", () => abrirFormulario(customDrugs.find((f) => f.id === btn.dataset.id)));
  });
  misFarmacosListaEl.querySelectorAll(".boton-eliminar-mifarmaco").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este fármaco de tu base de datos? Las imágenes asociadas no se eliminarán automáticamente.")) return;
      await dbDelete("customDrugs", btn.dataset.id);
      await cargarCustomDrugs();
      renderMisFarmacos();
    });
  });
}

async function cargarCustomDrugs() {
  customDrugs = await dbGetAll("customDrugs");
  reconstruirIndice();
}

// ============================================================
// Copia de seguridad: exportar/importar mis datos personalizados
// (fármacos, protocolos y favoritos del hospital), ya que se guardan solo en
// este dispositivo/navegador y no hay servidor con el que sincronizarlos.
// ============================================================
const exportarDatosBoton = document.getElementById("exportar-datos-boton");
const importarDatosBoton = document.getElementById("importar-datos-boton");
const importarDatosInput = document.getElementById("importar-datos-input");
const importarDatosEstadoEl = document.getElementById("importar-datos-estado");
const importarComparacionEl = document.getElementById("importar-comparacion");
const importarComparacionIntroEl = document.getElementById("importar-comparacion-intro");
const importarComparacionListaEl = document.getElementById("importar-comparacion-lista");
const importarComparacionContinuarBoton = document.getElementById("importar-comparacion-continuar");
const importarComparacionCancelarBoton = document.getElementById("importar-comparacion-cancelar");

exportarDatosBoton.addEventListener("click", async () => {
  const [drugs, protocolos, favoritos, favoritosCriExport, imagenes, protocolosOcultosExport] = await Promise.all([
    dbGetAll("customDrugs"),
    dbGetAll("customProtocols"),
    dbGetAll("favoritosHospital"),
    dbGetAll("favoritosCri"),
    dbGetAll("imagenes"),
    dbGetAll("protocolosOcultos")
  ]);
  const backup = {
    tipo: "calculadora-dosis-backup",
    version: 1,
    exportadoEl: new Date().toISOString(),
    // Versión de la base de datos COMPARTIDA (data.js) que tenía este dispositivo al exportar
    // — no de los datos personales de este backup. Sirve para avisar al importar en otro
    // ordenador si ese backup se hizo con una versión distinta del código/contenido compartido.
    versionBD: VERSION_BD,
    customDrugs: drugs,
    customProtocols: protocolos,
    favoritosHospital: favoritos,
    favoritosCri: favoritosCriExport,
    imagenes,
    protocolosOcultos: protocolosOcultosExport
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  // Fecha Y hora local en el nombre del archivo (no solo la fecha): sin la hora, dos
  // exportaciones el mismo día se llaman igual y una sustituye a la otra sin darse cuenta.
  // Se evitan los ":" del formato ISO porque no son válidos en nombres de archivo de Windows.
  const ahora = new Date();
  const dosDigitos = (n) => String(n).padStart(2, "0");
  const fecha = `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}_${dosDigitos(ahora.getHours())}-${dosDigitos(ahora.getMinutes())}`;
  a.href = url;
  a.download = `calculadora-dosis-backup-v${VERSION_BD}-${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  importarDatosEstadoEl.textContent = `Exportado (base de datos compartida v${VERSION_BD}): ${drugs.length} fármaco(s), ${protocolos.length} protocolo(s), ${favoritos.length} favorito(s) del hospital, ${favoritosCriExport.length} favorito(s) de CRI, ${protocolosOcultosExport.length} protocolo(s) ocultado(s) y ${imagenes.length} imagen(es).`;
});

importarDatosBoton.addEventListener("click", () => importarDatosInput.click());

// Aplica de verdad el backup ya validado (y, si hubo que preguntar, ya resuelto): añade/
// actualiza por id sin borrar nada del dispositivo que no se haya decidido eliminar
// explícitamente en la comparación previa.
async function ejecutarImportacion(backup) {
  for (const f of backup.customDrugs || []) await dbPut("customDrugs", f);
  for (const p of backup.customProtocols || []) await dbPut("customProtocols", p);
  for (const fav of backup.favoritosHospital || []) await dbPut("favoritosHospital", fav);
  for (const fav of backup.favoritosCri || []) await dbPut("favoritosCri", fav);
  for (const img of backup.imagenes || []) await dbPut("imagenes", img);
  for (const oc of backup.protocolosOcultos || []) await dbPut("protocolosOcultos", oc);
  await cargarCustomDrugs();
  await cargarCustomProtocols();
  await cargarFavoritosHospital();
  await cargarFavoritosCri();
  await cargarProtocolosOcultos();
  renderMisFarmacos();
  renderProtocolos();
  renderProtocolosOcultos();
  try { localStorage.setItem(CLAVE_ULTIMA_IMPORTACION, new Date().toISOString()); } catch (e) { /* localStorage no disponible: se ignora */ }
  actualizarIndicadorUltimaActualizacion();
  const avisoVersion = (typeof backup.versionBD === "number" && backup.versionBD !== VERSION_BD)
    ? ` ⚠ Este archivo se exportó con la base de datos compartida v${backup.versionBD}; este dispositivo tiene v${VERSION_BD} — actualiza la app en el ordenador que se haya quedado atrás para evitar diferencias.`
    : "";
  importarDatosEstadoEl.textContent = `Importado: ${(backup.customDrugs || []).length} fármaco(s), ${(backup.customProtocols || []).length} protocolo(s), ${(backup.favoritosHospital || []).length} favorito(s) del hospital, ${(backup.favoritosCri || []).length} favorito(s) de CRI, ${(backup.protocolosOcultos || []).length} protocolo(s) ocultado(s) y ${(backup.imagenes || []).length} imagen(es).${avisoVersion}`;
}

// Fármacos de "Mi base de datos" en este dispositivo que el archivo a importar (todavía sin
// confirmar) no incluye — hay que preguntar uno a uno si se conservan o se eliminan antes de
// seguir, en vez de dejarlos siempre tal cual sin decírselo al usuario.
let importacionPendiente = null; // { backup, faltantes: [customDrug, ...] }

function ocultarComparacionImportacion() {
  importarComparacionEl.classList.add("oculto");
  importarComparacionListaEl.innerHTML = "";
  importacionPendiente = null;
}

function mostrarComparacionImportacion(backup, faltantes) {
  importacionPendiente = { backup, faltantes };
  importarComparacionIntroEl.textContent = `El archivo a importar no incluye ${faltantes.length} fármaco(s) que sí tienes guardado(s) en este dispositivo. Elige, para cada uno, si quieres conservarlo o eliminarlo antes de continuar con la importación.`;
  importarComparacionListaEl.innerHTML = faltantes.map((f) => `
    <div class="importar-comparacion-fila" data-id="${escapeHtml(f.id)}">
      <div>
        <strong>${escapeHtml((f.nombresComerciales && f.nombresComerciales.length) ? f.nombresComerciales.join(", ") : f.principioActivo)}</strong>
        <div class="ayuda">${escapeHtml(f.principioActivo)}</div>
      </div>
      <div class="importar-comparacion-opciones">
        <label><input type="radio" name="accion-${escapeHtml(f.id)}" value="conservar" checked /> Conservar</label>
        <label><input type="radio" name="accion-${escapeHtml(f.id)}" value="eliminar" /> Eliminar</label>
      </div>
    </div>
  `).join("");
  importarDatosEstadoEl.textContent = "";
  importarComparacionEl.classList.remove("oculto");
  importarComparacionEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

importarComparacionContinuarBoton.addEventListener("click", async () => {
  if (!importacionPendiente) return;
  const { backup, faltantes } = importacionPendiente;
  for (const f of faltantes) {
    const marcado = importarComparacionListaEl.querySelector(`input[name="accion-${CSS.escape(f.id)}"]:checked`);
    if (marcado && marcado.value === "eliminar") await dbDelete("customDrugs", f.id);
  }
  ocultarComparacionImportacion();
  importarDatosEstadoEl.textContent = "Importando...";
  await ejecutarImportacion(backup);
});

importarComparacionCancelarBoton.addEventListener("click", () => {
  ocultarComparacionImportacion();
  importarDatosEstadoEl.textContent = "Importación cancelada.";
});

importarDatosInput.addEventListener("change", async () => {
  const file = importarDatosInput.files[0];
  importarDatosInput.value = "";
  if (!file) return;
  ocultarComparacionImportacion();
  importarDatosEstadoEl.textContent = "Importando...";
  try {
    const texto = await file.text();
    const backup = JSON.parse(texto);
    if (backup.tipo !== "calculadora-dosis-backup") {
      importarDatosEstadoEl.textContent = "⚠ Este archivo no parece una copia de seguridad de esta app.";
      return;
    }
    // Comparación previa: si el archivo a importar no trae algún fármaco que sí existe ya en
    // este dispositivo (ej. se exportó desde otro ordenador antes de añadir ese fármaco, o se
    // borró allí), no se asume nada — se pregunta explícitamente si conservarlo o eliminarlo
    // antes de aplicar el resto de la importación.
    const idsEnArchivo = new Set((backup.customDrugs || []).map((f) => f.id));
    const localDrugs = await dbGetAll("customDrugs");
    const faltantes = localDrugs.filter((f) => !idsEnArchivo.has(f.id));
    if (faltantes.length) {
      mostrarComparacionImportacion(backup, faltantes);
      return;
    }
    await ejecutarImportacion(backup);
  } catch (e) {
    importarDatosEstadoEl.textContent = "⚠ No se ha podido leer el archivo (¿es un backup exportado desde esta misma app?).";
  }
});

// ============================================================
// Service worker (uso sin conexión / instalación como app)
// ============================================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

// ============================================================
// Los campos numéricos (peso, dosis, concentración...) solo deben cambiar de
// valor al escribir con el teclado: se desactiva el "scroll" del ratón, que
// por defecto del navegador incrementa/decrementa el número bajo el cursor
// y hace que sea muy fácil alterarlo sin querer al desplazar la página.
// ============================================================
document.addEventListener("wheel", () => {
  if (document.activeElement && document.activeElement.type === "number") {
    document.activeElement.blur();
  }
}, { passive: true });

// ============================================================
// "Última actualización" en la cabecera: la fecha más reciente entre el contenido
// compartido (ULTIMA_ACTUALIZACION_BD, en data.js) y la última vez que este dispositivo
// importó un backup de datos personales. Exportar NO cuenta como actualización, ya que no
// cambia ningún contenido, solo lo vuelca a un archivo.
// ============================================================
const CLAVE_ULTIMA_IMPORTACION = "ultimaImportacionLocal";

// Formatea fecha + hora juntas (ej. "7/9/2026, 00:22") en vez de solo la fecha, para poder
// distinguir varias actualizaciones ocurridas el mismo día.
function formatearFechaHora(fecha) {
  return `${fecha.toLocaleDateString("es-ES")}, ${fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

function actualizarIndicadorUltimaActualizacion() {
  const el = document.getElementById("ultima-actualizacion");
  if (!el) return;
  const fechaBD = new Date(ULTIMA_ACTUALIZACION_BD);
  let fechaImport = null;
  try {
    const guardada = localStorage.getItem(CLAVE_ULTIMA_IMPORTACION);
    if (guardada) fechaImport = new Date(guardada);
  } catch (e) { /* localStorage no disponible (modo privado, etc.): se ignora */ }

  const usarImport = fechaImport && !isNaN(fechaImport) && fechaImport > fechaBD;
  const fecha = usarImport ? fechaImport : fechaBD;
  const origen = usarImport ? "última importación de tus datos en este dispositivo" : "base de datos compartida";
  // VERSION_BD identifica el contenido de data.js que trae este dispositivo (independiente de
  // si además se muestra la fecha de una importación personal más reciente): comparándola con
  // la de otro ordenador se sabe al instante si ambos tienen la misma base de datos compartida,
  // sin tener que fijarse en la hora exacta.
  el.textContent = `Última actualización: ${formatearFechaHora(fecha)} (${origen}) · v${VERSION_BD}`;
}

// ============================================================
// Arranque
// ============================================================
actualizarPaciente();
cargarCustomDrugs().then(renderMisFarmacos);
cargarCustomProtocols();
cargarProtocolosOcultos();
cargarFavoritosHospital();
cargarFavoritosCri();
actualizarIndicadorUltimaActualizacion();
