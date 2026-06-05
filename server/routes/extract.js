const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const mammoth  = require('mammoth');

const upload = multer({ storage: multer.memoryStorage() });

// read  PDF whith pdfjs-dist
async function readPDF(buffer) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(buffer);
    const doc  = await pdfjsLib.getDocument({ data }).promise;
    let text   = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page    = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text.trim();
  } catch (e) {
    throw new Error('Impossible de lire le PDF : ' + e.message);
  }
}

router.post('/extract', upload.fields([
  { name: 'cvFile',    maxCount: 1 },
  { name: 'offreFile', maxCount: 1 }
]), async (req, res) => {
  try {
    let cvText    = req.body.cvText    || '';
    let offreText = req.body.offreText || '';

    // CV
    if (req.files?.cvFile) {
      const file = req.files.cvFile[0];
      if (file.mimetype === 'application/pdf') {
        cvText = await readPDF(file.buffer);
      } else if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ 
          buffer: file.buffer });
        cvText = result.value;
      } else {
        cvText = `[Image: ${file.originalname}] — Veuillez coller le texte de votre CV`;
      }
    }

    // Offre
    if (req.files?.offreFile) {
      const file = req.files.offreFile[0];
      if (file.mimetype === 'application/pdf') {
        offreText = await readPDF(file.buffer);
      } else if (file.mimetype.includes('word') || file.originalname.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        offreText = result.value;
      } else {
        offreText = `[Image: ${file.originalname}]`;
      }
    }

    if (!cvText)    return res.status(400).json({ error: 'Impossible de lire le CV.' });
    if (!offreText) return res.status(400).json({ error: "Impossible de lire l'offre." });

    console.log('✅ CV extrait:', cvText.substring(0, 100) + '...');
    res.json({ cvText, offreText });

  } catch (err) {
    console.error('Erreur extraction:', err.message);
    res.status(500).json({ error: 'Erreur lors de la lecture du fichier.' });
  }
});

module.exports = router;