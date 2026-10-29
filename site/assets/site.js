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

  // Vidéos YouTube : sur le site en ligne, elles se chargent seulement au clic (mode confidentialité renforcée).
  if(document.documentElement.getAttribute('data-embed') === 'youtube'){
    document.querySelectorAll('a[data-youtube]').forEach(function(a){
      a.setAttribute('aria-label', 'Lancer la vidéo « ' + a.dataset.titre + ' », chargée depuis YouTube');
      a.addEventListener('click', function(e){
        e.preventDefault();
        var f = document.createElement('iframe');
        f.className = 'ecran ecran-lecteur';
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.dataset.youtube) + '?autoplay=1&playsinline=1&rel=0';
        f.title = a.dataset.titre;
        f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
        f.setAttribute('allowfullscreen', '');
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        a.replaceWith(f);
        f.focus();
      });
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
