const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');

// Stockage temporaire des OTPs (en mémoire)
const otpStore = {};

// Transporter Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Générer un code OTP 4 chiffres
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ── ENVOYER OTP ──
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' });
  }

  const otp     = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000; // expire dans 10 minutes

  // Sauvegarder OTP
  otpStore[email] = { otp, expires };

  // Envoyer email
  try {
    await transporter.sendMail({
      from    : `"Kivu Job IA" <${process.env.EMAIL_USER}>`,
      to      : email,
      subject : `Votre code de vérification : ${otp}`,
      html    : `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <h2 style="color:#1a1a2e;margin:0;">💼 Kivu Job IA</h2>
          </div>
          <div style="background:#fff;border-radius:10px;padding:28px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <p style="color:#444;font-size:15px;margin-bottom:20px;">Votre code de vérification est :</p>
            <div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#3dbd8a;margin:16px 0;">
              ${otp}
            </div>
            <p style="color:#888;font-size:13px;margin-top:20px;">Ce code expire dans <strong>10 minutes</strong>.</p>
            <p style="color:#888;font-size:12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
          </div>
          <p style="text-align:center;color:#bbb;font-size:11px;margin-top:20px;">© 2025 Kivu Job IA</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Code envoyé !' });

  } catch (error) {
    console.error('Erreur envoi email:', error.message);
    res.status(500).json({ error: "Erreur d'envoi d'email. Vérifiez votre configuration." });
  }
});

// ── VÉRIFIER OTP ──
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email et code requis.' });
  }

  const stored = otpStore[email];

  if (!stored) {
    return res.status(400).json({ error: 'Aucun code envoyé à cet email.' });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[email];
    return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' });
  }

  if (stored.otp !== otp.toString()) {
    return res.status(400).json({ error: 'Code incorrect. Réessayez.' });
  }

  // Code correct — supprimer de la mémoire
  delete otpStore[email];
  res.json({ success: true, message: 'Email vérifié !' });
});

module.exports = router;