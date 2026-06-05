// ===== RESULTATS PAGE =====
const cv    = sessionStorage.getItem('cv')    || '';
const offre = sessionStorage.getItem('offre') || '';

// Si pas de données → retour analyse
if (!cv && !offre) { window.location.href = 'analyse.html'; }

// Animation loading steps
const loadSteps = ['ls1','ls2','ls3','ls4'];
let currentStep = 0;
const stepInterval = setInterval(() => {
  if (currentStep < loadSteps.length) {
    if (currentStep > 0) document.getElementById(loadSteps[currentStep-1]).classList.remove('active');
    document.getElementById(loadSteps[currentStep]).classList.add('active');
    currentStep++;
  } else { clearInterval(stepInterval); }
}, 4000);

// ===== Appel API =====
async function analyser() {
  try {
    const res  = await fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cv, offre })
    });

    // ← LIT LE JSON AVANT de vérifier res.ok
    const data = await res.json();

    // ← SI ERREUR SERVEUR : affiche le vrai message
    if (!res.ok) {
      throw new Error(data.error || 'Erreur serveur');
    }

    afficherResultats(data);

  } catch (err) {
    clearInterval(stepInterval);
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMsg').textContent = err.message;
  }
}

// ===== Afficher les résultats =====
function afficherResultats(data) {
  clearInterval(stepInterval);
  document.getElementById('loadingState').classList.add('hidden');

  // ← SI L'IA DIT QUE C'EST INVALIDE : afficher erreur directement
  if (data.erreur) {
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMsg').textContent = data.message || 'Données invalides.';
    return;
  }

  document.getElementById('resultsState').classList.remove('hidden');

  // Score
  const score = data.score || 0;
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('scoreComment').textContent = data.scoreComment || '';
  document.getElementById('scoreBar').style.width = score + '%';
  const circle = document.getElementById('scoreCircle');
  circle.style.background = score >= 70 ? 'linear-gradient(135deg,#3dbd8a,#2d6e52)'
                          : score >= 40 ? 'linear-gradient(135deg,#f39c12,#e67e22)'
                          : 'linear-gradient(135deg,#e74c3c,#c0392b)';

  // ← SI SCORE TRÈS BAS : afficher un message d'avertissement
  if (score <= 15) {
    document.getElementById('resultsState').innerHTML = `
      <div class="container">
        <div class="error-card" style="border-left: 4px solid #e74c3c;">
          <div class="error-icon">⚠️</div>
          <h3>Correspondance insuffisante</h3>
          <p style="color:#e74c3c;font-weight:600;">Score : ${score}/100</p>
          <p>${data.scoreComment}</p>
          ${data.missing && data.missing.length > 0 ? `
            <div style="margin-top:16px;">
              <strong>Ce que l'offre demande et que vous n'avez pas :</strong>
              <ul style="margin-top:8px;">
                ${data.missing.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>` : ''}
          <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
            <a href="analyse.html" class="btn-primary">🔄 Essayer avec une autre offre</a>
          </div>
        </div>
      </div>`;
    return;
  }

  // Match list
  const matchList = document.getElementById('matchList');
  if (!data.match || data.match.length === 0) {
    matchList.innerHTML = '<li style="color:#888;font-style:italic;">Aucune correspondance trouvée</li>';
  } else {
    data.match.forEach(item => { matchList.innerHTML += `<li>${item}</li>`; });
  }

  // Missing list
  const missingList = document.getElementById('missingList');
  if (!data.missing || data.missing.length === 0) {
    missingList.innerHTML = '<li style="color:#888;font-style:italic;">Aucun manque détecté</li>';
  } else {
    data.missing.forEach(item => { missingList.innerHTML += `<li>${item}</li>`; });
  }

  // Conseils
  const adviceList = document.getElementById('adviceList');
  if (!data.conseils || data.conseils.length === 0) {
    adviceList.innerHTML = '<p style="color:#888;">Aucun conseil disponible.</p>';
  } else {
    data.conseils.forEach(c => {
      adviceList.innerHTML += `
      <div class="advice-card">
        <div class="advice-title">🎯 ${c.competence}</div>
        <div class="advice-body">
          <p><strong>Conseil :</strong> ${c.conseil}</p>
          <div class="ressources">
            <strong>📚 Ressources :</strong>
            <ul>${(c.ressources||[]).map(r=>`<li><a href="${r.url}" target="_blank">${r.nom}</a></li>`).join('')}</ul>
          </div>
        </div>
      </div>`;
    });
  }

  // Démarche
  const demarcheList = document.getElementById('demarcheList');
  if (!data.demarche || data.demarche.length === 0) {
    demarcheList.innerHTML = '<p style="color:#888;">Aucune démarche disponible.</p>';
  } else {
    data.demarche.forEach((step, i) => {
      demarcheList.innerHTML += `
      <div class="step-v">
        <div class="step-num">${String(i+1).padStart(2,'0')}</div>
        <div class="step-body"><h3>${step.titre}</h3><p>${step.description}</p></div>
      </div>`;
    });
  }

  // Bouton régénérer
  document.getElementById('btnRegen').addEventListener('click', () => {
    sessionStorage.setItem('analyse', JSON.stringify(data));
    window.location.href = 'regenerer.html';
  });
}

analyser();