const express = require('express');
const cors = require('cors');
const app = express();
const https = require('https');
const fs = require('fs');

require('dotenv').config();

app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());


const httpsServer = https.createServer({
  key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/privkey.pem`),
  cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.DOMAIN}/fullchain.pem`),
}, app);


httpsServer.listen(process.env.PORT, () => {
 console.log(`HTTPS Server running on port ${process.env.PORT}`);
});