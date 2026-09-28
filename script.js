/*
  ===========================================================================
  Tela inicial navegável + Tela de Cursos.
  Na tela de Cursos, existem 3 imagens separadas (rockseat/IFPE/cocacola),
  cada uma com posição própria no CSS. O JS mostra só a do curso ativo
  (classe ".oculto" nas outras) — nunca 2 visíveis ao mesmo tempo.
  Ordem fixa: rockseat -> IFPE -> cocacola.

  ALTERAÇÃO (setinha da home): em Contact e Skills a setinha agora fica
  ao LADO DIREITO do botão, apontando para a esquerda, e pula direto
  (corte seco, sem animação) entre um e outro. Nos botões de baixo (Cursos/Projetos/
  Formação) ela continua em cima, apontando para baixo.
  ===========================================================================
*/

// --------------------- CAMINHOS DOS ASSETS ---------------------
const DPAD_PATH = 'images/components_ext/dpad/';
const AB_PATH   = 'images/components_ext/ab/';
const BG_PATH   = 'images/background/';

const TELA_PRETA = BG_PATH + 'tela_preta.png';

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
  TELA_PRETA,
]);

// --------------------- MENU SELECIONÁVEL DA HOME ---------------------
const HOME_PATH = 'images/pages/home/components_int/';

