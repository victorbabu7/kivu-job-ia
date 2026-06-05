// ===== NAVIGATION ENTRE ÉTAPES =====
function goStep(n) {
  document.querySelectorAll('.regen-step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step' + n).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== PRÉ-REMPLIR AVEC LES DONNÉES DU CV =====
const cv      = sessionStorage.getItem('cv')    || '';
const offre   = sessionStorage.getItem('offre') || '';
const analyse = JSON.parse(sessionStorage.getItem('analyse') || '{}');

function extract(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1] || m[0];
  }
  return '';
}

if (cv && cv !== 'fichier uploadé') {
  document.getElementById('i-email').value = extract(cv, [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i]) || '';
  document.getElementById('i-tel').value   = extract(cv, [/(\+?\d[\d\s\-()]{7,})/]) || '';
}

// ===== BUILDERS HTML =====
function buildExperiences(list) {
  return (list || []).map(e => `
    <div class="item">
      <div class="item-header">
        <span class="item-title">${e.poste || ''}</span>
        <span class="item-date">${e.periode || ''}</span>
      </div>
      <div class="item-sub">${e.entreprise || ''}</div>
      <div class="item-desc"><ul>${(e.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul></div>
    </div>`).join('');
}

function buildFormations(list) {
  return (list || []).map(f => `
    <div class="item">
      <div class="item-header">
        <span class="item-title">${f.diplome || ''}</span>
        <span class="item-date">${f.annee || ''}</span>
      </div>
      <div class="item-sub">${f.etablissement || ''}${f.mention ? ' — ' + f.mention : ''}</div>
    </div>`).join('');
}

function buildCompetences(list, template) {
  if (template === 'minimaliste') {
    return (list || []).map(c =>
      `<span class="skill-tag">${c.nom}</span>`
    ).join('');
  }
  return (list || []).map(c => `
    <div class="skill-item">
      <div class="skill-name">${c.nom}</div>
      <div class="skill-bar"><div class="skill-fill" style="width:${c.niveau || 80}%"></div></div>
    </div>`).join('');
}

function buildLangues(list, template) {
  if (template === 'minimaliste') {
    return (list || []).map(l => `
      <div class="lang-item">
        <div>${l.langue}</div>
        <div class="lang-level">${l.niveau}</div>
      </div>`).join('');
  }
  return (list || []).map(l => `
    <div class="lang-item">
      <strong>${l.langue}</strong>
      <span class="lang-level">${l.niveau}</span>
    </div>`).join('');
}

function buildCertifications(list) {
  if (!list || list.length === 0) return '';
  return `<ul>${list.map(c => `<li style="font-size:11.5px;margin-bottom:3px;">${c}</li>`).join('')}</ul>`;
}

// ===== RÉSOUDRE LES BLOCS {{#if}} =====
function resolveIf(html, data) {
  return html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const val = data[key.toLowerCase()] || data[key];
    if (!val || (Array.isArray(val) && val.length === 0)) return '';
    return content;
  });
}

