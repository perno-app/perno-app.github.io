// Sito di PERNO — movimento e interazioni. Niente librerie, niente richieste ad altri servizi.
(function () {
  "use strict";
  // Chi ha chiesto al sistema di ridurre le animazioni vede la pagina ferma.
  // «?movimento» nell'indirizzo la fa muovere comunque: serve a provarla da un computer che le ha spente.
  var forza = /[?&]movimento\b/.test(location.search);
  var fermo = !forza && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---------- Testata: bordo quando si scorre, menu da telefono, voce attiva ----------
  var testata = $("#testata");
  var menu = $("#menu");
  var pulsante = $("#menu-pulsante");
  function bordo() { testata.classList.toggle("staccata", window.scrollY > 8); }
  window.addEventListener("scroll", bordo, { passive: true });
  bordo();
  function chiudiMenu() {
    menu.classList.remove("aperto");
    pulsante.setAttribute("aria-expanded", "false");
    pulsante.setAttribute("aria-label", "Apri il menu");
  }
  pulsante.addEventListener("click", function () {
    var aperto = menu.classList.toggle("aperto");
    pulsante.setAttribute("aria-expanded", aperto ? "true" : "false");
    pulsante.setAttribute("aria-label", aperto ? "Chiudi il menu" : "Apri il menu");
  });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", chiudiMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") chiudiMenu(); });

  var vociMenu = $$('a[href^="#"]', menu);
  if ("IntersectionObserver" in window) {
    var osservaSezioni = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        vociMenu.forEach(function (a) { a.classList.toggle("qui", a.getAttribute("href") === "#" + v.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    vociMenu.forEach(function (a) {
      var s = document.getElementById(a.getAttribute("href").slice(1));
      if (s) osservaSezioni.observe(s);
    });
  }

  // ---------- Il logo che si avvita (tempi della schermata di avvio, PRD §6.4) ----------
  var apertura = $(".apertura");
  var asta = $("#avv-asta"), anello = $("#avv-anello"), nome = $("#avv-nome"), payoff = $("#avv-payoff");
  function fine() {
    asta.setAttribute("transform", "");
    anello.setAttribute("stroke-dasharray", "100 0");
    anello.setAttribute("transform", "");
    nome.style.opacity = 1; nome.style.letterSpacing = "0.23em"; nome.style.transform = "none";
    payoff.style.opacity = 1;
    apertura.classList.add("partito");
  }
  function tratto(t, a, b) { return Math.min(1, Math.max(0, (t - a) / (b - a))); }
  function rimbalzo(x) { // approssima cubic-bezier(.2,.8,.3,1.15): arriva, supera appena, torna
    var c1 = 1.15, s = 1 - Math.pow(1 - x, 3);
    return s + (c1 - 1) * Math.sin(Math.PI * x) * x;
  }
  if (fermo) {
    fine();
  } else {
    asta.style.opacity = 0;
    var inizio = null;
    var passo = function (ora) {
      if (inizio === null) inizio = ora;
      var t = ora - inizio;
      // asta: 0 → 500 ms, scende da −110 con rimbalzo
      var pa = tratto(t, 0, 500);
      asta.style.opacity = Math.min(1, pa * 2);
      asta.setAttribute("transform", "translate(0 " + (-110 * (1 - rimbalzo(pa))) + ")");
      // anello: la rotazione corre avanti (280 → 520), la lunghezza la insegue (280 → 780)
      var pr = 1 - Math.pow(1 - tratto(t, 280, 520), 1.5);
      var pl = 1 - Math.pow(1 - tratto(t, 280, 780), 2.2);
      var sc = 0.92 + 0.08 * tratto(t, 280, 960);
      var rot = -90 + 360 * pr;
      anello.setAttribute("stroke-dasharray", (pl * 100).toFixed(2) + " 100");
      anello.setAttribute("transform", "rotate(" + rot.toFixed(2) + " 107 75) translate(107 75) scale(" + sc.toFixed(3) + ") translate(-107 -75)");
      // PERNO: 810 → 1270, spaziatura da 0,55 a 0,23 em, sale di 5 px
      var pn = tratto(t, 810, 1270), en = 1 - Math.pow(1 - pn, 2);
      nome.style.opacity = en;
      nome.style.letterSpacing = (0.55 - 0.32 * en).toFixed(3) + "em";
      nome.style.transform = "translateY(" + (5 * (1 - en)).toFixed(2) + "px)";
      // payoff: 960 → 1360
      payoff.style.opacity = tratto(t, 960, 1360);
      if (t < 1400) requestAnimationFrame(passo); else fine();
    };
    setTimeout(function () { apertura.classList.add("partito"); }, 50);
    requestAnimationFrame(passo);
  }

  // ---------- Comparsa dei blocchi mentre si scorre ----------
  var rivela = $$(".rivela");
  if (!fermo && "IntersectionObserver" in window) {
    var osservaRivela = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("vista"); osservaRivela.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    rivela.forEach(function (el, i) {
      var fratelli = el.parentElement ? $$(":scope > .rivela", el.parentElement) : [];
      var n = fratelli.indexOf(el);
      if (n > 0) el.style.transitionDelay = Math.min(n, 6) * 80 + "ms";
      osservaRivela.observe(el);
    });
  } else {
    rivela.forEach(function (el) { el.classList.add("vista"); });
  }

  // ---------- Video: partono solo quando si vedono ----------
  function quandoVisibile(el, dentro, fuori) {
    if (!("IntersectionObserver" in window)) { dentro(); return; }
    new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { v.isIntersecting ? dentro() : fuori(); });
    }, { threshold: 0.35 }).observe(el);
  }
  function suona(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function preparaFermo(v) { v.controls = true; v.removeAttribute("loop"); }

  var videoApertura = $(".apertura video");
  if (fermo) preparaFermo(videoApertura);
  else quandoVisibile(videoApertura, function () { suona(videoApertura); }, function () { videoApertura.pause(); });

  // ---------- Il problema: i foglietti sparsi si raccolgono in PERNO ----------
  var sparsi = $("#sparsi");
  var foglietti = $$(".foglietto", sparsi);
  var disordine = [[0.02, 0.04, -7], [0.38, 0.0, 5], [0.08, 0.36, 4], [0.42, 0.42, -5], [0.12, 0.72, -3]];
  function disponi() {
    var w = sparsi.clientWidth, raccolto = sparsi.classList.contains("raccolto");
    foglietti.forEach(function (f, i) {
      f.style.setProperty("--i", i);
      var fw = f.offsetWidth;
      if (raccolto) {
        f.style.width = (w - 44) + "px";
        f.style.setProperty("--x", "22px");
        f.style.setProperty("--y", (40 + 72 + i * 70) + "px");
        f.style.setProperty("--r", "0deg");
      } else {
        f.style.width = "";
        var d = disordine[i];
        f.style.setProperty("--x", Math.min(d[0] * w, w - fw) + "px");
        f.style.setProperty("--y", d[1] * 420 + "px");
        f.style.setProperty("--r", d[2] + "deg");
      }
    });
  }
  disponi();
  window.addEventListener("resize", disponi);
  if (fermo) { sparsi.classList.add("raccolto"); disponi(); }
  else if ("IntersectionObserver" in window) {
    var osservaSparsi = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) {
          setTimeout(function () { sparsi.classList.add("raccolto"); disponi(); }, 700);
          osservaSparsi.disconnect();
        }
      });
    }, { threshold: 0.55 });
    osservaSparsi.observe(sparsi);
  } else { sparsi.classList.add("raccolto"); disponi(); }

  // ---------- Come si usa: tre passi, ognuno col suo video, si susseguono da soli ----------
  var passi = $$(".passo");
  var videoPassi = $("#passi-video");
  var passoOra = 0, passiVisibili = false;
  function vaiAlPasso(n, suonaSubito) {
    passoOra = n;
    passi.forEach(function (p, i) {
      p.classList.toggle("attivo", i === n);
      p.setAttribute("aria-pressed", i === n ? "true" : "false");
      $(".passo-barra span", p).style.width = "0%";
    });
    videoPassi.poster = passi[n].dataset.poster;
    videoPassi.src = passi[n].dataset.video;
    if (suonaSubito && !fermo) suona(videoPassi);
  }
  passi.forEach(function (p, i) { p.addEventListener("click", function () { vaiAlPasso(i, true); }); });
  videoPassi.addEventListener("timeupdate", function () {
    if (!videoPassi.duration) return;
    $(".passo-barra span", passi[passoOra]).style.width = (100 * videoPassi.currentTime / videoPassi.duration) + "%";
  });
  videoPassi.addEventListener("ended", function () {
    $(".passo-barra span", passi[passoOra]).style.width = "100%";
    setTimeout(function () { vaiAlPasso((passoOra + 1) % passi.length, passiVisibili); }, 600);
  });
  if (fermo) preparaFermo(videoPassi);
  else quandoVisibile(videoPassi, function () { passiVisibili = true; suona(videoPassi); }, function () { passiVisibili = false; videoPassi.pause(); });

  // ---------- Cosa fa: le sei sezioni ----------
  var SEZIONI = {
    manutenzione: {
      titolo: "Manutenzione & Home",
      riga: "Le scadenze che tornano: a ogni conferma la prossima si ricalcola da sé.",
      punti: [
        "Bollo, revisione, caldaia, filtri, documenti d'identità: ognuna con la sua ripetizione, ogni anno o ogni quanto vuoi.",
        "Segni «fatto» e PERNO propone la data successiva.",
        "L'avviso arriva una settimana prima e il giorno stesso, all'ora che scegli."
      ]
    },
    eventi: {
      titolo: "Eventi",
      riga: "Compleanni, visite, impegni: quelli che tornano ogni anno e quelli di una volta sola.",
      punti: [
        "Ricorrenti, come compleanni e vaccini, o di una volta sola, come la visita dal dentista.",
        "Il promemoria lo scegli tu, evento per evento.",
        "Ogni evento è rivolto a chi riguarda: a te, a qualcuno o a tutta la Casa."
      ]
    },
    oggetti: {
      titolo: "Trova Oggetti",
      riga: "Le cose di casa e dove stanno: la ricerca guarda nome, posizione e note.",
      punti: [
        "Nome, posto e una foto, per le cose che si cercano una volta l'anno.",
        "Scrivi «chiavi» e trovi il cassetto giusto.",
        "Ogni oggetto lo vede tutta la Casa, oppure solo le persone che scegli."
      ]
    },
    partire: {
      titolo: "Prima di Partire",
      riga: "Cosa sistemare in casa e cosa portarsi dietro prima di un viaggio: le spunte si azzerano per quello dopo.",
      punti: [
        "Due liste: cosa sistemare in casa prima di partire e cosa mettere in valigia.",
        "Si spunta con un tocco; al viaggio dopo si riparte da zero.",
        "Le voci più comuni sono già pronte da aggiungere."
      ]
    },
    spese: {
      titolo: "Spese",
      riga: "Chi ha pagato quanto: a fine mese il conto si chiude col minor numero di passaggi.",
      punti: [
        "Ogni spesa dice chi l'ha pagata e come si divide: in parti uguali o in percentuale.",
        "Il conguaglio dice chi deve dare quanto a chi, col minor numero di passaggi di denaro.",
        "«Segna come saldato» chiude il mese, e resta nello storico."
      ]
    },
    documenti: {
      titolo: "Documenti",
      riga: "Contratti, polizze, garanzie, referti: quello che alleghi a una scheda compare qui da sé.",
      punti: [
        "PDF e foto, divisi per categoria, con una ricerca propria.",
        "Per entrare serve lo sblocco del telefono: impronta, volto o codice.",
        "Un documento lo vede tutta la Casa, oppure solo le persone che scegli."
      ]
    }
  };
  var schede = $$(".scheda-sez");
  var videoSez = $("#sez-video");
  var testoSez = $("#sez-testo");
  var sezVisibile = false;
  function scriviTesto(k) {
    var s = SEZIONI[k];
    testoSez.innerHTML = "";
    var h = document.createElement("h3"); h.textContent = s.titolo; testoSez.appendChild(h);
    var p = document.createElement("p"); p.className = "riga"; p.textContent = s.riga; testoSez.appendChild(p);
    var ul = document.createElement("ul");
    s.punti.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    testoSez.appendChild(ul);
  }
  function apriSezione(i, conFocus) {
    var k = schede[i].dataset.sez;
    schede.forEach(function (b, j) {
      b.classList.toggle("attiva", j === i);
      b.setAttribute("aria-selected", j === i ? "true" : "false");
      b.tabIndex = j === i ? 0 : -1;
    });
    if (conFocus) schede[i].focus();
    schede[i].scrollIntoView({ block: "nearest", inline: "nearest", behavior: fermo ? "auto" : "smooth" });
    var cambio = function () {
      scriviTesto(k);
      videoSez.poster = "/video/" + k + ".jpg";
      videoSez.src = "/video/" + k + ".mp4";
      if (sezVisibile && !fermo) suona(videoSez);
      videoSez.classList.remove("cambia"); testoSez.classList.remove("cambia");
    };
    if (fermo) { cambio(); return; }
    videoSez.classList.add("cambia"); testoSez.classList.add("cambia");
    setTimeout(cambio, 220);
  }
  schede.forEach(function (b, i) {
    b.addEventListener("click", function () { apriSezione(i, false); });
    b.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % schede.length;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + schede.length) % schede.length;
      if (n !== null) { e.preventDefault(); apriSezione(n, true); }
    });
    b.tabIndex = i === 0 ? 0 : -1;
  });
  scriviTesto("manutenzione");
  if (fermo) preparaFermo(videoSez);
  else quandoVisibile(videoSez, function () { sezVisibile = true; suona(videoSez); }, function () { sezVisibile = false; videoSez.pause(); });
})();
