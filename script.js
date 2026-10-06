/* ============================================================
   SPACE DODGE - jogo em UM arquivo só (JavaScript)
   Uso no HTML:
       <div id="jogo"></div>
       <script src="script.js"></script>
   Se não existir <div id="jogo">, o jogo é criado logo
   depois da tag <script>.
   Tudo (HUD, menu, game over) fica DENTRO do quadro do jogo.
   ============================================================ */
(function () {
  "use strict";
  var loader = document.currentScript;
  var BEST_KEY = "space-dodge-recorde";
  var CSS = ''
    + '.sd-wrap{display:flex;align-items:center;justify-content:center;width:100%;'
    + 'padding:28px 16px;box-sizing:border-box;}'
    + '.sd-box{position:relative;width:min(560px,100%);aspect-ratio:3/4;max-height:78vh;'
    + 'border-radius:16px;overflow:hidden;background:#0b1026;'
    + 'border:1px solid rgba(120,170,255,.35);'
    + 'box-shadow:0 18px 50px rgba(0,0,0,.45);'
    + 'font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#eaf2ff;'
    + '-webkit-user-select:none;user-select:none;touch-action:none;}'
    + '.sd-box *{box-sizing:border-box;}'
    + '.sd-canvas{display:block;width:100%;height:100%;}'
    + '.sd-hud{position:absolute;top:0;left:0;right:0;display:flex;gap:14px;'
    + 'justify-content:center;flex-wrap:wrap;padding:10px 12px;font-size:14px;'
    + 'font-weight:700;letter-spacing:.06em;text-shadow:0 2px 6px #000;'
    + 'background:linear-gradient(#0b1026cc,#0b102600);pointer-events:none;z-index:2;}'
    + '.sd-hud b{color:#5bb0ff;}'
    + '.sd-tela{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;'
    + 'align-items:center;justify-content:center;text-align:center;gap:10px;padding:22px;'
    + 'background:rgba(5,9,25,.82);backdrop-filter:blur(2px);}'
    + '.sd-tela[hidden]{display:none;}'
    + '.sd-titulo{margin:0;font-size:clamp(26px,7vw,44px);letter-spacing:.14em;color:#8fd0ff;'
    + 'text-shadow:0 0 18px rgba(80,170,255,.7);}'
    + '.sd-txt{margin:0;font-size:14px;line-height:1.6;color:#cfe0f5;max-width:34ch;}'
    + '.sd-btn{margin-top:8px;padding:12px 30px;border-radius:999px;cursor:pointer;'
    + 'background:transparent;color:#eaf2ff;font:inherit;font-weight:700;letter-spacing:.14em;'
    + 'border:2px solid #5bb0ff;transition:.18s;}'
    + '.sd-btn:hover{background:#5bb0ff;color:#06112a;box-shadow:0 0 22px rgba(91,176,255,.6);}'
    + '@media(max-width:600px){.sd-wrap{padding:16px 10px;}.sd-hud{font-size:12px;gap:10px;}}';
  function iniciar() {
    if (document.querySelector(".sd-wrap")) return;
    // injeta o CSS
    var estilo = document.createElement("style");
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    // monta a estrutura
    var wrap = document.createElement("div");
    wrap.className = "sd-wrap";
    wrap.innerHTML = ''
      + '<div class="sd-box">'
      + '  <canvas class="sd-canvas"></canvas>'
      + '  <div class="sd-hud">'
      + '    <span>PONTOS: <b class="sd-pontos">0</b></span>'
      + '    <span>RECORDE: <b class="sd-recorde">0</b></span>'
      + '    <span>VIDAS: <b class="sd-vidas">3</b></span>'
      + '  </div>'
      + '  <div class="sd-tela">'
      + '    <h2 class="sd-titulo">SPACE DODGE</h2>'
      + '    <p class="sd-txt">Desvie dos asteroides e destrua o que puder.</p>'
      + '    <p class="sd-txt">← → ou <b>A / D</b> para mover • <b>ESPAÇO</b> para atirar<br>'
      + '       No celular: arraste para mover e toque para atirar.</p>'
      + '    <button class="sd-btn" type="button">JOGAR</button>'
      + '  </div>'
      + '</div>';
    var alvo = document.getElementById("jogo") || document.querySelector("[data-jogo]");
    if (alvo) alvo.appendChild(wrap);
    else if (loader && loader.parentNode && loader.parentNode !== document.head) loader.parentNode.insertBefore(wrap, loader.nextSibling);
    else document.body.appendChild(wrap);
    var box = wrap.querySelector(".sd-box");
    var canvas = wrap.querySelector(".sd-canvas");
    var ctx = canvas.getContext("2d");
    var elPontos = wrap.querySelector(".sd-pontos");
    var elRecorde = wrap.querySelector(".sd-recorde");
    var elVidas = wrap.querySelector(".sd-vidas");
    var tela = wrap.querySelector(".sd-tela");
    var titulo = wrap.querySelector(".sd-titulo");
    var botao = wrap.querySelector(".sd-btn");
    var L = 0, A = 0;           // largura / altura lógicas
    var rodando = false;
    var pontos = 0, vidas = 3;
    var recorde = 0;
    try { recorde = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { recorde = 0; }
    elRecorde.textContent = recorde;
    var nave, rochas, tiros, estrelas, teclas = {}, tempo = 0, ultimo = 0;
    function redimensionar() {
      var r = box.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      L = r.width; A = r.height;
      canvas.width = Math.round(L * dpr);
      canvas.height = Math.round(A * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nave) { nave.y = A - 60; nave.x = Math.min(nave.x, L - 20); }
      criarEstrelas();
    }
    function criarEstrelas() {
      estrelas = [];
      var n = Math.round((L * A) / 4500);
      for (var i = 0; i < n; i++) {
        estrelas.push({ x: Math.random() * L, y: Math.random() * A, v: 20 + Math.random() * 70, t: Math.random() * 1.8 + .4 });
      }
    }
    function novoJogo() {
      pontos = 0; vidas = 3; tempo = 0;
      rochas = []; tiros = [];
      nave = { x: L / 2, y: A - 60, r: 14, cd: 0, inv: 0 };
      atualizarHUD();
      tela.hidden = true;
      rodando = true;
      ultimo = performance.now();
      requestAnimationFrame(loop);
    }
    function atualizarHUD() {
      elPontos.textContent = pontos;
      elVidas.textContent = vidas;
      elRecorde.textContent = recorde;
    }
    function fimDeJogo() {
      rodando = false;
      if (pontos > recorde) {
        recorde = pontos;
        try { localStorage.setItem(BEST_KEY, String(recorde)); } catch (e) {}
      }
      atualizarHUD();
      titulo.textContent = "FIM DE JOGO";
      tela.querySelector(".sd-txt").innerHTML = "Você fez <b>" + pontos + "</b> pontos.<br>Recorde: <b>" + recorde + "</b>";
      botao.textContent = "JOGAR DE NOVO";
      tela.hidden = false;
    }
    function atirar() {
      if (!rodando || nave.cd > 0) return;
      tiros.push({ x: nave.x, y: nave.y - 16 });
      nave.cd = .22;
    }
    function loop(agora) {
      if (!rodando) return;
      var dt = Math.min((agora - ultimo) / 1000, .05);
      ultimo = agora;
      tempo += dt;
      atualizar(dt);
      desenhar();
      requestAnimationFrame(loop);
    }
    function atualizar(dt) {
      // nave
      var vel = 330;
      if (teclas.esq) nave.x -= vel * dt;
      if (teclas.dir) nave.x += vel * dt;
      nave.x = Math.max(18, Math.min(L - 18, nave.x));
      nave.y = A - 60;
      if (nave.cd > 0) nave.cd -= dt;
      if (nave.inv > 0) nave.inv -= dt;
      if (teclas.tiro) atirar();
      // estrelas
      for (var i = 0; i < estrelas.length; i++) {
        var e = estrelas[i];
        e.y += e.v * dt;
        if (e.y > A) { e.y = -2; e.x = Math.random() * L; }
      }
      // tiros
      for (var t = tiros.length - 1; t >= 0; t--) {
        tiros[t].y -= 520 * dt;
        if (tiros[t].y < -10) tiros.splice(t, 1);
      }
      // novas rochas
      var chance = Math.min(.9 + tempo * .05, 2.6);
      if (Math.random() < chance * dt) {
        var raio = 14 + Math.random() * 24;
        rochas.push({
          x: raio + Math.random() * (L - raio * 2),
          y: -raio - 5,
          r: raio,
          v: 70 + Math.random() * 90 + tempo * 3,
          g: Math.random() * Math.PI,
          vg: (Math.random() - .5) * 2,
          cor: Math.random() < .5 ? "#8b7b6b" : "#8a8f99"
        });
      }
      // rochas
      for (var k = rochas.length - 1; k >= 0; k--) {
        var ro = rochas[k];
        ro.y += ro.v * dt;
        ro.g += ro.vg * dt;
        if (ro.y - ro.r > A) { rochas.splice(k, 1); pontos += 1; atualizarHUD(); continue; }
        // colisão com tiro
        var acertou = false;
        for (var j = tiros.length - 1; j >= 0; j--) {
          var dx = tiros[j].x - ro.x, dy = tiros[j].y - ro.y;
          if (dx * dx + dy * dy < ro.r * ro.r) {
            tiros.splice(j, 1); acertou = true; break;
          }
        }
        if (acertou) {
          rochas.splice(k, 1);
          pontos += 5;
          atualizarHUD();
          continue;
        }
        // colisão com a nave
        var ax = nave.x - ro.x, ay = nave.y - ro.y;
        var lim = ro.r + nave.r * .7;
        if (nave.inv <= 0 && ax * ax + ay * ay < lim * lim) {
          rochas.splice(k, 1);
          vidas--;
          nave.inv = 1.6;
          atualizarHUD();
          if (vidas <= 0) { fimDeJogo(); return; }
        }
      }
    }
    function desenhar() {
      // fundo
      var g = ctx.createLinearGradient(0, 0, 0, A);
      g.addColorStop(0, "#0a0f28");
      g.addColorStop(1, "#060a1c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, L, A);
      // estrelas
      ctx.fillStyle = "#ffffff";
      for (var i = 0; i < estrelas.length; i++) {
        var e = estrelas[i];
        ctx.globalAlpha = .25 + (e.t % 1) * .6;
        ctx.fillRect(e.x, e.y, e.t, e.t);
      }
      ctx.globalAlpha = 1;
      // tiros
      ctx.fillStyle = "#9fe4ff";
      for (var t = 0; t < tiros.length; t++) {
        ctx.fillRect(tiros[t].x - 1.5, tiros[t].y - 10, 3, 12);
      }
      // rochas
      for (var k = 0; k < rochas.length; k++) {
        var ro = rochas[k];
        ctx.save();
        ctx.translate(ro.x, ro.y);
        ctx.rotate(ro.g);
        ctx.fillStyle = ro.cor;
        ctx.beginPath();
        for (var p = 0; p < 8; p++) {
          var ang = (p / 8) * Math.PI * 2;
          var rr = ro.r * (p % 2 === 0 ? 1 : .82);
          ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // nave
      if (!(nave.inv > 0 && Math.floor(nave.inv * 12) % 2 === 0)) {
        ctx.save();
        ctx.translate(nave.x, nave.y);
        ctx.fillStyle = "#ffb13b";
        ctx.beginPath();
        ctx.moveTo(-5, 12); ctx.lineTo(5, 12); ctx.lineTo(0, 20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#5bb0ff";
        ctx.beginPath();
        ctx.moveTo(0, -16); ctx.lineTo(13, 13); ctx.lineTo(0, 7); ctx.lineTo(-13, 13);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    /* ---------- controles ---------- */
    document.addEventListener("keydown", function (ev) {
      var k = ev.key.toLowerCase();
      if (k === "arrowleft" || k === "a") teclas.esq = true;
      if (k === "arrowright" || k === "d") teclas.dir = true;
      if (k === " " || k === "spacebar") {
        if (rodando) { ev.preventDefault(); teclas.tiro = true; }
      }
      if (k === "enter" && !rodando) novoJogo();
    });
    document.addEventListener("keyup", function (ev) {
      var k = ev.key.toLowerCase();
      if (k === "arrowleft" || k === "a") teclas.esq = false;
      if (k === "arrowright" || k === "d") teclas.dir = false;
      if (k === " " || k === "spacebar") teclas.tiro = false;
    });
    canvas.addEventListener("pointerdown", function (ev) {
      if (!rodando) return;
      canvas.setPointerCapture(ev.pointerId);
      var r = canvas.getBoundingClientRect();
      nave.x = ev.clientX - r.left;
      atirar();
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!rodando || ev.buttons === 0 && ev.pointerType === "mouse") return;
      var r = canvas.getBoundingClientRect();
      nave.x = ev.clientX - r.left;
    });
    botao.addEventListener("click", novoJogo);
    window.addEventListener("resize", redimensionar);
    redimensionar();
    // desenha um fundo parado atrás do menu inicial
    nave = { x: L / 2, y: A - 60, r: 14, cd: 0, inv: 0 };
    rochas = []; tiros = [];
    desenhar();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();