// ===== INJECTER DONNÉES DANS LE TEMPLATE =====
function injectData(html, data, template) {
  const linkedin  = data.linkedin || '';
  const certifs   = buildCertifications(data.certifications);
  const interets  = data.interets || '';
  const resumePro = data.resume   || '';

  // Résoudre les blocs conditionnels AVANT les remplacements
  const templateData = {
    LINKEDIN:      linkedin,
    CERTIFICATIONS: certifs,
    INTERETS:      interets,
    RESUME_PRO:    resumePro
  };
  html = resolveIf(html, templateData);

  // Remplacer les variables simples
  html = html.replace(/\{\{NOM_COMPLET\}\}/g,  data.nom          || '');
  html = html.replace(/\{\{TITRE_POSTE\}\}/g,  data.titre        || '');
  html = html.replace(/\{\{EMAIL\}\}/g,         data.email        || '');
  html = html.replace(/\{\{TELEPHONE\}\}/g,     data.telephone    || '');
  html = html.replace(/\{\{LOCALISATION\}\}/g,  data.localisation || '');
  html = html.replace(/\{\{LINKEDIN\}\}/g,      linkedin);
  html = html.replace(/\{\{RESUME_PRO\}\}/g,    resumePro);
  html = html.replace(/\{\{PHOTO_URL\}\}/g,     data.photoUrl     || '');
  html = html.replace(/\{\{PHOTO_CLASS\}\}/g,   data.photoUrl ? '' : 'no-photo');
  html = html.replace(/\{\{TITLE_CLASS\}\}/g,   data.titre        ? '' : 'no-title');

  // Remplacer les blocs de contenu
  html = html.replace(/\{\{EXPERIENCES\}\}/g,    buildExperiences(data.experiences));
  html = html.replace(/\{\{FORMATIONS\}\}/g,     buildFormations(data.formations));
  html = html.replace(/\{\{COMPETENCES\}\}/g,    buildCompetences(data.competences, template));
  html = html.replace(/\{\{LANGUES\}\}/g,        buildLangues(data.langues, template));
  html = html.replace(/\{\{CERTIFICATIONS\}\}/g, certifs);
  html = html.replace(/\{\{INTERETS\}\}/g,       interets);

  // Nettoyer les éventuels restes de tags handlebars
  html = html.replace(/\{\{#if [^}]+\}\}/g, '').replace(/\{\{\/if\}\}/g, '');

  return html;
}

// ===== AFFICHER LE RÉSULTAT =====
async function afficherResultat(data, template) {
  goStep(4);

  const preview = document.getElementById('cvPreview');
  preview.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Chargement du CV…</div>';

  try {
    // Charger le template HTML via fetch (pas d'iframe onload)
    const res = await fetch(`assets/templates/template-${template}.html`);
    if (!res.ok) throw new Error(`Template introuvable : template-${template}.html`);
    const templateHTML = await res.text();

    // Injecter les données
    const filledHTML = injectData(templateHTML, data, template);

    // Afficher dans un iframe via srcdoc (méthode fiable)
    const iframe = document.createElement('iframe');
    iframe.style.width  = '100%';
    iframe.style.height = '900px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    iframe.srcdoc = filledHTML;

    preview.innerHTML = '';
    preview.appendChild(iframe);

  } catch (err) {
    preview.innerHTML = `<div style="color:red;padding:20px;">Erreur d'affichage : ${err.message}</div>`;
    console.error('Erreur affichage CV:', err);
  }
}

// ===== GÉNÉRER LE CV =====
async function genererCV() {
  const sections = [...document.querySelectorAll('input[name="section"]:checked')].map(i => i.value);
  const langue   = document.querySelector('input[name="cvlang"]:checked')?.value   || 'fr';
  const template = document.querySelector('input[name="template"]:checked')?.value || 'classique';

  const data = {
    nom:         document.getElementById('i-nom').value.trim(),
    titre:       document.getElementById('i-titre').value.trim(),
    email:       document.getElementById('i-email').value.trim(),
    tel:         document.getElementById('i-tel').value.trim(),
    ville:       document.getElementById('i-ville').value.trim(),
    linkedin:    document.getElementById('i-linkedin').value.trim(),
    profil:      document.getElementById('i-profil').value.trim(),
    suggestions: document.getElementById('i-suggestions').value.trim(),
    sections, langue, template,
    cvText:    cv,
    offreText: offre,
    analyse
  };

  // Afficher loader
  document.getElementById('genText').classList.add('hidden');
  document.getElementById('genLoader').classList.remove('hidden');
  document.getElementById('btnGenerer').disabled = true;

  try {
    const res = await fetch('https://kivu-job-ia.onrender.com/api/regenerate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erreur serveur');

    sessionStorage.setItem('cvGenere',       JSON.stringify(result));
    sessionStorage.setItem('templateChoisi', template);
    await afficherResultat(result, template);

  } catch (err) {
    alert('Erreur : ' + err.message);
  } finally {
    document.getElementById('genText').classList.remove('hidden');
    document.getElementById('genLoader').classList.add('hidden');
    document.getElementById('btnGenerer').disabled = false;
  }
}

// ===== TÉLÉCHARGER PDF =====
function telechargerPDF() {
  const iframe = document.querySelector('#cvPreview iframe');
  if (!iframe) return;
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

// ===== TÉLÉCHARGER DOCX =====
async function telechargerDOCX() {
  const data = JSON.parse(sessionStorage.getItem('cvGenere') || '{}');
  try {
    const res  = await fetch('https://kivu-job-ia.onrender.com/api/export-docx', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'cv-kivu-job-ia.docx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Erreur téléchargement DOCX : ' + err.message);
  }
}