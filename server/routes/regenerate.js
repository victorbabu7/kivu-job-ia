require('dotenv').config();
const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');


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
  } catch (e) { console.log('❌ OpenRouter échoué:', e.message); }

  
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
router.post('/regenerate', async (req, res) => {
  try {
    const { cvText, offreText, suggestions } = req.body;

    if (!cvText) {
      return res.status(400).json({ error: 'CV requis.' });
    }

    const prompt = `
Tu es un expert en rédaction de CV professionnel.

CV original :
${cvText}

${offreText ? `Offre d'emploi ciblée :\n${offreText}` : ''}

${suggestions ? `Informations supplémentaires ajoutées par le candidat :\n${suggestions}` : ''}

RÈGLES IMPORTANTES :
- Utilisez toujours "vous" pour vous adresser au candidat
- Réorganisez le CV dans cet ordre : Informations personnelles → Résumé professionnel → Expériences (du plus récent au plus ancien) → Formation → Compétences → Langues → Certifications → Centres d'intérêt
- Mettez en avant les compétences qui correspondent à l'offre d'emploi
- Utilisez des verbes d'action forts (développé, géré, créé, optimisé...)
- Soyez précis et concis — maximum 2 pages
- Si des informations manquent, indiquez-les avec le tag [À COMPLÉTER]

Réponds UNIQUEMENT en JSON valide sans markdown avec cette structure exacte :
{
  "nom": "Nom complet",
  "titre": "Titre du poste visé",
  "email": "email@example.com",
  "telephone": "numéro",
  "localisation": "Ville, Pays",
  "linkedin": "url linkedin ou vide",
  "resume": "Résumé professionnel percutant en 3 phrases",
  "experiences": [
    {
      "poste": "Titre du poste",
      "entreprise": "Nom de l'entreprise",
      "periode": "Jan 2022 - Déc 2023",
      "description": "Description des missions",
      "bullets": ["Réalisation 1", "Réalisation 2"]
    }
  ],
  "formations": [
    {
      "diplome": "Nom du diplôme",
      "etablissement": "Nom de l'établissement",
      "annee": "2020",
      "mention": "Mention si applicable"
    }
  ],
  "competences": [
    { "nom": "Compétence", "niveau": 85 }
  ],
  "langues": [
    { "langue": "Français", "niveau": "Natif" }
  ],
  "certifications": ["Certification 1"],
  "interets": "Centres d'intérêt séparés par des virgules",
  "infos_manquantes": ["Info manquante 1"]
}`;

    const text      = await callAI(prompt);
    const cleaned   = text.replace(/```json|```/g, '').trim();
    const sanitized = cleaned
  .replace(/[\x00-\x1F\x7F]/g, ' ')  // supprimer caractères de contrôle
  .replace(/,\s*([}\]])/g, '$1')       // supprimer virgules en trop
  .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // ajouter guillemets manquants
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Réponse IA invalide');
    const cvData = JSON.parse(jsonMatch[0]);

    await db.collection('cvs_regeneres').add({
      cvOriginal: cvText,
      offreText : offreText || '',
      cvData,
      createdAt : new Date(),
    });

    res.json({ success: true, ...cvData });

  } catch (error) {
    console.error('Erreur régénération:', error.message);
    res.status(500).json({ error: 'Erreur lors de la régénération du CV.' });
  }
});

module.exports = router;