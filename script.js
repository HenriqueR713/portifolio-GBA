/*
  ===========================================================================
  Tela inicial navegável + Tela de Cursos.
  Na tela de Cursos, existem 3 imagens separadas (rockseat/IFPE/cocacola),
  cada uma com posição própria no CSS. O JS mostra só a do curso ativo
  (classe ".oculto" nas outras) — nunca 2 visíveis ao mesmo tempo.
  Ordem fixa: rockseat -> IFPE -> cocacola.
  ===========================================================================
*/

// --------------------- CAMINHOS DOS ASSETS ---------------------
const DPAD_PATH = 'images/components_ext/dpad/';
const AB_PATH   = 'images/components_ext/ab/';

const dpadStates = {
  default: DPAD_PATH + 'dpad.png',
  up:      DPAD_PATH + 'up.png',
  down:    DPAD_PATH + 'down.png',
  left:    DPAD_PATH + 'left.png',
  right:   DPAD_PATH + 'right.png',
};

const abStates = {
  a: { normal: AB_PATH + 'a_btn.png', select: AB_PATH + 'a_btn_select.png' },
  b: { normal: AB_PATH + 'b_btn.png', select: AB_PATH + 'b_btn_select.png' },
};

const SKILLS_SPRITE_PATH = 'images/pages/skills/animation_pixel/preview.webp';

// --------------------- PRELOAD ---------------------
function precarregar(urls) {
  urls.forEach(src => { const img = new Image(); img.src = src; });
}

precarregar([
  ...Object.values(dpadStates),
  abStates.a.normal, abStates.a.select,
  abStates.b.normal, abStates.b.select,
  SKILLS_SPRITE_PATH,
]);

// --------------------- MENU SELECIONÁVEL DA HOME ---------------------
const HOME_PATH = 'images/pages/home/components_int/';

const menuItens = {
  contact:  { el: document.getElementById('contactLabel'),
              normal: HOME_PATH + 'contatct/contact.png',
              select: HOME_PATH + 'contatct/contact_select.png' },
  skills:   { el: document.getElementById('skillsBadge'),
              normal: HOME_PATH + 'skills/skills.png',
              select: HOME_PATH + 'skills/skills_select.png' },
  cursos:   { el: document.getElementById('btnCursos'),
              normal: HOME_PATH + 'cursos/cursos.png',
              select: HOME_PATH + 'cursos/cursos_select.png' },
  projetos: { el: document.getElementById('btnProjetos'),
              normal: HOME_PATH + 'projetos/projetos.png',
              select: HOME_PATH + 'projetos/projetos_select.png' },
  formacao: { el: document.getElementById('btnFormacao'),
              normal: HOME_PATH + 'formacao/formacao.png',
              select: HOME_PATH + 'formacao/formacao_select.png' },
};

const navegacao = {
  contact:  { down: 'skills' },
  skills:   { up: 'contact', down: 'cursos' },
  cursos:   { up: 'skills', right: 'projetos' },
  projetos: { up: 'skills', left: 'cursos', right: 'formacao' },
  formacao: { up: 'skills', left: 'projetos' },
};

let selecionado = 'contact';

function selecionar(id) {
  menuItens[selecionado].el.src = menuItens[selecionado].normal;
  menuItens[selecionado].el.classList.remove('selecionado');
  selecionado = id;
  menuItens[id].el.src = menuItens[id].select;
  menuItens[id].el.classList.add('selecionado');
  posicionarSeta();
}

// --------------------- TELAS ---------------------
const telaHome   = document.getElementById('homeScreen');
const telaSkills = document.getElementById('skillsPage');
const telaCursos = document.getElementById('cursosPage');
let telaAtual = 'home';

// --------------------- TRANSIÇÃO EM PIXEL ---------------------
const TRANS_COLS   = 30;
const TRANS_ROWS   = 20;
const TRANS_PASSOS = 12;
const TRANS_MS     = 30;

let transicionando = false;

