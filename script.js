/*
  ===========================================================================
  Tela inicial navegável + Tela de Cursos.
  Na tela de Cursos, existem 3 imagens separadas (rockseat/IFPE/cocacola),
  cada uma com posição própria no CSS. O JS mostra só a do curso ativo
  (classe ".oculto" nas outras) — nunca 2 visíveis ao mesmo tempo.
  Ordem fixa: rockseat -> IFPE -> cocacola.

  Setinha da home: em Name/Contact/Skills fica ao LADO DIREITO do botão,
  apontando para a esquerda. Nos botões de baixo (Cursos/Projetos/Formação)
  fica em cima, apontando para baixo.

  Apertar A no Contact abre o contact_select, esconde a setinha e mostra
  os ícones de WhatsApp / LinkedIn / Instagram / GitHub.
  Com o contato aberto, apertar A no ícone selecionado abre o link da rede.
  Tudo some (e a setinha volta) quando apertar cima/baixo no d-pad.
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
              select: HOME_PATH + 'contatct/contact.png', // sem hover: mesma imagem do estado normal
              aberto: HOME_PATH + 'contatct/contact_select.png' }, // imagem ao apertar A
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
let contatoAberto = false; // true enquanto o contact_select estiver aberto

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
const telaProjetos = document.getElementById('projetosPage');
const telaCheia    = document.getElementById('telaCheiaPage');
const telaCheiaImg = document.getElementById('telaCheiaImg');
const telaFlash    = document.getElementById('telaFlash');
const telaFlashImg = document.getElementById('telaFlashImg');
let telaAtual = 'home';

let transicionando = false;

// --------------------- FADE ATÉ PRETO (transição entre telas, estilo Game Boy) ---------------------
// Escurece em DEGRAUS (steps) até ficar 100% preto, segura um instante,
// troca as telas por baixo (já escondido) e clareia de volta em degraus.
const FADE_ESCURECER_MS = 130; // tempo pra escurecer totalmente
const FADE_PRETO_MS     = 50;  // tempo que fica 100% preto antes de trocar
const FADE_CLAREAR_MS   = 130; // tempo pra clarear de volta, revelando a tela nova
const FADE_DEGRAUS      = 4;   // quantidade de "degraus" — mais alto = mais suave, mais baixo = mais "picado"

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
  if (nome === 'projetos') return telaProjetos;
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
    if (nome === 'projetos') {
      projetoFoco = 'lista'; // sempre entra na tela de projetos com o foco na lista
      atualizarProjeto();
    }
  });
}

function voltarHome() {
  if (transicionando) return;
  trocarTela(telaDe(telaAtual), telaHome, true, () => { telaAtual = 'home'; posicionarSeta(); });
}

// --------------------- CONTACT: abrir / fechar ---------------------
// O #skillsBadge é posicionado em % da altura do .home-info, e essa altura
// depende das imagens name/contact. Se o contact_select tiver altura diferente,
// o skills se mexia. Por isso congelamos a altura do .home-info em px enquanto
// o contato está aberto.
const homeInfoEl = document.querySelector('.home-info');

// container com os ícones de whatsapp / linkedin / instagram / github
const contatoLinksEl = document.getElementById('contatoLinks');

// Ícones navegáveis com o d-pad (esquerda/direita), NA ORDEM em que
// aparecem na tela, da esquerda pra direita. Se mudar as posições no CSS,
// troque a ordem aqui também (e a ordem em CONTATO_URLS, logo abaixo).
const contatoIcones = [
  document.getElementById('linkLinkedin'),
  document.getElementById('linkWhatsapp'),
  document.getElementById('linkInstagram'),
  document.getElementById('linkGithub'),
];

// NOVO: links de cada ícone, NA MESMA ORDEM de contatoIcones acima.
const CONTATO_URLS = [
  'https://www.linkedin.com/in/henrique-ramos-de-moura-2448693ba?utm_source=share_via&utm_content=profile&utm_medium=member_android', // LinkedIn
  'https://wa.me/5581985103175',                                                                                                       // WhatsApp
  'https://www.instagram.com/hick.dev/',                                                                                               // Instagram
  'https://github.com/HenriqueR713',                                                                                                   // GitHub
];

let contatoIndex = 0; // qual ícone está com o hover

// Liga o hover (classe "selecionado") só no ícone ativo, e só com o contato aberto.
function atualizarIconeContato() {
  contatoIcones.forEach((el, i) => {
    el.classList.toggle('selecionado', contatoAberto && i === contatoIndex);
  });
}

function moverIconeContato(direcao) {
  let proximo = contatoIndex;
  if (direcao === 'right') proximo = Math.min(contatoIcones.length - 1, contatoIndex + 1);
  if (direcao === 'left')  proximo = Math.max(0, contatoIndex - 1);

  if (proximo !== contatoIndex) {
    contatoIndex = proximo;
    atualizarIconeContato();
  }
}

// NOVO: abre o link do ícone que está selecionado, em nova aba
function abrirLinkContato() {
  const url = CONTATO_URLS[contatoIndex];
  if (url) window.open(url, '_blank', 'noopener');
}

function congelarAlturaHomeInfo() {
  homeInfoEl.style.height = '';                               // mede a altura natural
  homeInfoEl.style.height = homeInfoEl.offsetHeight + 'px';   // e trava
}

function liberarAlturaHomeInfo() {
  homeInfoEl.style.height = '';
}

window.addEventListener('resize', () => {
  if (contatoAberto) {
    // recalcula com o contact normal, senão a medida ficaria errada
    menuItens.contact.el.src = menuItens.contact.select;
    congelarAlturaHomeInfo();
    menuItens.contact.el.src = menuItens.contact.aberto;
  }
});

function abrirContato() {
  if (contatoAberto) return;
  congelarAlturaHomeInfo(); // ANTES de trocar a imagem
  contatoAberto = true;
  menuItens.contact.el.classList.add('aberto'); // permite posicionar/dimensionar só o contact_select via CSS
  menuItens.contact.el.src = menuItens.contact.aberto;
  contatoLinksEl.hidden = false; // mostra whatsapp/linkedin/instagram/github
  contatoIndex = 0;              // sempre começa no primeiro ícone
  atualizarIconeContato();       // liga o hover nele
  posicionarSeta(); // some com a setinha
}

function fecharContato() {
  if (!contatoAberto) return;
  contatoAberto = false;
  menuItens.contact.el.classList.remove('aberto');
  menuItens.contact.el.src = menuItens.contact.select; // volta ao estado normal
  contatoLinksEl.hidden = true; // esconde os ícones
  atualizarIconeContato();      // tira o hover de todos
  liberarAlturaHomeInfo();
}

function acaoA() {
  if (telaAtual === 'home') {
    if (selecionado === 'contact') {
      // NOVO: se o contato já está aberto, A abre o link do ícone selecionado.
      // Se ainda está fechado, A abre o contato (como antes).
      if (contatoAberto) abrirLinkContato();
      else abrirContato();
    }
    if (selecionado === 'skills') abrirSubTela('skills');
    if (selecionado === 'cursos') abrirSubTela('cursos');
    if (selecionado === 'projetos') abrirSubTela('projetos');
  } else if (telaAtual === 'projetos') {
    // A no botão de link abre o link do projeto ativo em nova aba
    if (projetoFoco === 'link') {
      const link = projetosData[ORDEM_PROJETOS[projetoIndex]].link;
      if (link) window.open(link, '_blank', 'noopener');
    }
  } else if (telaAtual === 'cursos') {
    if (cursoFoco === 'titulo') {
      // A no título colorido abre o link do curso ativo em nova aba
      const link = cursosData[ORDEM_CURSOS[cursoIndex]].link;
      if (link) window.open(link, '_blank', 'noopener');
    } else if (cursoFoco === 'expandir') {
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
    if (contatoAberto) {
      // esquerda/direita navegam entre os ícones das redes sociais
      if (direcao === 'left' || direcao === 'right') {
        moverIconeContato(direcao);
        return;
      }
      // cima/baixo saem do contato aberto
      fecharContato();
    }
    const proximo = navegacao[selecionado][direcao];
    if (proximo) selecionar(proximo);
    else posicionarSeta(); // cima/baixo sem destino: garante que a setinha reapareça
  } else if (telaAtual === 'projetos') {
    if (direcao === 'up' || direcao === 'down') {
      // Só troca de projeto enquanto o foco está na lista.
      if (projetoFoco === 'lista') moverProjeto(direcao);
    } else if (direcao === 'right') {
      if (projetoFoco === 'lista') {
        projetoFoco = 'link'; // entra no botão de link: some o hover da lista, o botão pisca
        atualizarProjeto();
      }
    } else if (direcao === 'left') {
      if (projetoFoco === 'link') {
        projetoFoco = 'lista'; // volta pra lista: volta o hover
        atualizarProjeto();
      }
    }
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
      // Demais combinações não fazem nada: são as pontas dessa "sessão" separada da lista.
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
//  - setaLado : fica À DIREITA do botão, apontando pra esquerda (Name/Contact/Skills)
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
const SETA_H_GAP     = 0.3;  // distância MÍNIMA entre a setinha lateral e a imagem (% da largura da tela)

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
  name:     { x: -5, y: 0 },
  contact:  { x: -27, y: 0 },
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

  // contato aberto -> nenhuma setinha aparece
  if (contatoAberto && selecionado === 'contact') {
    setaCima.style.display = 'none';
    setaLado.style.display = 'none';
    return;
  }

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

// Preload: inclui a imagem "aberto" (quando existir)
precarregar(Object.values(menuItens).flatMap(i => [i.normal, i.select, i.aberto].filter(Boolean)));

// Preload dos ícones de contato
precarregar([
  HOME_PATH + 'contatct/whatsapp.png',
  HOME_PATH + 'contatct/linkedin.png',
  HOME_PATH + 'contatct/instagram.png',
  HOME_PATH + 'contatct/github.png',
]);

selecionar(selecionado);

// ===========================================================================
// TELA DE CURSOS
// ===========================================================================

const CURSOS_PATH     = 'images/pages/cursos/';
const CURSOS_BTN_PATH = 'images/pages/cursos/page_base_components/';
const CURSOS_INT_PATH = 'images/pages/cursos/components_int/';

// Cada curso tem "el": o elemento HTML próprio dele (#itemRockseat etc),
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
    link:         'https://www.rocketseat.com.br/',
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
    link:         'https://ifrs.edu.br/',
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
    link:         'https://www.coca-cola.com/br/pt/offerings/instituto-coca-cola-brasil/coletivo-coca-cola-jovem',
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
function aplicarEstadoTitulo() {
  const idAtivo = ORDEM_CURSOS[cursoIndex];
  const dadosAtivo = cursosData[idAtivo];
  painelEl.titulo.src = (cursoFoco === 'titulo') ? dadosAtivo.tituloHover : dadosAtivo.titulo;
}

// Mostra o hover (selectImg) do curso ativo na lista da esquerda,
// mas só quando o foco está na lista.
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

// Atualiza tudo: hover da lista, título, botão de ampliar e painel do curso ativo.
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
// Só reage ao d-pad/A — nunca ao mouse. Quando o foco entra nele, a classe
// 'selecionado' troca a posição (corte seco, sem transition) e liga o piscar
// contínuo entre EXPANDIR_FRAME_1 e EXPANDIR_FRAME_2.
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
// Abre a tela cheia do curso ativo. O B volta dela direto pra tela de cursos.
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

// ===========================================================================
// TELA DE PROJETOS
// Mesmo conceito da tela de Cursos: cada projeto tem sua imagem de hover
// própria na lista (esquerda), e o painel (direita) mostra foto, skills,
// data, status, texto e o botão de link. Não tem título nem tela cheia.
// ===========================================================================

const PROJETOS_PATH     = 'images/pages/projetos/';
const PROJETOS_BTN_PATH = 'images/pages/projetos/page_base_components/';
const PROJETOS_INT_PATH = 'images/pages/projetos/components_int/';

// Função auxiliar: monta o objeto de um projeto a partir da pasta e do hover.
function criarProjeto(elId, hoverFile, pasta, link) {
  const base = PROJETOS_INT_PATH + pasta + '/';
  return {
    el:        document.getElementById(elId),
    selectImg: PROJETOS_BTN_PATH + hoverFile,
    foto:      base + 'foto.png',
    skills:    base + 'skills.png',
    data:      base + 'data.png',
    status:    base + 'status.png',
    texto:     base + 'texto.png',
    link:      link, // '' = ainda sem link (o botão A não faz nada)
  };
}

const projetosData = {
  //                      id do elemento   imagem de hover          pasta             link
  devlink:   criarProjeto('itemDevlink',   'devlink_hover.png',     'devlink',         'https://henriquer713.github.io/Projeto-DevLink-Rockseat/'),
  kuroneko:  criarProjeto('itemKuroneko',  'kuroneko_hover.png',    'kuro_neko',       'https://henriquer713.github.io/Reformulacao-do-site-Kuro-Neko-Coffee-e-Co./'),
  portfolio: criarProjeto('itemPortfolio', 'protifolio_hover.png',  'portifolio_prof', 'https://henriquer713.github.io/henriquedev/'),
  petbel:    criarProjeto('itemPetbel',    'petbel_hover.png',      'petbel',          'https://henriquer713.github.io/Pet-Bel/'),
};

// Ordem de navegação (cima/baixo): devlink -> kuroneko -> portfolio -> petbel
const ORDEM_PROJETOS = ['devlink', 'kuroneko', 'portfolio', 'petbel'];

const painelProjEl = {
  foto:   document.getElementById('projetoFoto'),
  skills: document.getElementById('projetoSkills'),
  data:   document.getElementById('projetoData'),
  status: document.getElementById('projetoStatus'),
  texto:  document.getElementById('projetoTexto'),
  link:   document.getElementById('projetoLink'),
};

let projetoIndex = 0; // começa em devlink

// 'lista' -> foco na lista de projetos (esquerda); mostra o hover do ativo.
// 'link'  -> foco no botão de link (via seta direita); o botão pisca.
let projetoFoco = 'lista';

// Hover do projeto ativo na lista, só quando o foco está na lista.
function atualizarListaProjetos() {
  const idAtivo = ORDEM_PROJETOS[projetoIndex];

  ORDEM_PROJETOS.forEach(id => {
    const dados = projetosData[id];
    const selecionadoNaLista = (id === idAtivo) && (projetoFoco === 'lista');

    if (selecionadoNaLista) {
      dados.el.src = dados.selectImg;
      dados.el.classList.remove('oculto');
    } else {
      dados.el.classList.add('oculto');
    }
  });
}

function atualizarProjeto() {
  atualizarListaProjetos();
  aplicarEstadoLink();

  const dadosAtivo = projetosData[ORDEM_PROJETOS[projetoIndex]];
  painelProjEl.foto.src   = dadosAtivo.foto;
  painelProjEl.skills.src = dadosAtivo.skills;
  painelProjEl.data.src   = dadosAtivo.data;
  painelProjEl.status.src = dadosAtivo.status;
  painelProjEl.texto.src  = dadosAtivo.texto;
}

function moverProjeto(direcao) {
  let proximo = projetoIndex;
  if (direcao === 'down') proximo = Math.min(ORDEM_PROJETOS.length - 1, projetoIndex + 1);
  if (direcao === 'up')   proximo = Math.max(0, projetoIndex - 1);

  if (proximo !== projetoIndex) {
    projetoIndex = proximo;
    atualizarProjeto();
  }
}

// --------------------- BOTÃO DE LINK: pisca quando selecionado ---------------------
// Alterna entre link.png e link_2.png. A classe 'selecionado' troca a posição
// no CSS (corte seco, sem transition).
const LINK_FRAME_1 = PROJETOS_PATH + 'link.png';
const LINK_FRAME_2 = PROJETOS_PATH + 'link_2.png';
const LINK_ANIM_MS = 350; // velocidade da piscada

let linkAnimTimer = null;
let linkFrameAtual = 0;

function iniciarAnimacaoLink() {
  pararAnimacaoLink();
  linkFrameAtual = 0;
  painelProjEl.link.src = LINK_FRAME_1;
  painelProjEl.link.classList.add('selecionado');
  linkAnimTimer = setInterval(() => {
    linkFrameAtual = linkFrameAtual === 0 ? 1 : 0;
    painelProjEl.link.src = linkFrameAtual === 0 ? LINK_FRAME_1 : LINK_FRAME_2;
  }, LINK_ANIM_MS);
}

function pararAnimacaoLink() {
  if (linkAnimTimer) {
    clearInterval(linkAnimTimer);
    linkAnimTimer = null;
  }
  painelProjEl.link.src = LINK_FRAME_1; // parado, sempre no frame base
  painelProjEl.link.classList.remove('selecionado');
}

function aplicarEstadoLink() {
  if (projetoFoco === 'link') iniciarAnimacaoLink();
  else pararAnimacaoLink();
}

precarregar([
  PROJETOS_PATH + 'projetos_page.png',
  LINK_FRAME_1, LINK_FRAME_2,
  ...ORDEM_PROJETOS.flatMap(id => [
    projetosData[id].selectImg,
    projetosData[id].foto, projetosData[id].skills, projetosData[id].data,
    projetosData[id].status, projetosData[id].texto,
  ]),
]);

// Estado inicial da tela de projetos, já pronto pra quando ela abrir
atualizarProjeto();

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