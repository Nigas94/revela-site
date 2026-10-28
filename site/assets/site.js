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
    ['f-contact', 'Indiquez un e-mail ou un téléphone pour que nous puissions vous répondre.']
  ];
  function val(id){ return document.getElementById(id).value.trim(); }

  obligatoires.forEach(function(o){
    document.getElementById(o[0]).addEventListener('input', function(){
      var err = document.getElementById(o[0] + '-err');
      if(this.value.trim()){ this.setAttribute('aria-invalid', 'false'); err.hidden = true; }
    });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var premier = null;
    obligatoires.forEach(function(o){
      var el = document.getElementById(o[0]), err = document.getElementById(o[0] + '-err');
      var vide = !el.value.trim();
      el.setAttribute('aria-invalid', vide ? 'true' : 'false');
      el.setAttribute('aria-describedby', o[0] + '-err');
      err.textContent = vide ? o[1] : '';
      err.hidden = !vide;
      if(vide && !premier) premier = el;
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
    lignes.push('', 'Me répondre : ' + val('f-contact'), '', 'Merci !');

    var corps = lignes.join('\n');
    var sujet = 'Demande de devis Révéla · ' + (val('f-entreprise') || val('f-nom'));
    document.getElementById('f-apercu').value = corps;
    document.getElementById('b-mail').href = 'mailto:revela.motion@gmail.com?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);

    var res = document.getElementById('resultat');
    res.hidden = false;
    res.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'nearest' });
    document.getElementById('resultat-titre').focus({ preventScroll: true });
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
