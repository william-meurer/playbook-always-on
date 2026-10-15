/* ==========================================================================
   9barra7 B7 · Comportamentos
   Sem dependências. Tudo é ligado por atributos data-* e exposto em window.B7.
   As respostas da IA e os processos de geração são simulados localmente.
   ========================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ic = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmtTempo = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const fmtBytes = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`;
  const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Rola só o contêiner, sem mexer na página
  const rolaDentro = (cont, el) => {
    const c = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (r.top < c.top) cont.scrollTop -= c.top - r.top + 6;
    else if (r.bottom > c.bottom) cont.scrollTop += r.bottom - c.bottom + 6;
  };
  const B7 = { ic, esc, rolaDentro };

  /* ---- Tema ------------------------------------------------------------- */
  B7.tema = {
    aplicar(t) {
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem('b7-tema', t); } catch (e) {}
      $$('[data-alternar-tema]').forEach((b) => {
        b.setAttribute('aria-label', t === 'dark' ? 'Usar tema claro' : 'Usar tema escuro');
        const u = b.querySelector('use'); if (u) u.setAttribute('href', t === 'dark' ? '#i-sol' : '#i-lua');
      });
    },
    iniciar() {
      let t = null;
      try { t = localStorage.getItem('b7-tema'); } catch (e) {}
      if (!t) t = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      this.aplicar(t);
    },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-alternar-tema]');
    if (b) B7.tema.aplicar(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* ---- Tooltip ---------------------------------------------------------- */
  let dicaEl, dicaTimer, dicaAlvo;
  function mostraDica(alvo, imediato) {
    clearTimeout(dicaTimer);
    dicaTimer = setTimeout(() => {
      if (!dicaEl) { dicaEl = document.createElement('div'); dicaEl.className = 'dica'; dicaEl.setAttribute('role', 'tooltip'); dicaEl.id = 'b7-dica'; document.body.appendChild(dicaEl); }
      dicaAlvo = alvo;
      const kbd = alvo.dataset.dicaAtalho ? `<span class="kbd">${esc(alvo.dataset.dicaAtalho)}</span>` : '';
      dicaEl.innerHTML = esc(alvo.dataset.dica) + kbd;
      alvo.setAttribute('aria-describedby', 'b7-dica');
      const r = alvo.getBoundingClientRect();
      dicaEl.style.left = '0px'; dicaEl.style.top = '0px';
      const d = dicaEl.getBoundingClientRect();
      let lado = alvo.dataset.dicaLado || 'cima';
      if (lado === 'cima' && r.top - d.height - 8 < 0) lado = 'baixo';
      const top = lado === 'cima' ? r.top - d.height - 8 : r.bottom + 8;
      const left = Math.min(Math.max(8, r.left + r.width / 2 - d.width / 2), innerWidth - d.width - 8);
      dicaEl.dataset.lado = lado;
      dicaEl.style.top = top + 'px'; dicaEl.style.left = left + 'px';
      requestAnimationFrame(() => dicaEl.classList.add('is-visivel'));
    }, imediato ? 0 : 350);
  }
  function escondeDica() {
    clearTimeout(dicaTimer);
    if (dicaEl) dicaEl.classList.remove('is-visivel');
    if (dicaAlvo) dicaAlvo.removeAttribute('aria-describedby');
    dicaAlvo = null;
  }
  document.addEventListener('mouseover', (e) => { const a = e.target.closest?.('[data-dica]'); if (a && a !== dicaAlvo) mostraDica(a); else if (!a && dicaAlvo) escondeDica(); });
  document.addEventListener('focusin', (e) => { const a = e.target.closest?.('[data-dica]'); if (a && a.matches(':focus-visible')) mostraDica(a, true); });
  document.addEventListener('focusout', escondeDica);
  document.addEventListener('scroll', escondeDica, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') escondeDica(); });

  /* ---- Menu dropdown ---------------------------------------------------- */
  let menuAberto = null;
  function abreMenu(gatilho) {
    const menu = document.getElementById(gatilho.getAttribute('aria-controls'));
    if (!menu) return;
    if (menuAberto && menuAberto.menu !== menu) fechaMenu();
    // Guarda a direção pedida no HTML e recalcula a cada abertura, para caber na tela
    menu.dataset.base ??= [...menu.classList].filter((c) => c === 'menu--cima' || c === 'menu--dir').join(' ');
    menu.classList.remove('menu--cima', 'menu--dir');
    menu.style.translate = ''; menu.style.maxHeight = ''; menu.style.overflowY = '';
    menu.classList.add('is-aberto');
    gatilho.setAttribute('aria-expanded', 'true');
    const g = gatilho.getBoundingClientRect();
    const h = menu.offsetHeight, w = menu.offsetWidth;
    const abaixo = innerHeight - g.bottom - 14, acima = g.top - 14;
    const querCima = menu.dataset.base.includes('menu--cima');
    const cima = querCima ? (acima >= h || acima > abaixo) : (abaixo < h && acima > abaixo);
    if (cima) menu.classList.add('menu--cima');
    const espaco = cima ? acima : abaixo;
    if (h > espaco) { menu.style.maxHeight = `${Math.max(160, espaco)}px`; menu.style.overflowY = 'auto'; }
    const querDir = menu.dataset.base.includes('menu--dir');
    const dir = querDir ? g.right - w >= 8 : g.left + w > innerWidth - 8 && g.right - w >= 8;
    if (dir) menu.classList.add('menu--dir');
    const r = menu.getBoundingClientRect();
    if (r.left < 8) menu.style.translate = `${8 - r.left}px 0`;
    else if (r.right > innerWidth - 8) menu.style.translate = `${innerWidth - 8 - r.right}px 0`;
    menuAberto = { menu, gatilho };
    const primeiro = menu.querySelector('[aria-selected="true"]:not(:disabled)') || itensMenu(menu)[0];
    primeiro && primeiro.focus();
  }
  function fechaMenu(devolveFoco) {
    if (!menuAberto) return;
    menuAberto.menu.classList.remove('is-aberto');
    menuAberto.gatilho.setAttribute('aria-expanded', 'false');
    if (devolveFoco) menuAberto.gatilho.focus();
    menuAberto = null;
  }
  const itensMenu = (m) => $$('.menu__item:not(:disabled), .modelo:not(:disabled)', m);
  B7.fechaMenu = fechaMenu;
  document.addEventListener('click', (e) => {
    const g = e.target.closest?.('[aria-haspopup][aria-controls]');
    if (g && !g.closest('[data-paleta-abrir]')) {
      e.preventDefault();
      g.getAttribute('aria-expanded') === 'true' ? fechaMenu() : abreMenu(g);
      return;
    }
    if (menuAberto) {
      const item = e.target.closest?.('.menu__item, .modelo');
      if (item && menuAberto.menu.contains(item)) {
        if (item.getAttribute('role') === 'menuitemcheckbox') { item.setAttribute('aria-checked', item.getAttribute('aria-checked') !== 'true'); return; }
        if (item.getAttribute('role') === 'menuitemradio') $$('[role="menuitemradio"]', menuAberto.menu).forEach((i) => i.setAttribute('aria-checked', i === item));
        if (item.dataset.toast) B7.toast(JSON.parse(item.dataset.toast));
        fechaMenu(true);
      } else if (!menuAberto.menu.contains(e.target)) fechaMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!menuAberto) return;
    const itens = itensMenu(menuAberto.menu);
    const i = itens.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); fechaMenu(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); itens[(i + 1) % itens.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); itens[(i - 1 + itens.length) % itens.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); itens[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); itens[itens.length - 1]?.focus(); }
    else if (e.key === 'Tab') fechaMenu();
  });

  /* ---- Tabs ------------------------------------------------------------- */
  function selecionaAba(aba, foco) {
    const lista = aba.closest('[role="tablist"]');
    $$('[role="tab"]', lista).forEach((a) => {
      const sel = a === aba;
      a.setAttribute('aria-selected', sel);
      a.tabIndex = sel ? 0 : -1;
      const p = document.getElementById(a.getAttribute('aria-controls'));
      if (p) p.hidden = !sel;
    });
    if (foco) aba.focus();
    lista.dispatchEvent(new CustomEvent('b7:aba', { detail: aba }));
  }
  document.addEventListener('click', (e) => { const a = e.target.closest?.('[role="tab"]'); if (a && !a.disabled) selecionaAba(a); });
  document.addEventListener('keydown', (e) => {
    const a = e.target.closest?.('[role="tab"]'); if (!a) return;
    const abas = $$('[role="tab"]:not(:disabled)', a.closest('[role="tablist"]'));
    const i = abas.indexOf(a);
    const mapa = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 };
    if (e.key in mapa) { e.preventDefault(); selecionaAba(abas[(mapa[e.key] + abas.length) % abas.length], true); }
  });

  /* ---- Modal, drawer e lightbox (dialog nativo) ------------------------- */
  document.addEventListener('click', (e) => {
    const abrir = e.target.closest?.('[data-abrir]');
    if (abrir) { const d = document.getElementById(abrir.dataset.abrir); d && d.showModal(); return; }
    const fechar = e.target.closest?.('[data-fechar]');
    if (fechar) { const d = fechar.closest('dialog'); d && d.close(fechar.dataset.fechar || ''); if (fechar.dataset.toast) B7.toast(JSON.parse(fechar.dataset.toast)); return; }
    if (e.target.tagName === 'DIALOG' && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (fora || e.target.classList.contains('lightbox')) e.target.close();
    }
  });

  /* ---- Toast ------------------------------------------------------------ */
  const icToast = { sucesso: 'check-circulo', erro: 'x-circulo', aviso: 'alerta', info: 'info' };
  B7.toast = function ({ tipo = 'info', titulo = '', texto = '', acao, duracao = 5000 } = {}) {
    let pilha = $('.toasts');
    if (!pilha) { pilha = document.createElement('div'); pilha.className = 'toasts'; pilha.setAttribute('aria-live', 'polite'); document.body.appendChild(pilha); }
    const t = document.createElement('div');
    t.className = `toast toast--${tipo}`;
    t.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    t.innerHTML = `${ic(icToast[tipo] || 'info')}<div class="toast__corpo">${titulo ? `<p class="toast__titulo">${esc(titulo)}</p>` : ''}${texto ? `<p class="toast__texto">${esc(texto)}</p>` : ''}</div>${acao ? `<button class="toast__acao" type="button">${esc(acao.rotulo)}</button>` : ''}<button class="toast__fechar" type="button" aria-label="Fechar aviso">${ic('fechar', 'ic--p')}</button>`;
    const sai = () => { if (t.classList.contains('is-saindo')) return; t.classList.add('is-saindo'); t.addEventListener('animationend', () => t.remove(), { once: true }); };
    t.querySelector('.toast__fechar').onclick = sai;
    if (acao) t.querySelector('.toast__acao').onclick = () => { acao.fn && acao.fn(); sai(); };
    let timer = setTimeout(sai, duracao);
    t.addEventListener('mouseenter', () => clearTimeout(timer));
    t.addEventListener('mouseleave', () => { timer = setTimeout(sai, 2000); });
    pilha.appendChild(t);
    while (pilha.children.length > 4) pilha.firstElementChild.remove();
    return t;
  };
  document.addEventListener('click', (e) => { const b = e.target.closest?.('[data-toast]:not(.menu__item):not([data-fechar])'); if (b) B7.toast(JSON.parse(b.dataset.toast)); });

  /* ---- Campos ----------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const s = e.target.closest?.('[data-senha]');
    if (s) {
      const inp = s.closest('.campo__caixa').querySelector('input');
      const ver = inp.type === 'password';
      inp.type = ver ? 'text' : 'password';
      s.setAttribute('aria-label', ver ? 'Ocultar senha' : 'Mostrar senha');
      s.dataset.dica = ver ? 'Ocultar senha' : 'Mostrar senha';
      s.querySelector('use').setAttribute('href', ver ? '#i-olho-off' : '#i-olho');
    }
    const l = e.target.closest?.('[data-limpar]');
    if (l) { const inp = l.closest('.campo__caixa').querySelector('input'); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.focus(); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('[data-forca]')) {
      const v = el.value; let n = 0;
      if (v.length >= 8) n++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) n++; if (/\d/.test(v)) n++; if (/[^\w]/.test(v) && v.length >= 10) n++;
      const f = document.getElementById(el.dataset.forca); if (f) f.dataset.nivel = v ? Math.max(1, n) : 0;
      const t = document.getElementById(el.dataset.forca + '-texto'); if (t) t.textContent = !v ? 'Use 8 caracteres ou mais, com letras e números.' : ['Senha fraca', 'Senha fraca', 'Senha razoável', 'Senha boa', 'Senha forte'][n];
    }
    if (el.matches('[data-contador]')) atualizaContador(el);
    if (el.matches('.faixa')) atualizaFaixa(el);
    if (el.matches('.comparador__faixa')) el.closest('.comparador').style.setProperty('--pos', el.value + '%');
    if (el.closest('.campo--busca')) { const b = el.closest('.campo__caixa').querySelector('[data-limpar]'); if (b) b.hidden = !el.value; }
  });
  function atualizaContador(el) {
    const c = document.getElementById(el.dataset.contador); if (!c) return;
    const max = +el.maxLength > 0 ? +el.maxLength : +el.dataset.max;
    c.textContent = `${el.value.length.toLocaleString('pt-BR')} / ${max.toLocaleString('pt-BR')}`;
    c.classList.toggle('is-limite', el.value.length >= max * 0.9);
  }
  function atualizaFaixa(el) {
    const p = ((el.value - el.min) / (el.max - el.min)) * 100;
    el.style.setProperty('--v', p + '%');
    const out = document.getElementById(el.dataset.saida);
    if (out) out.textContent = (el.dataset.prefixo || '') + el.value + (el.dataset.sufixo || '');
  }

  /* ---- Paginação -------------------------------------------------------- */
  B7.paginacao = function (el, atual, total) {
    const pags = [];
    const add = (n) => pags.push(n);
    if (total <= 7) for (let i = 1; i <= total; i++) add(i);
    else {
      add(1);
      if (atual > 4) add('…');
      for (let i = Math.max(2, atual - 1); i <= Math.min(total - 1, atual + 1); i++) add(i);
      if (atual < total - 3) add('…');
      add(total);
    }
    el.innerHTML = `<button class="paginacao__pag paginacao__nav" type="button" data-pag="${atual - 1}" ${atual === 1 ? 'disabled' : ''} aria-label="Página anterior">${ic('seta-esq', 'ic--p')}<span>Anterior</span></button>` +
      pags.map((p) => p === '…' ? '<span class="paginacao__reticencias" aria-hidden="true">…</span>' :
        `<button class="paginacao__pag paginacao__num" type="button" data-pag="${p}" ${p === atual ? 'aria-current="page"' : ''} aria-label="Página ${p}">${p}</button>`).join('') +
      `<span class="paginacao__resumo">${atual} de ${total}</span>` +
      `<button class="paginacao__pag paginacao__nav" type="button" data-pag="${atual + 1}" ${atual === total ? 'disabled' : ''} aria-label="Próxima página"><span>Próxima</span>${ic('seta-dir', 'ic--p')}</button>`;
    el.onclick = (e) => { const b = e.target.closest?.('[data-pag]'); if (b && !b.disabled) { B7.paginacao(el, +b.dataset.pag, total); el.querySelector(`[data-pag="${b.dataset.pag}"][aria-current]`)?.focus(); } };
  };

  /* ---- Realce de sintaxe (leve, sem dependência) ------------------------ */
  const KW = {
    js: 'const|let|var|function|return|if|else|for|while|await|async|import|from|export|default|new|class|extends|try|catch|throw|of|in|typeof|null|undefined|true|false|this',
    py: 'def|return|if|elif|else|for|while|in|import|from|as|class|try|except|raise|with|lambda|None|True|False|and|or|not|await|async|self|print',
    json: 'true|false|null',
    bash: 'cd|ls|export|echo|npm|npx|python3|curl|if|then|fi|for|do|done',
    rb: 'def|end|do|each|each_with_index|if|else|elsif|unless|return|puts|require|class|module|nil|true|false|then',
    css: '',
  };
  B7.realcar = function (src, lang) {
    const l = { javascript: 'js', typescript: 'js', ts: 'js', python: 'py', ruby: 'rb', sh: 'bash', shell: 'bash' }[lang] || lang;
    if (l === 'texto') return src.split('\n').map((linha) => `<span class="ln">${esc(linha) || ' '}</span>`).join('');
    const kw = KW[l] || KW.js;
    const regras = [
      ['c', l === 'py' || l === 'bash' || l === 'rb' ? /#.*$/m : l === 'css' ? /\/\*[\s\S]*?\*\// : /\/\/.*$|\/\*[\s\S]*?\*\//m],
      ['p', l === 'json' ? /"(?:[^"\\]|\\.)*"(?=\s*:)/ : l === 'css' ? /[\w-]+(?=\s*:)/ : null],
      ['s', /`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/],
      ['k', kw ? new RegExp(`\\b(?:${kw})\\b`) : null],
      ['n', /\b\d+(?:[.,]\d+)?(?:px|ms|s|%)?\b/],
      ['f', /\b[A-Za-z_]\w*(?=\s*\()/],
      ['o', /[{}()[\];,.:=<>+\-*/!?&|]+/],
    ].filter((r) => r[1]);
    const grande = new RegExp(regras.map((r) => `(${r[1].source})`).join('|'), 'gm');
    let out = '', ult = 0, m;
    while ((m = grande.exec(src))) {
      if (m[0] === '') { grande.lastIndex++; continue; }
      out += esc(src.slice(ult, m.index));
      const gi = m.slice(1).findIndex((x) => x !== undefined);
      out += `<span class="tk-${regras[gi][0]}">${esc(m[0])}</span>`;
      ult = grande.lastIndex;
    }
    out += esc(src.slice(ult));
    return out.split('\n').map((linha) => `<span class="ln">${linha || ' '}</span>`).join('');
  };
  B7.codigo = function (el) {
    const code = el.querySelector('code');
    const bruto = code.dataset.fonte ?? code.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    code.dataset.fonte = bruto;
    code.innerHTML = B7.realcar(bruto, el.dataset.lang || 'js');
    const destaque = (el.dataset.destaque || '').split(',').map(Number);
    $$('.ln', code).forEach((l, i) => destaque.includes(i + 1) && l.classList.add('ln--destaque'));
  };
  document.addEventListener('click', async (e) => {
    const b = e.target.closest?.('[data-copiar]');
    if (b) {
      const alvo = b.dataset.copiar ? document.getElementById(b.dataset.copiar) : null;
      const cod = b.closest('.codigo')?.querySelector('code');
      const txt = alvo ? alvo.innerText : cod ? cod.dataset.fonte : (b.closest('.msg')?.querySelector('.prosa, .msg__bolha')?.innerText || '');
      try { await navigator.clipboard.writeText(txt); } catch (err) {}
      const u = b.querySelector('use'); const rot = b.querySelector('.rotulo');
      u && u.setAttribute('href', '#i-check');
      if (rot) rot.textContent = 'Copiado';
      b.dataset.dica && (b.dataset.dicaOriginal = b.dataset.dica, b.dataset.dica = 'Copiado');
      setTimeout(() => { u && u.setAttribute('href', '#i-copiar'); if (rot) rot.textContent = 'Copiar'; if (b.dataset.dicaOriginal) b.dataset.dica = b.dataset.dicaOriginal; }, 1600);
    }
    const q = e.target.closest?.('[data-quebra]');
    if (q) { const c = q.closest('.codigo'); c.classList.toggle('is-quebra'); q.setAttribute('aria-pressed', c.classList.contains('is-quebra')); }
  });

  /* ---- Cronômetro (indicador de geração) -------------------------------- */
  B7.cronometro = function (el) {
    const ini = performance.now() - (+el.dataset.inicio || 0) * 1000;
    const tick = () => { if (!el.isConnected || el.dataset.parado) return; el.textContent = fmtTempo((performance.now() - ini) / 1000); requestAnimationFrame(tick); };
    tick();
  };

  /* ---- Autosize --------------------------------------------------------- */
  const autosize = (ta) => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 240) + 'px'; };

  /* ---- Seletor de modelo ------------------------------------------------ */
  B7.MODELOS = [
    { id: 'agil', nome: 'Ágil', icone: 'raio', desc: 'Respostas curtas, revisão de texto e ideias rápidas.', vel: 5, cap: 2, custo: 1 },
    { id: 'equilibrio', nome: 'Equilíbrio', icone: 'brilho', desc: 'Padrão para prompts, briefings e análise de projeto.', vel: 4, cap: 4, custo: 2, badge: ['Recomendado', 'info'] },
    { id: 'profundo', nome: 'Profundo', icone: 'cerebro', desc: 'Raciocínio longo: memoriais, orçamentos e normas técnicas.', vel: 2, cap: 5, custo: 6, badge: ['Pro', 'solido'] },
    { id: 'foto', nome: 'Render Foto', icone: 'imagem', desc: 'Imagem fotorrealista a partir do print do modelo 3D.', vel: 3, cap: 5, custo: 8 },
    { id: 'video', nome: 'Render Vídeo', icone: 'video', desc: 'Anima um render em clipes de 5 a 10 segundos.', vel: 1, cap: 4, custo: 30, badge: ['Novo', 'novo'], bloqueado: 'Disponível no plano Estúdio' },
  ];
  const nivel = (n) => `<span class="nivel" data-n="${n}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
  B7.htmlModelo = (m, sel) => `
    <button class="modelo" type="button" role="option" aria-selected="${sel}" data-modelo="${m.id}" ${m.bloqueado ? 'disabled' : ''}>
      <span class="modelo__icone modelo__icone--${m.id}">${ic(m.icone)}</span>
      <span class="modelo__topo"><span class="modelo__nome">${m.nome}</span>${m.badge ? `<span class="badge badge--p badge--${m.badge[1]}">${m.badge[0]}</span>` : ''}</span>
      <span class="modelo__custo">${m.bloqueado ? ic('cadeado', 'ic--p') : `${m.custo} cr`}</span>
      <span class="modelo__desc">${m.bloqueado ? m.bloqueado : m.desc}</span>
      <span class="modelo__medidas">
        <span class="medida">Velocidade ${nivel(m.vel)}<span class="sr">${m.vel} de 5</span></span>
        <span class="medida">Capacidade ${nivel(m.cap)}<span class="sr">${m.cap} de 5</span></span>
      </span>
    </button>`;
  B7.seletorModelo = function (raiz) {
    const lista = raiz.querySelector('.modelos');
    const gat = raiz.querySelector('.modelo-gatilho');
    let atual = raiz.dataset.modelo || 'equilibrio';
    const render = () => {
      lista.innerHTML = B7.MODELOS.map((m) => B7.htmlModelo(m, m.id === atual)).join('') +
        `<div class="modelos__rodape">${ic('info', 'ic--p')}<span>Custo por mensagem, em créditos.</span></div>`;
      const m = B7.MODELOS.find((x) => x.id === atual);
      gat.innerHTML = `<span class="modelo__icone modelo__icone--${m.id}">${ic(m.icone)}</span><span class="rotulo-longo">${m.nome}</span>${ic('seta-baixo', 'ic--p')}`;
      gat.setAttribute('aria-label', `Modelo: ${m.nome}. Trocar modelo`);
    };
    lista.addEventListener('click', (e) => {
      const b = e.target.closest?.('[data-modelo]'); if (!b || b.disabled) return;
      atual = b.dataset.modelo; raiz.dataset.modelo = atual;
      setTimeout(render); // depois do handler global fechar o menu e devolver o foco
      raiz.dispatchEvent(new CustomEvent('b7:modelo', { detail: B7.MODELOS.find((x) => x.id === atual), bubbles: true }));
    });
    render();
    return { get: () => B7.MODELOS.find((x) => x.id === atual) };
  };

  /* ---- Campo de prompt -------------------------------------------------- */
  B7.prompt = function (el, { aoEnviar, aoParar } = {}) {
    const ta = el.querySelector('.prompt__texto');
    const enviar = el.querySelector('.prompt__enviar');
    const anexos = el.querySelector('.prompt__anexos');
    const arquivo = el.querySelector('input[type="file"]');
    const contador = el.querySelector('.prompt__contador');
    const max = +ta.maxLength > 0 ? +ta.maxLength : 4000;
    const seletor = el.querySelector('[data-seletor-modelo]');
    const modelo = seletor ? B7.seletorModelo(seletor) : null;
    let gerando = false;

    const estado = () => {
      const tem = ta.value.trim().length > 0 || anexos.children.length > 0;
      enviar.disabled = !gerando && !tem;
      enviar.setAttribute('aria-label', gerando ? 'Interromper geração' : 'Enviar mensagem');
      enviar.dataset.dica = gerando ? 'Interromper' : 'Enviar';
      enviar.dataset.dicaAtalho = gerando ? 'Esc' : '↵';
      if (contador) {
        const n = ta.value.length;
        contador.hidden = n < max * 0.75;
        contador.textContent = `${n.toLocaleString('pt-BR')} / ${max.toLocaleString('pt-BR')}`;
        contador.classList.toggle('is-limite', n >= max * 0.95);
      }
    };
    const api = {
      set gerando(v) { gerando = v; el.classList.toggle('is-gerando', v); estado(); },
      get gerando() { return gerando; },
      preencher(t) { ta.value = t; autosize(ta); estado(); ta.focus(); ta.setSelectionRange(t.length, t.length); },
      modelo,
    };
    const submete = () => {
      if (gerando) { aoParar && aoParar(); return; }
      const texto = ta.value.trim();
      if (!texto && !anexos.children.length) return;
      const imgs = $$('.anexo img', anexos).map((i) => i.src);
      aoEnviar && aoEnviar({ texto, imagens: imgs, modelo: modelo && modelo.get() });
      ta.value = ''; anexos.innerHTML = ''; autosize(ta); estado();
    };
    ta.addEventListener('input', () => { autosize(ta); estado(); });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submete(); }
      if (e.key === 'Escape' && gerando) { e.preventDefault(); aoParar && aoParar(); }
    });
    enviar.addEventListener('click', submete);
    el.addEventListener('click', (e) => { if (e.target === el || e.target.classList.contains('prompt__barra')) ta.focus(); });

    const adiciona = (files) => {
      [...files].slice(0, 6).forEach((f) => {
        const ehImg = f.type.startsWith('image/');
        const grande = f.size > 20 * 1048576;
        const a = document.createElement('div');
        a.className = 'anexo' + (grande ? ' is-erro' : '');
        const mini = ehImg && !grande ? `<img class="anexo__miniatura" src="${URL.createObjectURL(f)}" alt="">` : `<span class="anexo__miniatura ${/pdf/.test(f.type) ? 'anexo__miniatura--pdf' : ''}">${ic(ehImg ? 'imagem' : 'arquivo-texto', 'ic--p')}</span>`;
        a.innerHTML = `${mini}<span class="anexo__info"><span class="anexo__nome" title="${esc(f.name)}">${esc(f.name)}</span><span class="anexo__meta">${grande ? 'Acima de 20 MB' : 'Enviando…'}</span></span><button class="anexo__remover" type="button" aria-label="Remover ${esc(f.name)}">${ic('fechar')}</button>${grande ? '' : '<span class="progresso" style="--v:0%"></span>'}`;
        a.querySelector('.anexo__remover').onclick = () => { a.remove(); estado(); ta.focus(); };
        anexos.appendChild(a);
        if (!grande) {
          let p = 0; const bar = a.querySelector('.progresso');
          const t = setInterval(() => { p += 12 + Math.random() * 20; bar.style.setProperty('--v', Math.min(p, 100) + '%'); if (p >= 100) { clearInterval(t); bar.remove(); a.querySelector('.anexo__meta').textContent = fmtBytes(f.size); } }, 160);
        }
      });
      estado();
    };
    api.anexarDemo = (nome, src, meta) => {
      const a = document.createElement('div'); a.className = 'anexo';
      a.innerHTML = `<img class="anexo__miniatura" src="${src}" alt=""><span class="anexo__info"><span class="anexo__nome">${esc(nome)}</span><span class="anexo__meta">${esc(meta)}</span></span><button class="anexo__remover" type="button" aria-label="Remover ${esc(nome)}">${ic('fechar')}</button>`;
      a.querySelector('.anexo__remover').onclick = () => { a.remove(); estado(); };
      anexos.appendChild(a); estado();
    };
    arquivo && arquivo.addEventListener('change', () => { adiciona(arquivo.files); arquivo.value = ''; });
    el.querySelector('[data-anexar]')?.addEventListener('click', () => arquivo && arquivo.click());
    let prof = 0;
    el.addEventListener('dragenter', (e) => { if (e.dataTransfer.types.includes('Files')) { prof++; el.classList.add('is-arrastando'); } });
    el.addEventListener('dragleave', () => { if (--prof <= 0) { prof = 0; el.classList.remove('is-arrastando'); } });
    el.addEventListener('dragover', (e) => e.preventDefault());
    el.addEventListener('drop', (e) => { e.preventDefault(); prof = 0; el.classList.remove('is-arrastando'); adiciona(e.dataTransfer.files); });
    ta.addEventListener('paste', (e) => { const fs = [...(e.clipboardData?.files || [])]; if (fs.length) adiciona(fs); });
    autosize(ta); estado();
    return api;
  };

  /* ---- Mensagens -------------------------------------------------------- */
  B7.msgUsuario = function (texto, imagens = []) {
    const m = document.createElement('div');
    m.className = 'msg msg--usuario';
    m.innerHTML = `${imagens.length ? `<div class="msg__anexos">${imagens.map((s) => `<img src="${s}" alt="Imagem anexada">`).join('')}</div>` : ''}
      <div class="msg__bolha">${esc(texto)}</div>
      <div class="msg__acoes">
        <button class="btn btn--discreto btn--p btn--icone" type="button" data-copiar aria-label="Copiar mensagem" data-dica="Copiar">${ic('copiar')}</button>
        <button class="btn btn--discreto btn--p btn--icone" type="button" data-editar aria-label="Editar mensagem" data-dica="Editar">${ic('editar')}</button>
      </div>`;
    return m;
  };
  B7.msgIA = function ({ modelo = 'Equilíbrio', html = '', versao } = {}) {
    const m = document.createElement('div');
    m.className = 'msg msg--ia';
    m.innerHTML = `<div class="msg__autor"><span class="msg__marca" aria-hidden="true">${ic('brilho')}</span></div>
      <div class="msg__principal">
        <div class="msg__cab">Assistente 9barra7 <span class="suave">· ${esc(modelo)}</span></div>
        <div class="prosa">${html}</div>
        <div class="msg__acoes" hidden>
          ${versao ? `<span class="msg__versao">${versao}</span>` : ''}
          <button class="btn btn--discreto btn--p btn--icone" type="button" data-copiar aria-label="Copiar resposta" data-dica="Copiar">${ic('copiar')}</button>
          <button class="btn btn--discreto btn--p btn--icone" type="button" data-avaliar="bom" aria-pressed="false" aria-label="Boa resposta" data-dica="Boa resposta">${ic('polegar-cima')}</button>
          <button class="btn btn--discreto btn--p btn--icone" type="button" data-avaliar="ruim" aria-pressed="false" aria-label="Resposta ruim" data-dica="Resposta ruim">${ic('polegar-baixo')}</button>
          <button class="btn btn--discreto btn--p btn--icone" type="button" data-refazer aria-label="Gerar novamente" data-dica="Gerar novamente">${ic('refazer')}</button>
        </div>
      </div>`;
    return m;
  };
  // Avaliar, editar
  document.addEventListener('click', (e) => {
    const av = e.target.closest?.('[data-avaliar]');
    if (av) {
      const ligado = av.getAttribute('aria-pressed') !== 'true';
      $$('[data-avaliar]', av.parentElement).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      av.setAttribute('aria-pressed', ligado);
      if (ligado) B7.toast({ tipo: 'sucesso', titulo: 'Obrigado pela avaliação', texto: av.dataset.avaliar === 'bom' ? 'Isso ajuda a ajustar as próximas respostas.' : 'Conte o que faltou para melhorarmos.', duracao: 3000 });
    }
    const ed = e.target.closest?.('[data-editar]');
    if (ed) {
      const msg = ed.closest('.msg'); const bolha = msg.querySelector('.msg__bolha');
      const orig = bolha.textContent;
      const caixa = document.createElement('div'); caixa.className = 'msg__editar';
      caixa.innerHTML = `<label class="sr" for="ed-${Date.now()}">Editar mensagem</label><textarea id="ed-${Date.now()}">${esc(orig)}</textarea><div class="grupo-btn"><button class="btn btn--discreto btn--p" type="button" data-x>Cancelar</button><button class="btn btn--p" type="button" data-ok>Enviar</button></div>`;
      bolha.hidden = true; msg.querySelector('.msg__acoes').hidden = true; bolha.after(caixa);
      const ta = caixa.querySelector('textarea'); ta.focus(); ta.setSelectionRange(orig.length, orig.length);
      const fecha = (novo) => { if (novo != null) bolha.textContent = novo; caixa.remove(); bolha.hidden = false; msg.querySelector('.msg__acoes').hidden = false; };
      caixa.querySelector('[data-x]').onclick = () => fecha(null);
      caixa.querySelector('[data-ok]').onclick = () => { const v = ta.value.trim(); fecha(v || orig); if (v && v !== orig) msg.dispatchEvent(new CustomEvent('b7:editada', { detail: v, bubbles: true })); };
      ta.addEventListener('keydown', (k) => { if (k.key === 'Escape') fecha(null); if (k.key === 'Enter' && !k.shiftKey) { k.preventDefault(); caixa.querySelector('[data-ok]').click(); } });
    }
  });

  // Digitação simulada: revela HTML palavra a palavra, preservando tags.
  B7.digitar = async function (alvo, html, { sinal, vel = 14 } = {}) {
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    alvo.innerHTML = ''; alvo.classList.add('cursor-digitando');
    async function copia(origem, destino) {
      for (const no of [...origem.childNodes]) {
        if (sinal?.parado) return;
        if (no.nodeType === 3) {
          const t = document.createTextNode(''); destino.appendChild(t);
          const partes = no.textContent.split(/(\s+)/);
          for (const p of partes) { if (sinal?.parado) return; t.textContent += p; if (p.trim()) await espera(vel + Math.random() * vel); }
        } else {
          const c = no.cloneNode(false); destino.appendChild(c);
          if (no.matches?.('.codigo, .fontes, .imagem-grade')) { c.replaceWith(no.cloneNode(true)); await espera(120); continue; }
          await copia(no, c);
        }
      }
    }
    await copia(tmp, alvo);
    alvo.classList.remove('cursor-digitando');
    $$('.codigo', alvo).forEach(B7.codigo);
  };

  B7.indicador = function ({ texto = 'Pensando', brilho = true } = {}) {
    const g = document.createElement('div');
    g.className = 'gerando'; g.setAttribute('role', 'status');
    g.innerHTML = `<span class="gerando__pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="gerando__texto ${brilho ? 'gerando__texto--brilho' : ''}">${esc(texto)}</span><span class="gerando__tempo" data-cronometro>0:00</span>`;
    B7.cronometro(g.querySelector('[data-cronometro]'));
    return g;
  };

  /* ---- Imagem gerada ---------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const amp = e.target.closest?.('[data-ampliar]');
    if (amp) {
      const card = amp.closest('.imagem'); const img = card.querySelector('.imagem__quadro img');
      let lb = $('#b7-lightbox');
      if (!lb) { lb = document.createElement('dialog'); lb.id = 'b7-lightbox'; lb.className = 'lightbox'; lb.setAttribute('aria-label', 'Imagem ampliada'); document.body.appendChild(lb); }
      lb.innerHTML = `<img src="${img.src}" alt="${esc(img.alt)}"><div class="lightbox__barra"><button class="btn btn--vidro btn--icone" type="button" data-fechar aria-label="Fechar">${ic('fechar')}</button></div><p class="lightbox__legenda">${esc(card.querySelector('.imagem__prompt')?.textContent || '')}</p>`;
      lb.showModal();
    }
    const pr = e.target.closest?.('.imagem__prompt');
    if (pr) pr.classList.toggle('is-aberto');
    const va = e.target.closest?.('[data-variacao]');
    if (va) B7.variacao(va.closest('.imagem'));
    const tn = e.target.closest?.('[data-tentar]');
    if (tn && tn.closest('.imagem')) B7.variacao(tn.closest('.imagem'));
  });
  const RENDERS = ['criar-render-1-depois', 'criar-print-2-depois', 'criar-ajuste-3-depois', 'criar-planta-depois', 'criar-print-1-depois', 'criar-render-2-depois'];
  B7.variacao = async function (card, base = card.dataset.base || '') {
    const q = card.querySelector('.imagem__quadro');
    const alt = q.querySelector('img')?.alt || 'Imagem gerada';
    const vinhaDeErro = card.classList.contains('is-erro');
    card.classList.remove('is-erro'); card.classList.add('is-gerando'); card.setAttribute('aria-busy', 'true');
    q.innerHTML = `<span class="badge imagem__proporcao">${q.dataset.proporcao || '1:1'}</span><div class="imagem__estado">${ic('brilho')}<span>Criando variação… <span class="t-num" data-pct>0%</span></span><span class="progresso" style="--v:0%"></span></div>`;
    for (let p = 0; p <= 100; p += 4 + Math.random() * 6) { q.querySelector('.progresso').style.setProperty('--v', p + '%'); q.querySelector('[data-pct]').textContent = Math.round(p) + '%'; await espera(90); }
    const prox = RENDERS[(RENDERS.indexOf(q.dataset.img) + 1) % RENDERS.length] || RENDERS[0];
    q.dataset.img = prox;
    const src = `${base}assets/img/${prox}.jpg`;
    q.innerHTML = `<img src="${src}" alt="${esc(alt)}"><span class="badge imagem__proporcao">${q.dataset.proporcao || '1:1'}</span>
      <div class="imagem__acoes">
        <button class="btn btn--vidro btn--p btn--icone" type="button" data-ampliar aria-label="Ampliar" data-dica="Ampliar">${ic('ampliar')}</button>
        <a class="btn btn--vidro btn--p btn--icone" href="${src}" download aria-label="Baixar" data-dica="Baixar">${ic('download')}</a>
        <button class="btn btn--vidro btn--p" type="button" data-variacao>${ic('brilho')}Variação</button>
      </div>`;
    if (vinhaDeErro) card.querySelector('.imagem__meta').innerHTML = '<span>Render Foto</span><span class="ponto-sep"></span><span>agora</span>';
    card.classList.remove('is-gerando'); card.removeAttribute('aria-busy');
    B7.toast({ tipo: 'sucesso', titulo: 'Variação criada', texto: 'Mesma composição, nova luz e materiais.', duracao: 3000 });
  };

  /* ---- Upload ----------------------------------------------------------- */
  B7.upload = function (raiz, { maxMB = 25, tipos = ['image/', 'application/pdf', '.skp', '.dwg'] } = {}) {
    const zona = raiz.querySelector('.upload__zona');
    const input = zona.querySelector('input');
    const lista = raiz.querySelector('.arquivos');
    const aceita = (f) => tipos.some((t) => t.startsWith('.') ? f.name.toLowerCase().endsWith(t) : f.type.startsWith(t));
    const icone = (f) => /pdf/.test(f.type) ? ['arquivo-texto', 'anexo__miniatura--pdf'] : f.type.startsWith('image/') ? ['imagem', ''] : ['cubo', 'anexo__miniatura--skp'];
    function item(f) {
      const li = document.createElement('li'); li.className = 'arquivo';
      const [n, cls] = icone(f);
      const ponto = f.name.lastIndexOf('.');
      const nome = ponto > 0 ? [f.name.slice(0, ponto), f.name.slice(ponto)] : [f.name, ''];
      li.innerHTML = `<span class="anexo__miniatura ${cls}">${ic(n, 'ic--p')}</span><span class="arquivo__nome" title="${esc(f.name)}"><span>${esc(nome[0])}</span><span>${esc(nome[1])}</span></span><span class="arquivo__meta"></span><span class="arquivo__acoes"></span>`;
      lista.appendChild(li);
      envia(li, f);
    }
    function envia(li, f) {
      const meta = li.querySelector('.arquivo__meta'); const acoes = li.querySelector('.arquivo__acoes');
      li.className = 'arquivo';
      const remover = `<button class="btn btn--discreto btn--p btn--icone" type="button" data-remover aria-label="Remover ${esc(f.name)}" data-dica="Remover">${ic('lixeira')}</button>`;
      let erro = !aceita(f) ? 'Formato não suportado. Envie JPG, PNG, PDF, SKP ou DWG.' : f.size > maxMB * 1048576 ? `Arquivo com ${fmtBytes(f.size)}. O limite é ${maxMB} MB.` : null;
      if (erro) {
        li.classList.add('is-erro');
        meta.innerHTML = `${ic('alerta-circulo', 'ic--p')}<span>${erro}</span>`;
        acoes.innerHTML = remover; return;
      }
      const falhaSimulada = f.falhar;
      meta.innerHTML = `<span class="progresso" style="--v:0%"></span><span data-pct>0%</span>`;
      acoes.innerHTML = `<button class="btn btn--discreto btn--p btn--icone" type="button" data-remover aria-label="Cancelar envio" data-dica="Cancelar">${ic('fechar')}</button>`;
      let p = 0;
      const t = setInterval(() => {
        if (!li.isConnected) return clearInterval(t);
        p += 6 + Math.random() * 14;
        if (falhaSimulada && p > 58) {
          clearInterval(t); f.falhar = false;
          li.classList.add('is-erro');
          meta.innerHTML = `${ic('alerta-circulo', 'ic--p')}<span>Conexão interrompida em 62%.</span>`;
          acoes.innerHTML = `<button class="btn btn--discreto btn--p" type="button" data-reenviar>${ic('refazer')}Tentar de novo</button>` + remover;
          acoes.querySelector('[data-reenviar]').onclick = () => envia(li, f);
          return;
        }
        if (p >= 100) {
          clearInterval(t); li.classList.add('is-concluido');
          meta.innerHTML = `${ic('check-circulo', 'ic--p')}<span>${fmtBytes(f.size)} · Enviado</span>`;
          acoes.innerHTML = remover; return;
        }
        meta.querySelector('.progresso').style.setProperty('--v', p + '%');
        meta.querySelector('[data-pct]').textContent = `${Math.round(p)}% · ${fmtBytes(f.size * p / 100)} de ${fmtBytes(f.size)}`;
      }, 180);
    }
    lista.addEventListener('click', (e) => { const r = e.target.closest?.('[data-remover]'); if (r) r.closest('.arquivo').remove(); });
    input.addEventListener('change', () => { [...input.files].forEach(item); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('is-arrastando'); }));
    ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, () => zona.classList.remove('is-arrastando')));
    zona.addEventListener('drop', (e) => { e.preventDefault(); [...e.dataTransfer.files].forEach(item); });
    return { adicionar: item };
  };

  /* ---- Seletor de ferramentas ------------------------------------------ */
  B7.ferramentas = function (raiz) {
    const cont = raiz.querySelector('[data-ativas]');
    const upd = () => { const t = $$('input[type="checkbox"]:not(:disabled)', raiz); cont.textContent = `${t.filter((x) => x.checked).length} de ${t.length} ativas`; };
    raiz.addEventListener('change', upd); upd();
  };

  /* ---- Etapas de execução ---------------------------------------------- */
  const icEtapa = { aguardando: '', executando: '<svg class="ic ic--gira" aria-hidden="true"><use href="#i-carregando"/></svg>', concluida: ic('check'), falhou: ic('fechar') };
  const rotEtapa = { aguardando: 'Aguardando', executando: 'Executando', concluida: 'Concluída', falhou: 'Falhou' };
  B7.estadoEtapa = function (li, estado, tempo) {
    li.className = `etapa is-${estado}`;
    li.querySelector('.etapa__icone').innerHTML = icEtapa[estado] + `<span class="sr">${rotEtapa[estado]}</span>`;
    const t = li.querySelector('.etapa__tempo');
    if (t && tempo != null) t.textContent = tempo;
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.etapa__topo[aria-controls]');
    if (t) { const d = document.getElementById(t.getAttribute('aria-controls')); const ab = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', ab); d.hidden = !ab; }
  });
  B7.executar = async function (lista, { falhaNa = -1 } = {}) {
    const itens = $$('.etapa', lista);
    itens.forEach((li) => B7.estadoEtapa(li, 'aguardando', '—'));
    for (let i = 0; i < itens.length; i++) {
      const li = itens[i];
      B7.estadoEtapa(li, 'executando', '0,0 s');
      const tempo = li.querySelector('.etapa__tempo');
      const ini = performance.now(); const dur = 900 + Math.random() * 1400;
      while (performance.now() - ini < dur) { tempo.textContent = ((performance.now() - ini) / 1000).toFixed(1).replace('.', ',') + ' s'; await espera(80); }
      if (i === falhaNa) {
        B7.estadoEtapa(li, 'falhou');
        const bt = li.querySelector('.etapa__topo'); if (bt && bt.getAttribute('aria-expanded') !== 'true') bt.click();
        return false;
      }
      B7.estadoEtapa(li, 'concluida');
    }
    return true;
  };

  /* ---- Aprovação -------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-aprovacao]');
    if (!b) return;
    const card = b.closest('.aprovacao');
    const ok = b.dataset.aprovacao === 'aprovar';
    card.classList.add(ok ? 'is-aprovada' : 'is-cancelada');
    card.querySelector('.aprovacao__rodape').hidden = true;
    const res = document.createElement('div'); res.className = 'aprovacao__resultado'; res.setAttribute('role', 'status');
    const sempre = card.querySelector('.aprovacao__rodape .caixa')?.checked;
    res.innerHTML = ok ? `${ic('check-circulo', 'ic--p')}<span>Aprovado por você às ${agora()}${sempre ? ' · Próximos envios não pedirão aprovação' : ''}. O agente continuou a tarefa.</span>`
      : `${ic('x-circulo', 'ic--p')}<span>Cancelado às ${agora()}. Nada foi enviado.</span><button class="btn btn--discreto btn--p empurra" type="button" data-desfazer>Desfazer</button>`;
    card.appendChild(res);
    card.querySelector('.aprovacao__icone use').setAttribute('href', ok ? '#i-check' : '#i-fechar');
    res.querySelector('[data-desfazer]')?.addEventListener('click', () => {
      res.remove(); card.classList.remove('is-cancelada'); card.querySelector('.aprovacao__rodape').hidden = false; card.querySelector('.aprovacao__icone use').setAttribute('href', '#i-escudo');
    });
  });

  /* ---- Créditos --------------------------------------------------------- */
  B7.creditos = function (el, { limite = 2000, texto = 0, imagem = 0, video = 0, renova = '1º de outubro' } = {}) {
    const usado = texto + imagem + video;
    const saldo = Math.max(0, limite - usado);
    const pct = usado / limite;
    el.classList.toggle('is-alerta', pct >= 0.8 && pct < 1);
    el.classList.toggle('is-esgotado', pct >= 1);
    const f = (n) => n.toLocaleString('pt-BR');
    el.querySelector('[data-saldo]').innerHTML = `${f(saldo)}<small>de ${f(limite)}</small>`;
    const barra = el.querySelector('.creditos__barra');
    const w = (n) => `${Math.min(100, (n / limite) * 100)}%`;
    barra.innerHTML = `<i style="width:${w(texto)}"></i><i style="width:${w(imagem)}"></i><i style="width:${w(video)}"></i>`;
    barra.setAttribute('aria-valuenow', Math.round(pct * 100));
    barra.setAttribute('aria-valuetext', `${Math.round(pct * 100)}% usados, ${f(saldo)} créditos restantes`);
    el.querySelector('[data-leg]').innerHTML = `<span><i style="background:var(--texto)"></i>Texto ${f(texto)}</span><span><i style="background:var(--acento)"></i>Imagens ${f(imagem)}</span><span><i style="background:var(--cat-prompthub)"></i>Vídeo ${f(video)}</span>`;
    const st = el.querySelector('[data-status]');
    st.className = 'badge ' + (pct >= 1 ? 'badge--erro' : pct >= 0.8 ? 'badge--aviso' : 'badge--sucesso');
    st.innerHTML = `<span class="badge__ponto"></span>${pct >= 1 ? 'Limite atingido' : pct >= 0.8 ? `${Math.round(pct * 100)}% usado` : 'Dentro do plano'}`;
    el.querySelector('[data-renova]').textContent = `Renova em ${renova}`;
  };

  /* ---- Command palette -------------------------------------------------- */
  B7.paleta = function (dlg, grupos) {
    const input = dlg.querySelector('input');
    const lista = dlg.querySelector('.paleta__lista');
    let ativo = 0, visiveis = [];
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const marca = (t, q) => { if (!q) return esc(t); const i = norm(t).indexOf(norm(q)); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); };
    function render() {
      const q = input.value.trim();
      visiveis = [];
      let html = '';
      grupos.forEach((g) => {
        const it = g.itens.filter((i) => !q || norm(i.rotulo + ' ' + (i.chaves || '')).includes(norm(q)));
        if (!it.length) return;
        html += `<div class="menu__grupo" role="presentation">${esc(g.nome)}</div>`;
        it.forEach((i) => {
          const idx = visiveis.push(i) - 1;
          html += `<div class="menu__item" role="option" id="pal-${idx}" data-idx="${idx}" aria-selected="false">${ic(i.icone)}<span class="trunca">${marca(i.rotulo, q)}</span>${i.atalho ? `<span class="kbds">${i.atalho.map((k) => `<kbd class="kbd">${k}</kbd>`).join('')}</span>` : i.meta ? `<span class="menu__meta">${esc(i.meta)}</span>` : ''}</div>`;
        });
      });
      lista.innerHTML = html || `<div class="paleta__vazio"><p><strong>Nada encontrado para “${esc(q)}”.</strong></p><p>Tente “render”, “projeto” ou “créditos”.</p></div>`;
      ativo = 0; marcaAtivo();
    }
    function marcaAtivo() {
      $$('.menu__item', lista).forEach((el) => { const a = +el.dataset.idx === ativo; el.classList.toggle('is-ativo', a); el.setAttribute('aria-selected', a); if (a) rolaDentro(lista, el); });
      input.setAttribute('aria-activedescendant', visiveis.length ? `pal-${ativo}` : '');
    }
    function executa(i) { const it = visiveis[i]; if (!it) return; if (dlg.open && !dlg.classList.contains('paleta--estatica')) dlg.close(); it.acao && requestAnimationFrame(() => it.acao()); }
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); ativo = (ativo + 1) % Math.max(1, visiveis.length); marcaAtivo(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); ativo = (ativo - 1 + visiveis.length) % Math.max(1, visiveis.length); marcaAtivo(); }
      if (e.key === 'Enter') { e.preventDefault(); executa(ativo); }
    });
    lista.addEventListener('mousemove', (e) => { const it = e.target.closest?.('[data-idx]'); if (it && +it.dataset.idx !== ativo) { ativo = +it.dataset.idx; marcaAtivo(); } });
    lista.addEventListener('click', (e) => { const it = e.target.closest?.('[data-idx]'); if (it) executa(+it.dataset.idx); });
    render();
    return {
      abrir() { input.value = ''; render(); dlg.showModal(); input.focus(); },
    };
  };

  /* ---- Inicialização ---------------------------------------------------- */
  B7.iniciar = function () {
    B7.tema.iniciar();
    $$('.faixa').forEach(atualizaFaixa);
    $$('[data-contador]').forEach(atualizaContador);
    $$('[data-indeterminado]').forEach((c) => (c.indeterminate = true));
    $$('.codigo').forEach(B7.codigo);
    $$('[data-cronometro]').forEach(B7.cronometro);
    $$('[data-paginacao]').forEach((p) => B7.paginacao(p, +p.dataset.atual || 1, +p.dataset.paginacao));
    $$('[role="tablist"]').forEach((l) => { const s = l.querySelector('[aria-selected="true"]'); $$('[role="tab"]', l).forEach((a) => (a.tabIndex = a === s ? 0 : -1)); });
  };

  window.B7 = B7;
})();
