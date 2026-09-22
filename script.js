/*
  ===========================================================================
  Tela inicial navegável: o D-pad (tela, toque ou setas do teclado) move a
  seleção entre Contact / Skills / Cursos / Projetos / Formação.
  Nenhum botão navega para outra página ainda.
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

// Sprite animado (idle) da tela de Skills
const SKILLS_SPRITE_PATH = 'images/pages/skills/animation_pixel/preview.webp';

// --------------------- PRELOAD (evita "flash" na primeira troca) ---------------------
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

// Mapa de navegação: pra onde cada direção leva a partir de cada item.
// Direção que não existe na lista = não faz nada (como num menu de GBA de verdade).
const navegacao = {
  contact:  { down: 'skills' },
  skills:   { up: 'contact', down: 'cursos' },
  cursos:   { up: 'skills', right: 'projetos' },
  projetos: { up: 'skills', left: 'cursos', right: 'formacao' },
  formacao: { up: 'skills', left: 'projetos' },
};

let selecionado = 'contact'; // item que começa selecionado

function selecionar(id) {
  menuItens[selecionado].el.src = menuItens[selecionado].normal; // apaga o anterior
  menuItens[selecionado].el.classList.remove('selecionado');
  selecionado = id;
  menuItens[id].el.src = menuItens[id].select;                   // acende o novo
  menuItens[id].el.classList.add('selecionado');
  posicionarSeta();
}

// --------------------- TELAS (home / skills) ---------------------
const telaHome   = document.getElementById('homeScreen');
const telaSkills = document.getElementById('skillsPage');
let telaAtual = 'home';

// --------------------- TRANSIÇÃO EM PIXEL (círculo) ---------------------
// Ajustes: mais colunas/linhas = pixels menores (mantenha a proporção 3:2).
// Ex.: 15x10 = pixel grande | 30x20 = médio | 60x40 = pequeno.
const TRANS_COLS   = 30;
const TRANS_ROWS   = 20;
const TRANS_PASSOS = 12;  // quantos "quadros" a transição tem
const TRANS_MS     = 30;  // duração de cada quadro (12 x 30 = 360ms)

let transicionando = false;

// Monta o recorte (em blocos) da tela que está entrando.
// Normal: o círculo abre do centro pra fora. Reverso: fecha das bordas pro centro.
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
      // +1px de sobra evita frestas entre blocos vizinhos
      const x1 = Math.floor(ini * bw), y1 = Math.floor(r * bh);
      const x2 = Math.ceil(c * bw) + 1, y2 = Math.ceil((r + 1) * bh) + 1;
      d += `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
    }
  }
  return d ? `path('${d}')` : 'inset(100%)';
}

// 'de' = tela que sai | 'para' = tela que entra por cima, revelada em blocos
function trocarTela(de, para, reverso, aoTerminar) {
  if (!de || !para) {
    console.error('Faltam os ids no HTML: homeScreen e/ou skillsPage');
    return;
  }

  // Navegador sem suporte a clip-path: path() troca direto, sem transição
  if (!CSS.supports('clip-path', "path('M0 0Z')")) {
    de.hidden = true;
    para.hidden = false;
    aoTerminar();
    return;
  }

  transicionando = true;
  para.style.clipPath = 'inset(100%)'; // começa totalmente escondida
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

function abrirSkills() {
  if (transicionando) return;
  trocarTela(telaHome, telaSkills, false, () => { telaAtual = 'skills'; });
}

function voltarHome() {
  if (transicionando) return;
  trocarTela(telaSkills, telaHome, true, () => { telaAtual = 'home'; posicionarSeta(); });
}

// Botão A: confirma o item selecionado (por enquanto só o Skills faz algo)
function acaoA() {
  if (telaAtual === 'home' && selecionado === 'skills') abrirSkills();
}

// Botão B: volta para a tela do portfólio
function acaoB() {
  if (telaAtual !== 'home') voltarHome();
}

function mover(direcao) {
  if (telaAtual !== 'home' || transicionando) return; // fora da home (ou em transição) o D-pad não move o menu
  const proximo = navegacao[selecionado][direcao];
  if (proximo) selecionar(proximo);
}

// --------------------- SETINHA PIXELADA (estilo Pokémon Emerald) ---------------------
// Uma seta que sobe e desce em cima do item selecionado.
// '#' = contorno | 'r' = preenchimento | '.' = vazio
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
const SETA_LARGURA      = 3.2;  // largura da seta, em % da largura da tela

// Ajuste fino por item, em % da largura da tela.
// x: negativo = esquerda, positivo = direita | y: negativo = sobe, positivo = desce
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

// Sobe e desce em dois "degraus", sem suavizar (visual de pixel)
seta.animate([
  { transform: 'translateY(0)',   offset: 0,   easing: 'steps(1, jump-end)' },
  { transform: 'translateY(45%)', offset: 0.5, easing: 'steps(1, jump-end)' },
  { transform: 'translateY(0)',   offset: 1 },
], { duration: 700, iterations: Infinity });

function posicionarSeta() {
  if (!telaHome || !menuItens[selecionado]) return;

  const tela = telaHome.getBoundingClientRect();
  if (tela.width === 0) return; // home escondida (ex.: dentro do Skills) — nada a medir

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

// Recalcula quando a tela muda de tamanho, orientação, entra/sai da tela
// cheia, ou as imagens terminam de carregar — mantendo a setinha sempre
// alinhada com o item selecionado, em qualquer situação.
window.addEventListener('resize', posicionarSeta);
window.addEventListener('orientationchange', () => setTimeout(posicionarSeta, 300));
document.addEventListener('fullscreenchange', () => setTimeout(posicionarSeta, 50));
window.addEventListener('load', posicionarSeta);

// Pré-carrega as imagens de select e já deixa o primeiro item aceso
precarregar(Object.values(menuItens).flatMap(i => [i.normal, i.select]));
selecionar(selecionado);

// --------------------- D-PAD: 4 zonas — ativa só enquanto pressionado ---------------------
const dpadImg = document.getElementById('dpadImg');

document.querySelectorAll('.dpad-zone').forEach(zone => {
  const direcao = zone.dataset.dir;

  const ativar    = () => { dpadImg.src = dpadStates[direcao]; mover(direcao); };
  const desativar = () => { dpadImg.src = dpadStates.default; };

  // mouse (desktop) — só enquanto o botão do mouse estiver pressionado
  zone.addEventListener('mousedown', ativar);
  zone.addEventListener('mouseup', desativar);
  zone.addEventListener('mouseleave', desativar); // solta se arrastar pra fora ainda segurando

  // toque (celular/tablet)
  zone.addEventListener('touchstart', (e) => { e.preventDefault(); ativar(); }, { passive: false });
  zone.addEventListener('touchend',   (e) => { e.preventDefault(); desativar(); }, { passive: false });
});

// --------------------- BOTÕES A e B — ativa só enquanto pressionado ---------------------
function configurarBotaoAB(elementId, estados, acao) {
  const btn = document.getElementById(elementId);

  const ativar    = () => { btn.src = estados.select; acao(); };
  const desativar = () => { btn.src = estados.normal; };

  btn.addEventListener('mousedown', ativar);
  btn.addEventListener('mouseup', desativar);
  btn.addEventListener('mouseleave', desativar); // solta se arrastar pra fora ainda segurando
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
    e.preventDefault(); // evita rolar a página com as setas
    dpadImg.src = dpadStates[direcao];
    if (!e.repeat) mover(direcao); // e.repeat evita o cursor "correr" ao segurar a seta
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
// Navegadores mobile só permitem pedir fullscreen logo após um toque do
// usuário — por isso escutamos o primeiro toque na tela pra disparar isso.
function estaDeitado() {
  return window.matchMedia('(orientation: landscape)').matches;
}

function tentarFullscreen() {
  if (estaDeitado() && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      // alguns navegadores (ex: Safari iOS) não suportam Fullscreen API — sem problema,
      // o dvh acima já ajuda bastante mesmo sem a tela cheia de verdade.
    });
  }
}

document.addEventListener('touchend', tentarFullscreen, { once: true });
window.addEventListener('orientationchange', () => setTimeout(tentarFullscreen, 300));