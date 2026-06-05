require('dotenv').config();
const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');

// ===== FALLBACK : OpenRouter → Groq → Gemini =====
async function callAI(prompt) {
  // 1. OpenRouter
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Kivu Job IA'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.choices?.[0]) {
      console.log('✅ API utilisée: OpenRouter');
      return data.choices[0].message.content;
    }
  } catch (e) {
    console.log('❌ OpenRouter échoué:', e.message); }

  // 2. Groq
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    if (data.choices?.[0]) {
      console.log('✅ API utilisée: Groq');
      return data.choices[0].message.content;
    }
  } catch (e) { console.log('❌ Groq échoué:', e.message); }

  // 3. Gemini
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    console.log('✅ API utilisée: Gemini');
    return result.response.text();
  } catch (e) { console.log('❌ Gemini échoué:', e.message); }

  throw new Error('Toutes les APIs ont échoué');
}

// ===== ROUTE =====
router.post('/analyze', async (req, res) => {
  try {
    console.log('BODY RECU:', req.body);
    const cvText    = req.body.cvText    || req.body.cv;
    const offreText = req.body.offreText || req.body.offre;

    if (!cvText || !offreText) {
      return res.status(400).json({ error: 'CV et offre requis.' });
    }

 const prompt = `Tu es un expert RH senior strict et honnête.

═══════════════════════════
CV DU CANDIDAT :
═══════════════════════════
${cvText}

═══════════════════════════
OFFRE D'EMPLOI :
═══════════════════════════
${offreText}

═══════════════════════════
AVANT DE RÉPONDRE — FAIS CES VÉRIFICATIONS :
═══════════════════════════

VÉRIFICATION 1 — LE CV EST-IL VALIDE ?
Pose-toi ces questions :
- Est-ce que ce texte ressemble à un vrai CV ? (nom, expériences, compétences, formation...)
- Ou est-ce du texte aléatoire, une blague, du charabia, une histoire, autre chose ?

Si ce n'est PAS un vrai CV → retourne immédiatement :
{
  "erreur": "CV invalide",
  "message": "Le texte fourni ne semble pas être un CV. Veuillez soumettre un vrai CV avec vos expériences et compétences."
}

VÉRIFICATION 2 — L'OFFRE EST-ELLE VALIDE ?
- Est-ce que ce texte ressemble à une vraie offre d'emploi ? (poste, missions, compétences requises...)
- Ou est-ce du texte aléatoire, une blague, du charabia ?

Si ce n'est PAS une vraie offre → retourne immédiatement :
{
  "erreur": "Offre invalide",
  "message": "Le texte fourni ne semble pas être une offre d'emploi. Veuillez soumettre une vraie offre avec le poste et les compétences requises."
}

VÉRIFICATION 3 — Y A-T-IL UN VRAI LIEN ?
Compare le domaine du CV avec le domaine de l'offre.
- CV comptable + offre cuisinier → aucun lien réel
- CV développeur + offre médecin → aucun lien réel
- CV étudiant sans expérience + offre directeur 10 ans exp → lien très faible

RÈGLE ABSOLUE : Tu ne peux mettre quelque chose dans "match" QUE SI :
✅ Ce mot ou cette compétence apparaît EXPLICITEMENT dans le CV
✅ ET cette même compétence est demandée EXPLICITEMENT dans l'offre
❌ Si tu n'es pas sûr à 100% → ne le mets PAS dans match

═══════════════════════════
BARÈME DE SCORE STRICT :
═══════════════════════════
- 0  à 15  → Texte invalide ou domaines complètement différents. "match" = []
- 16 à 30  → Un ou deux points très vagues en commun. Profil inadapté.
- 31 à 50  → Quelques compétences communes mais manques critiques.
- 51 à 70  → Correspondance partielle. Compétences clés manquantes.
- 71 à 85  → Bon profil. Quelques points secondaires à améliorer.
- 86 à 100 → Excellent match. Profil quasi parfait pour ce poste.

═══════════════════════════
RÈGLES FINALES :
═══════════════════════════
1. Si "match" est vide → score maximum 15.
2. Si moins de 2 vrais points communs → score maximum 30.
3. Ne JAMAIS inventer un match qui n'existe pas dans les deux textes.
4. Ne JAMAIS adoucir un mauvais résultat.
5. Sois direct et honnête même si c'est décourageant.
6. Adresse-toi au candidat avec "vous".
7. Ressources uniquement : coursera.org, udemy.com, openclassrooms.com, youtube.com, docs officielles.

═══════════════════════════
FORMAT DE RÉPONSE :
═══════════════════════════
Réponds UNIQUEMENT avec ce JSON valide, sans texte avant ou après, sans markdown :

{
  "score": <0 à 100>,
  "scoreComment": "<explication honnête — si domaines différents, dis-le clairement>",
  "match": [],
  "missing": ["<ce que l'offre demande et qui est absent du CV>"],
  "conseils": [
    {
      "competence": "<compétence manquante>",
      "conseil": "<conseil honnête — si reconversion nécessaire, le dire>",
      "ressources": [
        {"nom": "<nom>", "url": "<url réelle>"}
      ]
    }
  ],
  "demarche": [
    {"titre": "<titre>", "description": "<étape réaliste>"}
  ]
}`;

    const text      = await callAI(prompt);
    const cleaned   = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA invalide');
    const analyseData = JSON.parse(jsonMatch[0]);

    if (analyseData.erreur) {
  return res.status(400).json({
    error: analyseData.message
  });
}

if (analyseData.score > 15 && (!analyseData.match || analyseData.match.length === 0)) {
  analyseData.score = 15;
  analyseData.scoreComment = analyseData.scoreComment + " (score ajusté : aucune correspondance réelle trouvée)";
}

    await db.collection('analyses').add({
      cvText, offreText, analyse: analyseData, createdAt: new Date()
    });

    res.json({ success: true, ...analyseData });

  } catch (error) {
    console.error('Erreur analyse:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'analyse.' });
  }
});

module.exports = router;