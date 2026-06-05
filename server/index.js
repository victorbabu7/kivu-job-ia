require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const analyzeRoute    = require('./routes/analyze');
const otpRoute        = require('./routes/otp');
const regenerateRoute = require('./routes/regenerate');
const extractRoute = require('./routes/extract');
const contactRoute = require('./routes/contact');



// 1. D'abord, on initialise 'app'
const app  = express();
const PORT = process.env.PORT || 3000;

// 2. Ensuite, on applique les middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));


// 3. Enfin, on peut utiliser toutes les routes de l'API sans erreur !
app.use('/api', otpRoute);
app.use('/api', analyzeRoute);
app.use('/api', regenerateRoute);
app.use('/api', extractRoute);
app.use('/api', contactRoute);

// 4. On lance le serveur
app.listen(PORT, () => {
  console.log(`✅ Server dane  on http://localhost:${PORT}`);
});