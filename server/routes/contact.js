const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/contact', async (req, res) => {
  try {
    const {
         email, phone, subject, message 
        } = req.body;

    if (!email || !message) {
      return res.status(400).json({
         error: 'Email et message requis.' });
    }

    await transporter.sendMail({
      from: `"Kivu Job IA" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Kivu Job IA] ${subject || 'Nouveau message'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#3dbd8a;">Nouveau message — Kivu Job IA</h2>
          <hr style="border-color:#eee"/>
          <p><strong>De :</strong> ${email}</p>
          <p><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</p>
          <p><strong>Sujet :</strong> ${subject || 'Non renseigné'}</p>
          <hr style="border-color:#eee"/>
          <p><strong>Message :</strong></p>
          <p style="background:#f5f5f2;padding:1rem;border-radius:8px;">${message.replace(/\n/g,'<br>')}</p>
          <hr style="border-color:#eee"/>
          <p style="color:#888;font-size:12px;">Envoyé depuis kivujobia </p>
        </div>
      `
    });

    res.json({ 
        success: true, message: 'Message envoyé avec succès !' });

  } catch (error) {
    console.error('Erreur email:', error.message);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

module.exports = router;