function montarClip(w, h, progresso, reverso) {
  const bw = w / TRANS_COLS;
  const bh = h / TRANS_ROWS;
  const maxD = Math.hypot(TRANS_COLS / 2, (TRANS_ROWS / 2) * (TRANS_COLS / TRANS_ROWS));

  const revelado = (c, r) => {
    const dx = c + 0.5 - TRANS_COLS / 2;
    const dy = (r + 0.5 - TRANS_ROWS / 2) * (TRANS_COLS / TRANS_ROWS);
    let t = Math.hypot(dx, dy) / maxD;
    if (reverso) t = 1 - t;
    return t < progresso * 1.02;
  };

  let d = '';
  for (let r = 0; r < TRANS_ROWS; r++) {
    let c = 0;
    while (c < TRANS_COLS) {
      if (!revelado(c, r)) { c++; continue; }
      const ini = c;
      while (c < TRANS_COLS && revelado(c, r)) c++;
      const x1 = Math.floor(ini * bw), y1 = Math.floor(r * bh);
      const x2 = Math.ceil(c * bw) + 1, y2 = Math.ceil((r + 1) * bh) + 1;
      d += `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
    }
  }
  return d ? `path('${d}')` : 'inset(100%)';
}

function trocarTela(de, para, reverso, aoTerminar) {
  if (!de || !para) {
    console.error('Faltam ids no HTML: homeScreen / skillsPage / cursosPage');
    return;
  }

  if (!CSS.supports('clip-path', "path('M0 0Z')")) {
    de.hidden = true;
    para.hidden = false;
    aoTerminar();
    return;
  }

  transicionando = true;
  para.style.clipPath = 'inset(100%)';
  para.style.zIndex = '2';
  de.style.zIndex = '1';
  para.hidden = false;

  const { width, height } = para.getBoundingClientRect();
  let quadro = 0;

  const id = setInterval(() => {
    quadro++;
    para.style.clipPath = montarClip(width, height, quadro / TRANS_PASSOS, reverso);

    if (quadro >= TRANS_PASSOS) {
      clearInterval(id);
      de.hidden = true;
      para.style.clipPath = '';
      para.style.zIndex = '';
      de.style.zIndex = '';
      transicionando = false;
      aoTerminar();
    }
  }, TRANS_MS);
}

function telaDe(nome) {
  if (nome === 'home') return telaHome;
  if (nome === 'skills') return telaSkills;
  if (nome === 'cursos') return telaCursos;
  return null;
}

function abrirSubTela(nome) {
  if (transicionando) return;
  trocarTela(telaHome, telaDe(nome), false, () => {
    telaAtual = nome;
    if (nome === 'cursos') atualizarCurso();
  });
}

function voltarHome() {
  if (transicionando) return;
  trocarTela(telaDe(telaAtual), telaHome, true, () => { telaAtual = 'home'; posicionarSeta(); });
}

function acaoA() {
  if (telaAtual === 'home') {
    if (selecionado === 'skills') abrirSubTela('skills');
    if (selecionado === 'cursos') abrirSubTela('cursos');
  } else if (telaAtual === 'cursos') {
    acionarExpandir();
  }
}

function acaoB() {
  if (telaAtual !== 'home') voltarHome();
}

function mover(direcao) {
  if (transicionando) return;
  if (telaAtual === 'home') {
    const proximo = navegacao[selecionado][direcao];
    if (proximo) selecionar(proximo);
  } else if (telaAtual === 'cursos') {
    if (direcao === 'up' || direcao === 'down') moverCurso(direcao);
  }
}

// --------------------- SETINHA PIXELADA (home) ---------------------
const SETA_PIXELS = [
  '#########',
  '#rrrrrrr#',
  '.#rrrrr#.',
  '..#rrr#..',
  '...#r#...',
  '....#....',
];
const SETA_COR_CONTORNO = '#2B2B2B';
const SETA_COR_MIOLO    = '#E23C3C';
const SETA_LARGURA      = 3.2;

const ajusteSeta = {
  contact:  { x: 0, y: 0 },
  skills:   { x: 0, y: 0 },
  cursos:   { x: 0, y: 0 },
  projetos: { x: 0, y: 0 },
  formacao: { x: 0, y: 0 },
};

const seta = document.createElement('div');
Object.assign(seta.style, {
  position: 'absolute', pointerEvents: 'none', zIndex: '5', display: 'none',
});

seta.innerHTML =
  '<svg viewBox="0 0 9 6" width="100%" height="100%" shape-rendering="crispEdges" style="display:block">' +
  SETA_PIXELS.map((linha, y) => [...linha].map((ch, x) => {
    if (ch === '.') return '';
    const cor = ch === '#' ? SETA_COR_CONTORNO : SETA_COR_MIOLO;
    return `<rect x="${x}" y="${y}" width="1" height="1" fill="${cor}"/>`;
  }).join('')).join('') +
  '</svg>';

if (telaHome) telaHome.appendChild(seta);

seta.animate([
  { transform: 'translateY(0)',   offset: 0,   easing: 'steps(1, jump-end)' },
  { transform: 'translateY(45%)', offset: 0.5, easing: 'steps(1, jump-end)' },
  { transform: 'translateY(0)',   offset: 1 },
], { duration: 700, iterations: Infinity });

function posicionarSeta() {
  if (!telaHome || !menuItens[selecionado]) return;

  const tela = telaHome.getBoundingClientRect();
  if (tela.width === 0) return;

  const item = menuItens[selecionado].el.getBoundingClientRect();
  const aj   = ajusteSeta[selecionado] || { x: 0, y: 0 };
  const w    = tela.width * SETA_LARGURA / 100;
  const h    = w * SETA_PIXELS.length / SETA_PIXELS[0].length;

  seta.style.width  = w + 'px';
  seta.style.height = h + 'px';
  seta.style.left   = (item.left - tela.left + item.width / 2 - w / 2 + tela.width * aj.x / 100) + 'px';
  seta.style.top    = (item.top - tela.top - h * 1.5 + tela.width * aj.y / 100) + 'px';
  seta.style.display = 'block';
}

window.addEventListener('resize', posicionarSeta);
window.addEventListener('orientationchange', () => setTimeout(posicionarSeta, 300));
document.addEventListener('fullscreenchange', () => setTimeout(posicionarSeta, 50));
window.addEventListener('load', posicionarSeta);

precarregar(Object.values(menuItens).flatMap(i => [i.normal, i.select]));
selecionar(selecionado);

// ===========================================================================
// TELA DE CURSOS
// ===========================================================================

const CURSOS_BTN_PATH = 'images/pages/cursos/page_base_components/';
const CURSOS_INT_PATH = 'images/pages/cursos/components_int/';

// Cada curso agora tem "el": o elemento HTML próprio dele (#itemRockseat etc),
// que o CSS posiciona individualmente. O JS só decide qual ficar visível.
const cursosData = {
  rockseat: {
    el:           document.getElementById('itemRockseat'),
    selectImg:    CURSOS_BTN_PATH + 'rockseat_select_btn.png',
    foto:         CURSOS_INT_PATH + 'curso_rockseat/foto_curso/rockseat_foto.png',
    cargaHoraria: CURSOS_INT_PATH + 'curso_rockseat/carga_horaria.png',
    data:         CURSOS_INT_PATH + 'curso_rockseat/data.png',
    status:       CURSOS_INT_PATH + 'curso_rockseat/status.png',
    texto:        CURSOS_INT_PATH + 'curso_rockseat/texto.png',
    titulo:       CURSOS_INT_PATH + 'curso_rockseat/titulo.png',
    tituloHover:  CURSOS_INT_PATH + 'curso_rockseat/titulo_hover.png',
  },
  IFPE: {
    el:           document.getElementById('itemIFPE'),
    selectImg:    CURSOS_BTN_PATH + 'IFPE_select_btn.png',
    foto:         CURSOS_INT_PATH + 'curso_IFPE/foto_curso/IFPE_foto.png',
    cargaHoraria: CURSOS_INT_PATH + 'curso_IFPE/carga_horaria.png',
    data:         CURSOS_INT_PATH + 'curso_IFPE/data.png',
    status:       CURSOS_INT_PATH + 'curso_IFPE/status.png',
    texto:        CURSOS_INT_PATH + 'curso_IFPE/texto.png',
    titulo:       CURSOS_INT_PATH + 'curso_IFPE/titulo.png',
    tituloHover:  CURSOS_INT_PATH + 'curso_IFPE/titulo_hover.png',
  },
  cocacola: {
    el:           document.getElementById('itemCocacola'),
    selectImg:    CURSOS_BTN_PATH + 'cocacola_select_btn.png',
    foto:         CURSOS_INT_PATH + 'curso_cocacola/foto_curso/cocacola_foto.png',
    cargaHoraria: CURSOS_INT_PATH + 'curso_cocacola/carga_horaria.png',
    data:         CURSOS_INT_PATH + 'curso_cocacola/data.png',
    status:       CURSOS_INT_PATH + 'curso_cocacola/status.png',
    texto:        CURSOS_INT_PATH + 'curso_cocacola/texto.png',
    titulo:       CURSOS_INT_PATH + 'curso_cocacola/titulo.png',
    tituloHover:  CURSOS_INT_PATH + 'curso_cocacola/titulo_hover.png',
  },
};

// Ordem de navegação (cima/baixo): rockseat -> IFPE -> cocacola
const ORDEM_CURSOS = ['rockseat', 'IFPE', 'cocacola'];

const painelEl = {
  titulo:       document.getElementById('cursoTitulo'),
  foto:         document.getElementById('cursoFoto'),
  cargaHoraria: document.getElementById('cursoCarga'),
  data:         document.getElementById('cursoData'),
  status:       document.getElementById('cursoStatus'),
  texto:        document.getElementById('cursoTexto'),
  expandir:     document.getElementById('cursoExpandir'),
};

let cursoIndex = 0; // começa em rockseat

// Esconde os outros 2 elementos e mostra só o do curso ativo.
// Cada elemento tem posição própria no CSS — por isso agora é
// possível ajustar cada nome de curso de forma independente.
function atualizarCurso() {
  const idAtivo = ORDEM_CURSOS[cursoIndex];

  ORDEM_CURSOS.forEach(id => {
    const dados = cursosData[id];
    if (id === idAtivo) {
      dados.el.src = dados.selectImg;
      dados.el.classList.remove('oculto');
    } else {
      dados.el.classList.add('oculto');
    }
  });

  const dadosAtivo = cursosData[idAtivo];
  painelEl.titulo.src       = dadosAtivo.titulo;
  painelEl.foto.src         = dadosAtivo.foto;
  painelEl.cargaHoraria.src = dadosAtivo.cargaHoraria;
  painelEl.data.src         = dadosAtivo.data;
  painelEl.status.src       = dadosAtivo.status;
  painelEl.texto.src        = dadosAtivo.texto;
}

function moverCurso(direcao) {
  let proximo = cursoIndex;
  if (direcao === 'down') proximo = Math.min(ORDEM_CURSOS.length - 1, cursoIndex + 1);
  if (direcao === 'up')   proximo = Math.max(0, cursoIndex - 1);

  if (proximo !== cursoIndex) {
    cursoIndex = proximo;
    atualizarCurso();
  }
}

// Título do painel: hover troca a cor (titulo.png <-> titulo_hover.png)
painelEl.titulo.addEventListener('mouseenter', () => {
  painelEl.titulo.src = cursosData[ORDEM_CURSOS[cursoIndex]].tituloHover;
});
painelEl.titulo.addEventListener('mouseleave', () => {
  painelEl.titulo.src = cursosData[ORDEM_CURSOS[cursoIndex]].titulo;
});

// --------------------- BOTÃO EXPANDIR: frame-swap + "pop" em steps ---------------------
const EXPANDIR_FRAME_1 = CURSOS_BTN_PATH + 'expandir.png';
const EXPANDIR_FRAME_2 = CURSOS_BTN_PATH + 'expandir_2.png';
let expandido = false;

function acionarExpandir() {
  expandido = !expandido;
  painelEl.expandir.src = expandido ? EXPANDIR_FRAME_2 : EXPANDIR_FRAME_1;

  painelEl.expandir.classList.remove('animando');
  void painelEl.expandir.offsetWidth; // reflow, pra animação tocar de novo em cliques seguidos
  painelEl.expandir.classList.add('animando');
}

painelEl.expandir.addEventListener('click', acionarExpandir);

precarregar([
  CURSOS_BTN_PATH + 'cursos_page.png',
  EXPANDIR_FRAME_1, EXPANDIR_FRAME_2,
  ...ORDEM_CURSOS.flatMap(id => [
    cursosData[id].selectImg,
    cursosData[id].foto, cursosData[id].cargaHoraria, cursosData[id].data,
    cursosData[id].status, cursosData[id].texto,
    cursosData[id].titulo, cursosData[id].tituloHover,
  ]),
]);

// Estado inicial da tela de cursos, já pronto pra quando ela abrir
atualizarCurso();

// --------------------- D-PAD ---------------------
const dpadImg = document.getElementById('dpadImg');

document.querySelectorAll('.dpad-zone').forEach(zone => {
  const direcao = zone.dataset.dir;

  const ativar    = () => { dpadImg.src = dpadStates[direcao]; mover(direcao); };
  const desativar = () => { dpadImg.src = dpadStates.default; };

  zone.addEventListener('mousedown', ativar);
  zone.addEventListener('mouseup', desativar);
  zone.addEventListener('mouseleave', desativar);

  zone.addEventListener('touchstart', (e) => { e.preventDefault(); ativar(); }, { passive: false });
  zone.addEventListener('touchend',   (e) => { e.preventDefault(); desativar(); }, { passive: false });
});

// --------------------- BOTÕES A e B ---------------------
function configurarBotaoAB(elementId, estados, acao) {
  const btn = document.getElementById(elementId);

  const ativar    = () => { btn.src = estados.select; acao(); };
  const desativar = () => { btn.src = estados.normal; };

  btn.addEventListener('mousedown', ativar);
  btn.addEventListener('mouseup', desativar);
  btn.addEventListener('mouseleave', desativar);
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); ativar(); }, { passive: false });
  btn.addEventListener('touchend',   (e) => { e.preventDefault(); desativar(); }, { passive: false });
}

configurarBotaoAB('btnA', abStates.a, acaoA);
configurarBotaoAB('btnB', abStates.b, acaoB);

// --------------------- TECLADO: D-PAD (setas) + A/B (Z e X) ---------------------
const teclasDpad = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const teclasAB = {
  z: { elementId: 'btnA', estados: abStates.a, acao: acaoA },
  x: { elementId: 'btnB', estados: abStates.b, acao: acaoB },
};

document.addEventListener('keydown', (e) => {
  const direcao = teclasDpad[e.key];
  if (direcao) {
    e.preventDefault();
    dpadImg.src = dpadStates[direcao];
    if (!e.repeat) mover(direcao);
    return;
  }

  const ab = teclasAB[e.key.toLowerCase()];
  if (ab) {
    document.getElementById(ab.elementId).src = ab.estados.select;
    if (!e.repeat) ab.acao();
  }
});

document.addEventListener('keyup', (e) => {
  const direcao = teclasDpad[e.key];
  if (direcao) {
    dpadImg.src = dpadStates.default;
    return;
  }

  const ab = teclasAB[e.key.toLowerCase()];
  if (ab) {
    document.getElementById(ab.elementId).src = ab.estados.normal;
  }
});

// --------------------- TELA CHEIA NO CELULAR DEITADO ---------------------
function estaDeitado() {
  return window.matchMedia('(orientation: landscape)').matches;
}

function tentarFullscreen() {
  if (estaDeitado() && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

document.addEventListener('touchend', tentarFullscreen, { once: true });
window.addEventListener('orientationchange', () => setTimeout(tentarFullscreen, 300));