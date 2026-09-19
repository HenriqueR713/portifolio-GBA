/*
  ===========================================================================
  Tela inicial navegável: só troca as imagens no hover/toque, sem navegar
  pra nenhuma página ou seção. Os botões "Cursos / Projetos / Formação"
  no cartão central propositalmente não têm nenhum listener ainda.
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

// --------------------- PRELOAD (evita "flash" na primeira troca) ---------------------
function precarregar(urls) {
  urls.forEach(src => { const img = new Image(); img.src = src; });
}

precarregar([
  ...Object.values(dpadStates),
  abStates.a.normal, abStates.a.select,
  abStates.b.normal, abStates.b.select,
]);

// --------------------- D-PAD: 4 zonas — ativa só enquanto pressionado ---------------------
const dpadImg = document.getElementById('dpadImg');

document.querySelectorAll('.dpad-zone').forEach(zone => {
  const direcao = zone.dataset.dir;

  const ativar   = () => { dpadImg.src = dpadStates[direcao]; };
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
function configurarBotaoAB(elementId, estados) {
  const btn = document.getElementById(elementId);

  const ativar    = () => { btn.src = estados.select; };
  const desativar = () => { btn.src = estados.normal; };

  btn.addEventListener('mousedown', ativar);
  btn.addEventListener('mouseup', desativar);
  btn.addEventListener('mouseleave', desativar); // solta se arrastar pra fora ainda segurando
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); ativar(); }, { passive: false });
  btn.addEventListener('touchend',   (e) => { e.preventDefault(); desativar(); }, { passive: false });
}

configurarBotaoAB('btnA', abStates.a);
configurarBotaoAB('btnB', abStates.b);