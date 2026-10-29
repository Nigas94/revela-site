(function(){
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function signaler(btn, texte){
    if(!btn.dataset.label) btn.dataset.label = btn.textContent;
    btn.textContent = texte;
    clearTimeout(btn._t);
    btn._t = setTimeout(function(){ btn.textContent = btn.dataset.label; }, 2200);
  }
  function selectionner(el){
    if(!el) return;
    if(typeof el.select === 'function'){ el.focus(); el.select(); return; }
    try{
      var r = document.createRange(); r.selectNodeContents(el);
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

  document.querySelectorAll('button[data-copie]').forEach(function(btn){
    btn.addEventListener('click', function(){
      copier(btn.dataset.copie, btn, document.getElementById(btn.dataset.cible), 'Copié', 'Sélectionné');
    });
  });

  var form = document.getElementById('form-devis');
  var obligatoires = [
    ['f-nom', 'Indiquez votre nom.'],
    ['f-offre', 'Décrivez en quelques mots le produit ou le service à présenter.'],
    ['f-email', 'Indiquez votre adresse e-mail pour que nous puissions vous répondre.']
  ];
  var MESSAGE_EMAIL = 'Indiquez une adresse e-mail valide, par exemple camille@exemple.fr.';
  function val(id){ return document.getElementById(id).value.trim(); }
  function emailValide(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  obligatoires.forEach(function(o){
    document.getElementById(o[0]).addEventListener('input', function(){
      var err = document.getElementById(o[0] + '-err');
      var ok = this.value.trim() && (o[0] !== 'f-email' || emailValide(this.value.trim()));
      if(ok){ this.setAttribute('aria-invalid', 'false'); err.hidden = true; }
    });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var premier = null;
    obligatoires.forEach(function(o){
      var el = document.getElementById(o[0]), err = document.getElementById(o[0] + '-err');
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
      .filter(function(q){ return document.getElementById(q[0]).checked; })
      .map(function(q){ return q[1]; });

    var lignes = ['Bonjour Révéla,', '', 'Je souhaite un devis pour une vidéo explicative en motion design.', '', 'Nom : ' + val('f-nom')];
    if(val('f-entreprise')) lignes.push('Entreprise : ' + val('f-entreprise'));
    lignes.push('Produit ou service : ' + val('f-offre'));
    var sel = document.getElementById('f-formule');
    if(sel.value) lignes.push('Formule qui m\'intéresse : ' + sel.options[sel.selectedIndex].text);
    if(questions.length) lignes.push('La vidéo doit expliquer : ' + questions.join(', '));
    if(val('f-message')) lignes.push('', val('f-message'));
    lignes.push('', 'Me répondre : ' + val('f-email') + (val('f-tel') ? ' · ' + val('f-tel') : ''), '', 'Merci !');

    var corps = lignes.join('\n');
    var sujet = 'Demande de devis Révéla · ' + (val('f-entreprise') || val('f-nom'));
    document.getElementById('f-apercu').value = corps;
    document.getElementById('b-mail').href = 'mailto:revela.motion@gmail.com?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);

    function montrer(id, titreId){
      var bloc = document.getElementById(id);
      bloc.hidden = false;
      bloc.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'nearest' });
      document.getElementById(titreId).focus({ preventScroll: true });
    }

    // Site en ligne : la demande part directement chez Révéla (Netlify Forms).
    if(document.documentElement.getAttribute('data-form') === 'netlify'){
      var bouton = form.querySelector('button[type=submit]');
      var libelle = bouton.textContent;
      bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
      document.getElementById('resultat').hidden = true;
      var donnees = new URLSearchParams(new FormData(form));
      donnees.delete('explications');
      donnees.set('explications', questions.join(', ') || 'Non précisé');
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: donnees.toString()
      }).then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), textarea, select').forEach(function(c){ c.value = ''; });
        bouton.textContent = 'Demande envoyée';
        montrer('envoye', 'envoye-titre');
      }).catch(function(){
        bouton.disabled = false; bouton.textContent = libelle;
        document.getElementById('resultat-titre').textContent = "L'envoi n'a pas fonctionné.";
        document.getElementById('resultat-texte').textContent = 'Votre demande est prête ci-dessous : copiez-la et envoyez-la à revela.motion@gmail.com, ou réessayez dans un instant.';
        montrer('resultat', 'resultat-titre');
      });
      return;
    }

    montrer('resultat', 'resultat-titre');
  });

  // Accueil animé au défilement : 1. le post figé défile, 2. le projecteur s'allume et l'écran devient une vidéo,
  // 3. le téléphone prend sa place et le titre apparaît. Les étapes suivent le défilement (variables CSS --a, --b, --c).
  var intro = document.querySelector('[data-intro]');
  if(intro && !reduit){
    var scene = intro.querySelector('.intro-scene'), tel = intro.querySelector('.intro-tel');
    var video = intro.querySelector('.intro-video'), entete = document.querySelector('.entete');
    var accroche = intro.querySelector('.intro-accroche'), texte = intro.querySelector('.hero-texte');
    var visibleIntro = true, cFin = 0, attente = false;
    intro.classList.add('intro-active');
    var seg = function(p, d, f){ return Math.min(1, Math.max(0, (p - d) / (f - d))); };
    var doux = function(t){ return t * t * (3 - 2 * t); };
    // le scintillement de l'allumage, repris de l'animation du projecteur
    var CLIGNE = [[0, 0], [.06, .55], [.1, .08], [.17, .8], [.23, .35], [.38, 1], [1, 1]];
    function cligne(t){
      for(var i = 1; i < CLIGNE.length; i++){
        if(t <= CLIGNE[i][0]){ var a = CLIGNE[i - 1], b = CLIGNE[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); }
      }
      return 1;
    }
    function mesurer(){
      var mobile = window.innerWidth < 900;
      intro.style.setProperty('--h-entete', entete.offsetHeight + 'px');
      intro.classList.add('mesure');
      var r = tel.getBoundingClientRect(), s = scene.getBoundingClientRect(), q = accroche.getBoundingClientRect();
      intro.classList.remove('mesure');
      // zone libre sous l'accroche pour le téléphone au départ
      var haut = q.bottom + 20, bas = s.bottom - 64;
      var s0 = Math.max(.5, Math.min(1.05, (bas - haut) / r.height));
      intro.style.setProperty('--s0', s0.toFixed(3));
      intro.style.setProperty('--s1', mobile ? '.88' : '1');
      intro.style.setProperty('--dx', Math.round(s.left + s.width / 2 - (r.left + r.width / 2)) + 'px');
      intro.style.setProperty('--dy', Math.round((haut + bas) / 2 - (r.top + r.height / 2)) + 'px');
    }
    function maj(){
      attente = false;
      var total = intro.offsetHeight - scene.offsetHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -intro.getBoundingClientRect().top / total)) : 1;
      var a = seg(p, 0, .3), b = seg(p, .3, .58), c = doux(seg(p, .58, .86));
      cFin = c;
      intro.style.setProperty('--a', a.toFixed(3));
      intro.style.setProperty('--b', b.toFixed(3));
      intro.style.setProperty('--c', c.toFixed(3));
      intro.style.setProperty('--flick', cligne(b).toFixed(3));
      if(video){
        if(b > .3 && visibleIntro && !document.hidden){ var pr = video.play(); if(pr && pr.catch) pr.catch(function(){}); }
        else {
          if(!video.paused) video.pause();
          if(b <= .3 && video.currentTime > 0) video.currentTime = 0;   // la gourde se redessine à chaque allumage
        }
      }
    }
    function demander(){ if(!attente){ attente = true; window.requestAnimationFrame(maj); } }
    mesurer(); maj();
    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', function(){ mesurer(); demander(); });
    document.addEventListener('visibilitychange', demander);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(e){ visibleIntro = e[0].isIntersecting; demander(); }).observe(scene);
    }
    // au clavier, le titre et les boutons doivent être visibles : on saute à la fin de l'animation
    texte.addEventListener('focusin', function(){
      if(cFin < 1) window.scrollTo({ top: intro.offsetTop + intro.offsetHeight - window.innerHeight, behavior: 'auto' });
    });
  }

  // Carrousels des réalisations : un anneau de 4 vidéos par client, qui tourne tout seul.
  // Seule la vidéo du centre joue son aperçu (muet, 6 s) ; la suivante arrive à la fin de la barre de progression.
  var lecteur = document.getElementById('lecteur-video');
  var carrousels = [];
  document.querySelectorAll('[data-carrousel]').forEach(function(box){
    var anneau = box.querySelector('.anneau');
    var cartes = Array.prototype.slice.call(anneau.children);
    var n = cartes.length, idx = 0;
    var num = box.querySelector('[data-num]'), annonce = box.querySelector('[data-annonce]');
    var barre = box.querySelector('.progression span');
    var bPause = box.querySelector('[data-pause]');
    var etat = { pause: false, survol: false, focus: false, visible: false };

    function arrete(){ return reduit || etat.pause || etat.survol || etat.focus || !etat.visible || document.hidden || (lecteur && lecteur.open); }
    function apercus(){
      cartes.forEach(function(c, i){
        var v = c.querySelector('video');
        if(!v) return;
        if(i === idx && !reduit && !etat.pause && etat.visible && !document.hidden && !(lecteur && lecteur.open)){
          v.muted = true;
          var p = v.play();
          if(p && p.catch) p.catch(function(){});
        } else if(!v.paused){ v.pause(); }
      });
    }
    function maj(){
      box.classList.toggle('arret', arrete());
      apercus();
    }
    function relancer(){
      if(reduit) return;
      box.classList.remove('joue');
      void barre.offsetWidth;            // relance l'animation de la barre
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
        box.classList.remove('decale');
        annonce.textContent = 'Vidéo ' + (idx + 1) + ' sur ' + n + ' : ' + cartes[idx].querySelector('.projet-titre').textContent;
      }
      relancer();
      maj();
    }

    barre.addEventListener('animationend', function(){ box.classList.remove('decale'); placer(idx + 1, false); });
    box.querySelector('[data-prec]').addEventListener('click', function(){ placer(idx - 1, true); });
    box.querySelector('[data-suiv]').addEventListener('click', function(){ placer(idx + 1, true); });
    bPause.addEventListener('click', function(){
      etat.pause = !etat.pause;
      bPause.setAttribute('aria-pressed', etat.pause ? 'true' : 'false');
      bPause.setAttribute('aria-label', etat.pause ? 'Reprendre le défilement' : 'Mettre en pause le défilement');
      maj();
    });
    // Pause pendant le survol à la souris et quand le clavier est dans le carrousel (pas après un simple toucher).
    box.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse'){ etat.survol = true; maj(); } });
    box.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse'){ etat.survol = false; maj(); } });
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

    // Glisser du doigt (ou de la souris) pour tourner ; un glissé n'ouvre pas la vidéo.
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
      if(lien && lecteur && document.documentElement.getAttribute('data-embed') === 'youtube'){
        e.preventDefault();
        ouvrirVideo(lien);
      }
    });

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(entrees){
        etat.visible = entrees[0].isIntersecting; maj();
      }, { threshold: .35 }).observe(box);
    } else { etat.visible = true; }
    carrousels.push(maj);
    placer(0, false);
  });
  document.addEventListener('visibilitychange', function(){ carrousels.forEach(function(f){ f(); }); });

  // Sur le site en ligne, la vidéo complète se charge depuis YouTube seulement au clic (mode confidentialité renforcée).
  var origine = null;
  function ouvrirVideo(a){
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.dataset.youtube) + '?autoplay=1&playsinline=1&rel=0';
    f.title = a.dataset.titre;
    f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    lecteur.querySelector('.lecteur-cadre').appendChild(f);
    document.getElementById('lecteur-titre').textContent = 'Vidéo « ' + a.dataset.titre + ' »';
    origine = a;
    lecteur.showModal();
    carrousels.forEach(function(m){ m(); });
  }
  if(lecteur){
    if(document.documentElement.getAttribute('data-embed') === 'youtube'){
      document.querySelectorAll('a[data-youtube]').forEach(function(a){
        a.setAttribute('aria-label', 'Lancer la vidéo « ' + a.dataset.titre + ' », chargée depuis YouTube');
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

  document.querySelectorAll('[data-formule]').forEach(function(a){
    a.addEventListener('click', function(){ document.getElementById('f-formule').value = a.dataset.formule; });
  });

  document.getElementById('b-copier-demande').addEventListener('click', function(){
    var zone = document.getElementById('f-apercu');
    copier(zone.value, this, zone, 'Message copié', 'Texte sélectionné');
  });
})();