const menuItens = {
  // Name: não tem imagem de hover, então normal e select são a mesma.
  // (pega o elemento pela classe, então não precisa mexer no HTML)
  name:     { el: document.querySelector('.home-label-name'),
              normal: HOME_PATH + 'name.png',
              select: HOME_PATH + 'name.png' },
  contact:  { el: document.getElementById('contactLabel'),
              normal: HOME_PATH + 'contatct/contact.png',
              select: HOME_PATH + 'contatct/contact.png' }, // sem hover: mesma imagem do estado normal
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
  name:     { down: 'contact' },
  contact:  { up: 'name', down: 'skills' },
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
const telaHome     = document.getElementById('homeScreen');
const telaSkills   = document.getElementById('skillsPage');
const telaCursos   = document.getElementById('cursosPage');
const telaCheia    = document.getElementById('telaCheiaPage');
const telaCheiaImg = document.getElementById('telaCheiaImg');
const telaFlash    = document.getElementById('telaFlash');
const telaFlashImg = document.getElementById('telaFlashImg');
let telaAtual = 'home';

let transicionando = false;

// --------------------- FADE ATÉ PRETO (transição entre telas, estilo Game Boy) ---------------------
// Ao trocar de tela: escurece em DEGRAUS (não é um fade liso — usa steps(),
// o mesmo efeito "8-bit" já usado nas outras animações do site) até ficar
// 100% preto, segura um instante nesse preto, troca as telas por baixo
// (já escondido) e então clareia de volta em degraus, revelando a tela
// de destino já pronta.
const FADE_ESCURECER_MS = 130; // tempo pra escurecer totalmente
const FADE_PRETO_MS     = 50;  // tempo que fica 100% preto antes de trocar
const FADE_CLAREAR_MS   = 130; // tempo pra clarear de volta, revelando a tela nova
const FADE_DEGRAUS      = 4;   // quantidade de "degraus" da transição — mais alto = mais suave, mais baixo = mais "picado"

function trocarTela(de, para, reverso, aoTerminar) {
  if (!de || !para) {
    console.error('Faltam ids no HTML: homeScreen / skillsPage / cursosPage');
    return;
  }

  transicionando = true;

  telaFlashImg.src = TELA_PRETA;
  telaFlash.hidden = false;
  telaFlash.style.transition = 'none';
  telaFlash.style.opacity = '0';
  telaFlash.getBoundingClientRect(); // força o navegador a aplicar o opacity 0 antes de animar

  requestAnimationFrame(() => {
    telaFlash.style.transition = `opacity ${FADE_ESCURECER_MS}ms steps(${FADE_DEGRAUS}, jump-end)`;
    telaFlash.style.opacity = '1';
  });

  setTimeout(() => {
    // aqui a tela já está 100% preta: troca por baixo, ninguém vê o corte
    de.hidden = true;
    para.hidden = false;

    setTimeout(() => {
      telaFlash.style.transition = `opacity ${FADE_CLAREAR_MS}ms steps(${FADE_DEGRAUS}, jump-end)`;
      telaFlash.style.opacity = '0';

      setTimeout(() => {
        telaFlash.style.transition = 'none';
        telaFlash.hidden = true;
        transicionando = false;
        aoTerminar();
      }, FADE_CLAREAR_MS);
    }, FADE_PRETO_MS);
  }, FADE_ESCURECER_MS);
}

function telaDe(nome) {
  if (nome === 'home') return telaHome;
  if (nome === 'skills') return telaSkills;
  if (nome === 'cursos') return telaCursos;
  if (nome === 'telaCheia') return telaCheia;
  return null;
}

function abrirSubTela(nome) {
  if (transicionando) return;
  trocarTela(telaHome, telaDe(nome), false, () => {
    telaAtual = nome;
    if (nome === 'cursos') {
      cursoFoco = 'lista'; // sempre entra na tela de cursos com o título na cor base
      atualizarCurso();
    }
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
    if (cursoFoco === 'expandir') {
      ativarExpandir(); // aqui entra futuramente a ação real de ampliar a foto do curso
    }
  }
}

function acaoB() {
  if (telaAtual === 'telaCheia') {
    if (transicionando) return;
    trocarTela(telaCheia, telaCursos, true, () => { telaAtual = 'cursos'; });
  } else if (telaAtual !== 'home') {
    voltarHome();
  }
}

function mover(direcao) {
  if (transicionando) return;
  if (telaAtual === 'home') {
    const proximo = navegacao[selecionado][direcao];
    if (proximo) selecionar(proximo);
  } else if (telaAtual === 'cursos') {
    if (direcao === 'up' || direcao === 'down') {
      if (cursoFoco === 'lista') {
        // Na lista, cima/baixo trocam de curso normalmente.
        moverCurso(direcao);
      } else if (cursoFoco === 'titulo' && direcao === 'down') {
        // Do título, descer leva pro botão de ampliar (abaixo da foto).
        cursoFoco = 'expandir';
        atualizarCurso();
      } else if (cursoFoco === 'expandir' && direcao === 'up') {
        // Do botão de ampliar, subir volta pro título.
        cursoFoco = 'titulo';
        atualizarCurso();
      }
      // Demais combinações (ex: 'up' no título, 'down' no expandir) não fazem nada:
      // são as pontas dessa "sessão" separada da lista.
    } else if (direcao === 'right') {
      if (cursoFoco === 'lista') {
        cursoFoco = 'titulo'; // entra no título: some o hover da lista, título fica colorido
        atualizarCurso();
      }
    } else if (direcao === 'left') {
      if (cursoFoco === 'titulo' || cursoFoco === 'expandir') {
        cursoFoco = 'lista'; // sai da sessão título/expandir: volta o hover na lista
        atualizarCurso();
      }
    }
  }
}

// --------------------- SETINHAS PIXELADAS (home) ---------------------
// Existem 2 setinhas (mesma arte, girada):
//  - setaCima : fica EM CIMA do botão, apontando pra baixo (Cursos/Projetos/Formação)
//  - setaLado : fica À DIREITA do botão, apontando pra esquerda (Contact/Skills)
// Só uma aparece por vez, conforme "posicaoSeta" abaixo.
const SETA_BAIXO_PIXELS = [
  '#########',
  '#rrrrrrr#',
  '.#rrrrr#.',
  '..#rrr#..',
  '...#r#...',
  '....#....',
];
const SETA_ESQUERDA_PIXELS = [
  '....##',
  '...#r#',
  '..#rr#',
  '.#rrr#',
  '#rrrr#',
  '.#rrr#',
  '..#rr#',
  '...#r#',
  '....##',
];
const SETA_COR_CONTORNO = '#2B2B2B';
const SETA_COR_MIOLO    = '#E23C3C';

const SETA_LARGURA   = 3.2;  // largura da setinha de cima (% da largura da tela)
const SETA_LARGURA_H = 2.2;  // largura da setinha lateral (% da largura da tela)
const SETA_H_GAP     = 0.3;  // distância MÍNIMA entre a setinha lateral e a imagem, no ponto em que ela chega mais perto (% da largura da tela)

// Onde a setinha fica em cada item: 'direita' (lateral, apontando pra esquerda) ou 'cima'
const posicaoSeta = {
  name:     'direita',
  contact:  'direita',
  skills:   'direita',
  cursos:   'cima',
  projetos: 'cima',
  formacao: 'cima',
};

// Ajuste fino por item, em % da largura da tela.
// x positivo -> direita | y positivo -> desce
const ajusteSeta = {
  name:     { x: 0, y: 0 },
  contact:  { x: 0, y: 0 },
  skills:   { x: 0, y: 0 },
  cursos:   { x: 0, y: 0 },
  projetos: { x: 0, y: 0 },
  formacao: { x: 0, y: 0 },
};

function criarSeta(pixels) {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'absolute', pointerEvents: 'none', zIndex: '5', display: 'none',
  });

  el.innerHTML =
    `<svg viewBox="0 0 ${pixels[0].length} ${pixels.length}" width="100%" height="100%" shape-rendering="crispEdges" style="display:block">` +
    pixels.map((linha, y) => [...linha].map((ch, x) => {
      if (ch === '.') return '';
      const cor = ch === '#' ? SETA_COR_CONTORNO : SETA_COR_MIOLO;
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="${cor}"/>`;
    }).join('')).join('') +
    '</svg>';

  if (telaHome) telaHome.appendChild(el);
  return el;
}

const setaCima = criarSeta(SETA_BAIXO_PIXELS);
const setaLado = criarSeta(SETA_ESQUERDA_PIXELS);

// Setinha de cima: balança pra baixo (em direção ao botão)
setaCima.animate([
  { transform: 'translateY(0)',   offset: 0,   easing: 'steps(1, jump-end)' },
  { transform: 'translateY(45%)', offset: 0.5, easing: 'steps(1, jump-end)' },
  { transform: 'translateY(0)',   offset: 1 },
], { duration: 700, iterations: Infinity });

// Setinha lateral: balança pra esquerda (em direção ao botão)
setaLado.animate([
  { transform: 'translateX(0)',   offset: 0,   easing: 'steps(1, jump-end)' },
  { transform: 'translateX(-45%)', offset: 0.5, easing: 'steps(1, jump-end)' },
  { transform: 'translateX(0)',   offset: 1 },
], { duration: 700, iterations: Infinity });

function posicionarSeta() {
  if (!telaHome || !menuItens[selecionado]) return;

  const tela = telaHome.getBoundingClientRect();
  if (tela.width === 0) return;

  const modo   = posicaoSeta[selecionado] || 'cima';
  const lateral = modo === 'direita';
  const ativa   = lateral ? setaLado : setaCima;
  const inativa = lateral ? setaCima : setaLado;

  const item = menuItens[selecionado].el.getBoundingClientRect();
  const aj   = ajusteSeta[selecionado] || { x: 0, y: 0 };

  let w, h, left, top;

  if (lateral) {
    // À direita do botão, centralizada na altura dele, apontando pra esquerda
    w = tela.width * SETA_LARGURA_H / 100;
    h = w * SETA_ESQUERDA_PIXELS.length / SETA_ESQUERDA_PIXELS[0].length;
    // w * 0.45 = quanto o balanço (translateX -45%) puxa a setinha pra esquerda;
    // somando isso, ela nunca entra na imagem, nem no ponto mais próximo do balanço.
    left = item.right - tela.left + tela.width * SETA_H_GAP / 100 + w * 0.45 + tela.width * aj.x / 100;
    top  = item.top - tela.top + item.height / 2 - h / 2 + tela.width * aj.y / 100;
  } else {
    // Em cima do botão, centralizada na largura dele, apontando pra baixo
    w = tela.width * SETA_LARGURA / 100;
    h = w * SETA_BAIXO_PIXELS.length / SETA_BAIXO_PIXELS[0].length;
    left = item.left - tela.left + item.width / 2 - w / 2 + tela.width * aj.x / 100;
    top  = item.top - tela.top - h * 1.5 + tela.width * aj.y / 100;
  }

  // Sem nenhuma transição: a setinha sempre teleporta direto pra posição nova
  ativa.style.transition = 'none';
  inativa.style.transition = 'none';

  ativa.style.width  = w + 'px';
  ativa.style.height = h + 'px';
  ativa.style.left   = left + 'px';
  ativa.style.top    = top + 'px';
  ativa.style.display = 'block';
  inativa.style.display = 'none';

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

const CURSOS_PATH     = 'images/pages/cursos/';
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
    telaCheia:    CURSOS_INT_PATH + 'curso_rockseat/tela_cheia.png',
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
    telaCheia:    CURSOS_INT_PATH + 'curso_IFPE/tela_cheia.png',
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
    telaCheia:    CURSOS_INT_PATH + 'curso_cocacola/tela_cheia.png',
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

// 'lista'    -> foco está na lista de cursos (esquerda); título fica na cor base.
// 'titulo'   -> foco entrou no título (via seta direita); título fica colorido (hover).
// 'expandir' -> foco desceu pro botão de ampliar (via seta baixo, a partir do título);
//               o botão passa a "piscar", alternando entre os 2 frames dele.
let cursoFoco = 'lista';

// Aplica no título do painel a imagem correspondente ao foco atual
// (base quando cursoFoco === 'lista', hover/colorido quando === 'titulo').
function aplicarEstadoTitulo() {
  const idAtivo = ORDEM_CURSOS[cursoIndex];
  const dadosAtivo = cursosData[idAtivo];
  painelEl.titulo.src = (cursoFoco === 'titulo') ? dadosAtivo.tituloHover : dadosAtivo.titulo;
}

// Mostra o hover (selectImg) do curso ativo na lista da esquerda —
// mas só quando o foco está na lista (cursoFoco === 'lista'). Se o
// foco foi pro título (seta direita), o hover da lista some, como
// se a seleção tivesse "andado" da lista para o título.
function atualizarListaCursos() {
  const idAtivo = ORDEM_CURSOS[cursoIndex];

  ORDEM_CURSOS.forEach(id => {
    const dados = cursosData[id];
    const estaSelecionadoNaLista = (id === idAtivo) && (cursoFoco === 'lista');

    if (estaSelecionadoNaLista) {
      dados.el.src = dados.selectImg;
      dados.el.classList.remove('oculto');
    } else {
      dados.el.classList.add('oculto');
    }
  });
}

// Atualiza tudo: hover da lista, título (base ou colorido), estado do
// botão de ampliar (parado ou piscando) e o conteúdo do painel (foto,
// carga horária, data, status, texto) referentes ao curso ativo.
function atualizarCurso() {
  atualizarListaCursos();
  aplicarEstadoTitulo();
  aplicarEstadoExpandir();

  const dadosAtivo = cursosData[ORDEM_CURSOS[cursoIndex]];
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

// --------------------- BOTÃO DE AMPLIAR: pisca e muda de posição quando selecionado ---------------------
// Só reage ao d-pad/A — nunca ao mouse. Enquanto cursoFoco !== 'expandir'
// ele fica parado no frame base (EXPANDIR_FRAME_1), na posição "normal"
// definida em .curso-expandir no CSS. Quando o foco entra nele (seta baixo
// a partir do título), a classe 'selecionado' é adicionada: isso troca a
// posição dele (regra .curso-expandir.selecionado no CSS, sem transition,
// então a troca de posição é um corte seco) e liga o piscar contínuo entre
// EXPANDIR_FRAME_1 e EXPANDIR_FRAME_2, dando a impressão de animado.
const EXPANDIR_FRAME_1 = CURSOS_PATH + 'expandir.png';
const EXPANDIR_FRAME_2 = CURSOS_PATH + 'expandir_2.png';
const EXPANDIR_ANIM_MS = 350; // velocidade da piscada — ajuste se quiser mais rápido/lento

let expandirAnimTimer = null;
let expandirFrameAtual = 0;

function iniciarAnimacaoExpandir() {
  pararAnimacaoExpandir();
  expandirFrameAtual = 0;
  painelEl.expandir.src = EXPANDIR_FRAME_1;
  painelEl.expandir.classList.add('selecionado'); // ativa a posição "animado" (CSS) — corte seco
  expandirAnimTimer = setInterval(() => {
    expandirFrameAtual = expandirFrameAtual === 0 ? 1 : 0;
    painelEl.expandir.src = expandirFrameAtual === 0 ? EXPANDIR_FRAME_1 : EXPANDIR_FRAME_2;
  }, EXPANDIR_ANIM_MS);
}

function pararAnimacaoExpandir() {
  if (expandirAnimTimer) {
    clearInterval(expandirAnimTimer);
    expandirAnimTimer = null;
  }
  painelEl.expandir.src = EXPANDIR_FRAME_1; // parado, sempre no frame base
  painelEl.expandir.classList.remove('selecionado'); // volta pra posição "normal" (CSS) — corte seco
}

function aplicarEstadoExpandir() {
  if (cursoFoco === 'expandir') {
    iniciarAnimacaoExpandir();
  } else {
    pararAnimacaoExpandir();
  }
}

// Chamada pelo botão A quando o foco está no botão de ampliar.
// Abre a tela cheia (tela_cheia.png) do curso que está ativo no momento,
// usando a mesma transição das outras trocas de tela. O B (acaoB) volta
// dessa tela cheia direto pra tela de cursos, mantendo o foco em 'expandir'
// e o curso que já estava selecionado.
function ativarExpandir() {
  if (transicionando) return;

  const idAtivo = ORDEM_CURSOS[cursoIndex];
  telaCheiaImg.src = cursosData[idAtivo].telaCheia;

  trocarTela(telaCursos, telaCheia, false, () => { telaAtual = 'telaCheia'; });
}

precarregar([
  CURSOS_PATH + 'cursos_page.png',
  CURSOS_PATH + 'CLIQUE_B.png',
  EXPANDIR_FRAME_1, EXPANDIR_FRAME_2,
  ...ORDEM_CURSOS.flatMap(id => [
    cursosData[id].selectImg,
    cursosData[id].foto, cursosData[id].cargaHoraria, cursosData[id].data,
    cursosData[id].status, cursosData[id].texto,
    cursosData[id].titulo, cursosData[id].tituloHover,
    cursosData[id].telaCheia,
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