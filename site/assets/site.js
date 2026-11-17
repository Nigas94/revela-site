(function(){
  'use strict';
  var doc = document, racine = doc.documentElement;
  var mq = function(q){ return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduit = mq('(prefers-reduced-motion: reduce)');
  var souris = mq('(hover: hover) and (pointer: fine)');
  var IO = 'IntersectionObserver' in window;
  function tous(sel, ctx){ return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function borne(v, a, b){ return v < a ? a : v > b ? b : v; }
  function jouer(v){ v.muted = true; var p = v.play(); if(p && p.catch) p.catch(function(){}); }
  function observer(el, seuil, f){
    if(!IO){ f(true); return; }
    new IntersectionObserver(function(es){ f(es[es.length - 1].isIntersecting); }, { threshold: seuil }).observe(el);
  }

  /* ---------- Menu mobile ---------- */
  var menu = doc.getElementById('menu'), bMenu = doc.querySelector('.menu-bouton');
  if(menu && bMenu){
    var fermerMenu = function(){
      menu.classList.remove('ouvert');
      bMenu.setAttribute('aria-expanded', 'false');
      bMenu.setAttribute('aria-label', 'Ouvrir le menu');
    };
    bMenu.addEventListener('click', function(){
      var ouvert = menu.classList.toggle('ouvert');
      bMenu.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      bMenu.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    menu.addEventListener('click', function(e){ if(e.target.closest('a')) fermerMenu(); });
    doc.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menu.classList.contains('ouvert')){ fermerMenu(); bMenu.focus(); } });
    doc.addEventListener('click', function(e){ if(!e.target.closest('.entete')) fermerMenu(); });
  }

  /* ---------- Extraits muets : ils ne jouent que lorsqu'on les voit ---------- */
  var pauseAccueil = false;
  var autos = tous('video.auto');
  function majAuto(v){
    var ok = !reduit && v._vu && !doc.hidden && !(pauseAccueil && v.closest('.accueil'));
    if(ok){ if(v.paused) jouer(v); } else if(!v.paused){ v.pause(); }
  }
  autos.forEach(function(v){ observer(v, .2, function(vu){ v._vu = vu; majAuto(v); }); });
  doc.addEventListener('visibilitychange', function(){ autos.forEach(majAuto); });

  /* ---------- Accueil : le projecteur suit le curseur ---------- */
  var accueil = doc.querySelector('.accueil');
  if(accueil){
    var projo = accueil.querySelector('.projo'), scene = accueil.querySelector('.scene-tels');
    var bPauseAccueil = accueil.querySelector('[data-pause-accueil]');
    var base = 118, cible = 118, angle = 118, px = 0, py = 0, cx = 0, cy = 0, suit = false, enVue = true, tourne = false;
    var pivot = function(){ var r = projo.getBoundingClientRect(), u = r.width / 110; return [r.left + 38 * u, r.top + 52 * u]; };
    var viser = function(){
      var p = pivot(), s = scene.getBoundingClientRect();
      var a = Math.atan2(s.top + s.height * .52 - p[1], s.left + s.width * .5 - p[0]) * 180 / Math.PI;
      base = borne(a, 96, 150);
      if(reduit){ accueil.style.setProperty('--angle', base.toFixed(2) + 'deg'); }
    };
    var tic = function(ts){
      if(!enVue || pauseAccueil || reduit){ tourne = false; return; }
      var but = suit ? cible : base + Math.sin(ts / 1800) * 2.6;
      angle += (but - angle) * .075; px += (cx - px) * .075; py += (cy - py) * .075;
      accueil.style.setProperty('--angle', angle.toFixed(2) + 'deg');
      scene.style.setProperty('--px', px.toFixed(3));
      scene.style.setProperty('--py', py.toFixed(3));
      window.requestAnimationFrame(tic);
    };
    var demarrer = function(){ if(!tourne && !reduit && enVue && !pauseAccueil){ tourne = true; window.requestAnimationFrame(tic); } };
    viser(); angle = base;
    window.addEventListener('resize', viser);
    window.addEventListener('load', viser);
    if(souris && !reduit){
      accueil.addEventListener('pointermove', function(e){
        var p = pivot();
        var a = Math.atan2(Math.max(e.clientY - p[1], 40), e.clientX - p[0]) * 180 / Math.PI;
        cible = borne(a, base - 18, base + 10); suit = true;
        var r = accueil.getBoundingClientRect();
        cx = (e.clientX - r.left) / r.width - .5; cy = (e.clientY - r.top) / r.height - .5;
      });
      accueil.addEventListener('pointerleave', function(){ suit = false; cx = 0; cy = 0; });
    }
    observer(accueil, 0, function(vu){ enVue = vu; demarrer(); });
    if(bPauseAccueil){
      if(reduit){ bPauseAccueil.hidden = true; }
      bPauseAccueil.addEventListener('click', function(){
        pauseAccueil = !pauseAccueil;
        racine.classList.toggle('pause-accueil', pauseAccueil);
        bPauseAccueil.setAttribute('aria-pressed', pauseAccueil ? 'true' : 'false');
        bPauseAccueil.setAttribute('aria-label', pauseAccueil ? "Relancer les animations de l'accueil" : "Mettre en pause les animations de l'accueil");
        autos.forEach(majAuto); demarrer();
      });
    }
  }

  /* ---------- Surligneur : le trait jaune passe quand la phrase arrive à l'écran ---------- */
  tous('.surligne').forEach(function(el){
    if(reduit || !IO){ el.classList.add('vu'); return; }
    var o = new IntersectionObserver(function(es){
      if(es[0].isIntersecting){ el.classList.add('vu'); o.disconnect(); }
    }, { threshold: .9, rootMargin: '0px 0px -12% 0px' });
    o.observe(el);
  });

  /* ---------- Défilement : scène du constat, déroulé, bouton mobile ---------- */
  var sceneConstat = doc.querySelector('[data-scene]');
  var videoScene = sceneConstat && sceneConstat.querySelector('video');
  var etapes = doc.querySelector('.etapes'), lesEtapes = etapes ? tous('li', etapes) : [];
  var devis = doc.getElementById('devis'), pied = doc.querySelector('.pied');
  if(sceneConstat && !reduit) sceneConstat.classList.add('epingle');
  if(reduit) lesEtapes.forEach(function(li){ li.classList.add('atteint'); });
  var attente = false;
  function adoucir(x){ return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function majDefilement(){
    attente = false;
    var h = window.innerHeight, r;
    if(sceneConstat && !reduit){
      r = sceneConstat.getBoundingClientRect();
      var p = borne(-r.top / Math.max(1, r.height - h), 0, 1);
      var w = adoucir(borne((p - .26) / .44, 0, 1));
      sceneConstat.style.setProperty('--w', w.toFixed(4));
      sceneConstat.style.setProperty('--d', borne(p / .5, 0, 1).toFixed(4));
      sceneConstat.style.setProperty('--t', borne((p - .4) / .16, 0, 1).toFixed(4));
      var visible = r.bottom > 0 && r.top < h && !doc.hidden;
      if(videoScene){
        if(visible && p > .04){ if(videoScene.paused) jouer(videoScene); }
        else if(!videoScene.paused){ videoScene.pause(); }
      }
    }
    if(etapes && !reduit){
      r = etapes.getBoundingClientRect();
      var q = borne((h * .78 - r.top) / (r.height + h * .2), 0, 1);
      etapes.style.setProperty('--p', q.toFixed(4));
      lesEtapes.forEach(function(li, i){ li.classList.toggle('atteint', q >= i / (lesEtapes.length - 1) - .02); });
    }
    if(accueil && devis){
      var passe = accueil.getBoundingClientRect().bottom < 0;
      var surDevis = devis.getBoundingClientRect().top < h * .85;
      racine.classList.toggle('cta-visible', passe && !surDevis);
    }
  }
  function demander(){ if(!attente){ attente = true; window.requestAnimationFrame(majDefilement); } }
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', demander);
  doc.addEventListener('visibilitychange', demander);
  if(videoScene && reduit){ videoScene.setAttribute('controls', ''); }
  majDefilement();

  /* ---------- Méthode : les trois questions en « stories » ---------- */
  var st = doc.querySelector('[data-stories]');
  if(st){
    var sVids = tous('.story', st), sBarres = tous('.stories-barres span', st), sItems = tous('.questions li', st);
    var sNom = st.querySelector('[data-story-nom]'), sPause = st.querySelector('[data-stories-pause]');
    var si = 0, sEtat = { pause: false, visible: false };
    var sArrete = function(){ return reduit || sEtat.pause || !sEtat.visible || doc.hidden; };
    var sMaj = function(){
      st.classList.toggle('arret', sArrete());
      sVids.forEach(function(v, k){ if(k === si && !sArrete()){ if(v.paused) jouer(v); } else if(!v.paused){ v.pause(); } });
    };
    var sAller = function(k){
      si = (k + sVids.length) % sVids.length;
      sVids.forEach(function(v, j){ v.classList.toggle('actif', j === si); });
      sItems.forEach(function(li, j){
        li.classList.toggle('actif', j === si);
        var b = li.querySelector('button');
        if(j === si) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      sBarres.forEach(function(b, j){ b.classList.remove('encours'); b.classList.toggle('fait', j < si); });
      void sBarres[si].offsetWidth;
      if(!reduit) sBarres[si].classList.add('encours');
      if(sNom) sNom.textContent = sVids[si].getAttribute('data-nom');
      try{ sVids[si].currentTime = 0; }catch(e){}
      sMaj();
    };
    sBarres.forEach(function(b){ b.firstElementChild.addEventListener('animationend', function(){ sAller(si + 1); }); });
    sItems.forEach(function(li, j){ li.querySelector('button').addEventListener('click', function(){ sAller(j); }); });
    if(sPause){
      if(reduit){ sPause.hidden = true; }
      sPause.addEventListener('click', function(){
        sEtat.pause = !sEtat.pause;
        sPause.setAttribute('aria-pressed', sEtat.pause ? 'true' : 'false');
        sPause.setAttribute('aria-label', sEtat.pause ? 'Relancer les extraits' : 'Mettre en pause les extraits');
        sMaj();
      });
    }
    observer(st, .35, function(vu){ sEtat.visible = vu; sMaj(); });
    doc.addEventListener('visibilitychange', sMaj);
    sAller(0);
  }

  /* ---------- Frise : 35 secondes jouées en 7, à chaque arrivée à l'écran ---------- */
  var frise = doc.querySelector('[data-frise]');
  if(frise){
    var fSegs = tous('.seg', frise), fLeg = tous('.frise-legende li', frise);
    var fPiste = frise.querySelector('.frise-piste'), fTemps = frise.querySelector('[data-frise-temps]'), fBouton = frise.querySelector('[data-frise-bouton]');
    var durees = [3, 4, 3, 5, 5, 4, 4, 7], debuts = [], total = 0;
    durees.forEach(function(d){ debuts.push(total); total += d; });
    var ft = 0, fEnCours = false, fFini = false, fManuel = false, fDernier = 0, VITESSE = total / 7;
    var fIndice = function(){ for(var i = debuts.length - 1; i >= 0; i--){ if(ft >= debuts[i]) return i; } return 0; };
    var fAfficher = function(){
      fSegs.forEach(function(s, k){ s.style.setProperty('--r', borne((ft - debuts[k]) / durees[k], 0, 1).toFixed(3)); });
      var k = Math.min(fIndice(), fSegs.length - 1), s = fSegs[k];
      var x = (s.offsetLeft + borne((ft - debuts[k]) / durees[k], 0, 1) * s.offsetWidth) / Math.max(1, fPiste.offsetWidth);
      fPiste.style.setProperty('--x', x.toFixed(4));
      fLeg.forEach(function(l, j){ l.classList.toggle('actif', j === k); });
      var sec = Math.min(total, Math.floor(ft));
      fTemps.textContent = (sec < 10 ? '0' : '') + sec + ' s';
    };
    var fLibelle = function(){ fBouton.textContent = fEnCours ? 'Pause' : (fFini || ft === 0 ? 'Rejouer la frise' : 'Reprendre'); };
    var fBoucle = function(ts){
      if(!fEnCours) return;
      ft += Math.min(.1, (ts - fDernier) / 1000) * VITESSE; fDernier = ts;
      if(ft >= total){ ft = total; fEnCours = false; fFini = true; }
      fAfficher(); fLibelle();
      if(fEnCours) window.requestAnimationFrame(fBoucle);
    };
    var fLancer = function(){
      if(fFini || ft >= total){ ft = 0; fFini = false; }
      fEnCours = true; fDernier = window.performance.now(); fLibelle();
      window.requestAnimationFrame(fBoucle);
    };
    var fArreter = function(){ fEnCours = false; fLibelle(); };
    var fAllerA = function(t){ ft = borne(t, 0, total); fFini = ft >= total; fArreter(); fManuel = true; fAfficher(); fLibelle(); };
    fBouton.addEventListener('click', function(){ if(fEnCours){ fArreter(); fManuel = true; } else { fManuel = false; fLancer(); } });
    fLeg.forEach(function(l, j){ l.querySelector('button').addEventListener('click', function(){ fAllerA(debuts[j] + .001); }); });
    fPiste.addEventListener('click', function(e){
      var r = fPiste.getBoundingClientRect();
      fAllerA(borne((e.clientX - r.left) / r.width, 0, 1) * total);
    });
    window.addEventListener('resize', fAfficher);
    if(reduit){ ft = total; fFini = true; }
    fAfficher(); fLibelle();
    if(!reduit){
      observer(frise, .3, function(vu){
        if(vu){ if(!fManuel && !fEnCours){ ft = 0; fFini = false; fLancer(); } }
        else if(fEnCours){ fArreter(); }
      });
    }
  }

  /* ---------- Réalisations : un halo suit le curseur dans la salle ---------- */
  var salle = doc.querySelector('[data-salle]');
  if(salle && souris && !reduit){
    var sx = 0, sy = 0, sAttente = false;
    salle.addEventListener('pointermove', function(e){
      var r = salle.getBoundingClientRect();
      sx = e.clientX - r.left; sy = e.clientY - r.top;
      if(!sAttente){
        sAttente = true;
        window.requestAnimationFrame(function(){
          sAttente = false;
          salle.style.setProperty('--lx', sx.toFixed(0) + 'px');
          salle.style.setProperty('--ly', sy.toFixed(0) + 'px');
        });
      }
    });
  }

  /* ---------- Carrousels : un anneau de vidéos par client, qui tourne tout seul ---------- */
  var lecteur = doc.getElementById('lecteur-video');
  var integre = racine.getAttribute('data-embed') === 'youtube';
  var carrousels = [];
  tous('[data-carrousel]').forEach(function(box){
    var anneau = box.querySelector('.anneau');
    var cartes = Array.prototype.slice.call(anneau.children);
    var n = cartes.length, idx = 0;
    var num = box.querySelector('[data-num]'), annonce = box.querySelector('[data-annonce]');
    var barre = box.querySelector('.progression span');
    var bPause = box.querySelector('[data-pause]');
    var etat = { pause: false, survol: false, focus: false, visible: false };

    function arrete(){ return reduit || etat.pause || etat.survol || etat.focus || !etat.visible || doc.hidden || (lecteur && lecteur.open); }
    function apercus(){
      cartes.forEach(function(c, i){
        var v = c.querySelector('video');
        if(!v) return;
        if(i === idx && !reduit && !etat.pause && etat.visible && !doc.hidden && !(lecteur && lecteur.open)){ if(v.paused) jouer(v); }
        else if(!v.paused){ v.pause(); }
      });
    }
    function maj(){ box.classList.toggle('arret', arrete()); apercus(); }
    function relancer(){
      if(reduit) return;
      box.classList.remove('joue');
      void barre.offsetWidth;
      box.classList.add('joue');
    }
    function placer(nouveau, parUtilisateur){
      idx = (nouveau + n) % n;
      cartes.forEach(function(c, i){
        var d = (i - idx + n) % n;
        c.classList.remove('d-centre', 'd-droite', 'd-gauche', 'd-fond');
        c.classList.add(d === 0 ? 'd-centre' : d === 1 ? 'd-droite' : d === n - 1 ? 'd-gauche' : 'd-fond');
        if(d === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
        var lien = c.querySelector('a.ecran');
        if(lien) lien.tabIndex = d === 0 ? 0 : -1;
      });
      num.textContent = (idx + 1 < 10 ? '0' : '') + (idx + 1);
      if(parUtilisateur){
        annonce.textContent = 'Vidéo ' + (idx + 1) + ' sur ' + n + ' : ' + cartes[idx].querySelector('.projet-titre').textContent;
      }
      relancer();
      maj();
    }

    barre.addEventListener('animationend', function(){ placer(idx + 1, false); });
    box.querySelector('[data-prec]').addEventListener('click', function(){ placer(idx - 1, true); });
    box.querySelector('[data-suiv]').addEventListener('click', function(){ placer(idx + 1, true); });
    bPause.addEventListener('click', function(){
      etat.pause = !etat.pause;
      bPause.setAttribute('aria-pressed', etat.pause ? 'true' : 'false');
      bPause.setAttribute('aria-label', etat.pause ? 'Reprendre le défilement' : 'Mettre en pause le défilement');
      maj();
    });
    /* Pause au survol de l'anneau et quand le clavier est dans le carrousel (pas après un simple toucher). */
    anneau.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse'){ etat.survol = true; maj(); } });
    anneau.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse'){ etat.survol = false; maj(); } });
    box.addEventListener('focusin', function(e){
      var clavier = true;
      try{ clavier = e.target.matches(':focus-visible'); }catch(err){}
      if(clavier){ etat.focus = true; maj(); }
    });
    box.addEventListener('focusout', function(e){ if(!box.contains(e.relatedTarget)){ etat.focus = false; maj(); } });
    box.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ e.preventDefault(); placer(idx - 1, true); }
      if(e.key === 'ArrowRight'){ e.preventDefault(); placer(idx + 1, true); }
    });

    /* Glisser du doigt (ou de la souris) pour tourner ; un glissé n'ouvre pas la vidéo. */
    var x0 = null, y0 = 0, glisse = false;
    anneau.addEventListener('pointerdown', function(e){ x0 = e.clientX; y0 = e.clientY; glisse = false; });
    anneau.addEventListener('pointerup', function(e){
      if(x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){ glisse = true; placer(idx + (dx < 0 ? 1 : -1), true); }
    });
    anneau.addEventListener('pointercancel', function(){ x0 = null; });
    anneau.addEventListener('dragstart', function(e){ e.preventDefault(); });
    anneau.addEventListener('click', function(e){
      var c = e.target.closest('.diapo');
      if(!c) return;
      if(glisse){ e.preventDefault(); glisse = false; return; }
      var i = cartes.indexOf(c);
      if(i !== idx){ e.preventDefault(); placer(i, true); return; }
      var lien = c.querySelector('a[data-youtube]');
      if(lien && lecteur && integre && typeof lecteur.showModal === 'function'){
        e.preventDefault();
        ouvrirVideo(lien);
      }
    });

    observer(box, .3, function(vu){ etat.visible = vu; maj(); });
    carrousels.push(maj);
    placer(0, false);
  });
  doc.addEventListener('visibilitychange', function(){ carrousels.forEach(function(f){ f(); }); });

  /* Sur le site en ligne, la vidéo complète se charge depuis YouTube seulement au clic (mode confidentialité renforcée). */
  var origine = null;
  function ouvrirVideo(a){
    var f = doc.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.getAttribute('data-youtube')) + '?autoplay=1&playsinline=1&rel=0';
    f.title = a.getAttribute('data-titre');
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    lecteur.querySelector('.lecteur-cadre').appendChild(f);
    doc.getElementById('lecteur-titre').textContent = 'Vidéo « ' + a.getAttribute('data-titre') + ' »';
    origine = a;
    lecteur.showModal();
    carrousels.forEach(function(m){ m(); });
  }
  if(lecteur){
    if(integre){
      tous('a[data-youtube]').forEach(function(a){
        a.setAttribute('aria-label', 'Lancer la vidéo « ' + a.getAttribute('data-titre') + ' », ' + a.getAttribute('data-duree') + ', chargée depuis YouTube');
      });
    }
    lecteur.querySelector('.lecteur-fermer').addEventListener('click', function(){ lecteur.close(); });
    lecteur.addEventListener('click', function(e){ if(e.target === lecteur) lecteur.close(); });
    lecteur.addEventListener('close', function(){
      lecteur.querySelector('.lecteur-cadre').textContent = '';
      carrousels.forEach(function(m){ m(); });
      if(origine){ origine.focus(); origine = null; }
    });
  }

  /* ---------- Boutons aimantés et grand nom élastique ---------- */
  if(souris && !reduit){
    tous('[data-aimant]').forEach(function(b){
      b.addEventListener('pointermove', function(e){
        var r = b.getBoundingClientRect();
        b.style.setProperty('translate', ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function(){ b.style.removeProperty('translate'); });
    });
  }
  var geant = doc.querySelector('[data-elastique]');
  if(geant && pied && !reduit){
    geant.style.setProperty('--etire', '62%');
    geant.style.setProperty('transition', 'font-stretch .7s cubic-bezier(.2,.8,.2,1)');
    observer(geant, .6, function(vu){ if(vu) geant.style.setProperty('--etire', '125%'); else if(!souris) geant.style.setProperty('--etire', '62%'); });
    if(souris){
      pied.addEventListener('pointermove', function(e){
        var r = pied.getBoundingClientRect();
        geant.style.setProperty('--etire', (70 + 55 * borne((e.clientX - r.left) / r.width, 0, 1)).toFixed(1) + '%');
      });
      pied.addEventListener('pointerleave', function(){ geant.style.setProperty('--etire', '125%'); });
    }
  }

  /* ---------- Copier un numéro ou une adresse ---------- */
  function signaler(btn, texte){
    if(!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
    btn.textContent = texte;
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){ btn.textContent = btn.getAttribute('data-label'); }, 2200);
  }
  function selectionner(el){
    if(!el) return;
    if(typeof el.select === 'function'){ el.focus(); el.select(); return; }
    try{
      var r = doc.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }catch(e){}
  }
  function copier(texte, btn, cible, ok, repli){
    var echec = function(){ selectionner(cible); signaler(btn, repli); };
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(texte).then(function(){ signaler(btn, ok); }, echec);
      } else { echec(); }
    }catch(e){ echec(); }
  }
  tous('button[data-copie]').forEach(function(btn){
    btn.addEventListener('click', function(){
      copier(btn.getAttribute('data-copie'), btn, doc.getElementById(btn.getAttribute('data-cible')), 'Copié', 'Sélectionné');
    });
  });

  /* ---------- Formulaire de devis ---------- */
  var form = doc.getElementById('form-devis');
  if(form){
    var obligatoires = [
      ['f-nom', 'Indiquez votre nom.'],
      ['f-offre', 'Décrivez en quelques mots le produit ou le service à présenter.'],
      ['f-email', 'Indiquez votre adresse e-mail pour que nous puissions vous répondre.']
    ];
    var MESSAGE_EMAIL = 'Indiquez une adresse e-mail valide, par exemple camille@exemple.fr.';
    var val = function(id){ return doc.getElementById(id).value.trim(); };
    var emailValide = function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };

    tous('[data-formule]').forEach(function(a){
      a.addEventListener('click', function(){ doc.getElementById('f-formule').value = a.getAttribute('data-formule'); });
    });

    obligatoires.forEach(function(o){
      doc.getElementById(o[0]).addEventListener('input', function(){
        var err = doc.getElementById(o[0] + '-err');
        var ok = this.value.trim() && (o[0] !== 'f-email' || emailValide(this.value.trim()));
        if(ok){ this.setAttribute('aria-invalid', 'false'); err.hidden = true; }
      });
    });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var premier = null;
      obligatoires.forEach(function(o){
        var el = doc.getElementById(o[0]), err = doc.getElementById(o[0] + '-err');
        var v = el.value.trim();
        var message = !v ? o[1] : (o[0] === 'f-email' && !emailValide(v) ? MESSAGE_EMAIL : '');
        el.setAttribute('aria-invalid', message ? 'true' : 'false');
        el.setAttribute('aria-describedby', o[0] + '-err');
        err.textContent = message;
        err.hidden = !message;
        if(message && !premier) premier = el;
      });
      if(premier){ premier.focus(); return; }

      var questions = [['f-q1', 'à quoi sert notre produit ou service'], ['f-q2', 'comment nous travaillons'], ['f-q3', 'pourquoi nous choisir']]
        .filter(function(q){ return doc.getElementById(q[0]).checked; })
        .map(function(q){ return q[1]; });

      var lignes = ['Bonjour Révéla,', '', 'Je souhaite un devis pour une vidéo explicative en motion design.', '', 'Nom : ' + val('f-nom')];
      if(val('f-entreprise')) lignes.push('Entreprise : ' + val('f-entreprise'));
      lignes.push('Produit ou service : ' + val('f-offre'));
      var sel = doc.getElementById('f-formule');
      if(sel.value) lignes.push('Formule qui m\'intéresse : ' + sel.options[sel.selectedIndex].text);
      if(questions.length) lignes.push('La vidéo doit expliquer : ' + questions.join(', '));
      if(val('f-message')) lignes.push('', val('f-message'));
      lignes.push('', 'Me répondre : ' + val('f-email') + (val('f-tel') ? ' · ' + val('f-tel') : ''), '', 'Merci !');

      var corps = lignes.join('\n');
      var sujet = 'Demande de devis Révéla · ' + (val('f-entreprise') || val('f-nom'));
      doc.getElementById('f-apercu').value = corps;
      doc.getElementById('b-mail').href = 'mailto:revela.motion@gmail.com?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);

      function montrer(id, titreId){
        var bloc = doc.getElementById(id);
        bloc.hidden = false;
        bloc.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'nearest' });
        doc.getElementById(titreId).focus({ preventScroll: true });
      }

      /* Site en ligne : la demande part directement chez Révéla (Netlify Forms). */
      if(racine.getAttribute('data-form') === 'netlify'){
        var bouton = form.querySelector('button[type=submit]');
        var libelle = bouton.textContent;
        bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
        doc.getElementById('resultat').hidden = true;
        var donnees = new URLSearchParams(new FormData(form));
        donnees.delete('explications');
        donnees.set('explications', questions.join(', ') || 'Non précisé');
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: donnees.toString()
        }).then(function(r){
          if(!r.ok) throw new Error('HTTP ' + r.status);
          tous('input:not([type=hidden]):not([type=checkbox]), textarea, select', form).forEach(function(c){ c.value = ''; });
          bouton.textContent = 'Demande envoyée';
          montrer('envoye', 'envoye-titre');
        }).catch(function(){
          bouton.disabled = false; bouton.textContent = libelle;
          doc.getElementById('resultat-titre').textContent = "L'envoi n'a pas fonctionné.";
          doc.getElementById('resultat-texte').textContent = 'Votre demande est prête ci-dessous : copiez-la et envoyez-la à revela.motion@gmail.com, ou réessayez dans un instant.';
          montrer('resultat', 'resultat-titre');
        });
        return;
      }

      montrer('resultat', 'resultat-titre');
    });

    doc.getElementById('b-copier-demande').addEventListener('click', function(){
      var zone = doc.getElementById('f-apercu');
      copier(zone.value, this, zone, 'Message copié', 'Texte sélectionné');
    });
  }
})();
