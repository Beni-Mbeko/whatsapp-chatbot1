import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Initialisation Google Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// Lancement du navigateur distant Browserless
async function createClient() {
  console.log("Connexion au navigateur distant...");
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
  });

  const client = new Client({
    puppeteer: browser
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.once('ready', () => {
    console.log('✅ Client WhatsApp prêt !');
  });

  client.on('message_create', async message => {
    if (message.body.toString().toLowerCase().startsWith('ping,')) {
      const result = await model.generateContent(message.body);
      const reply = result.response.text();
      console.log("Réponse IA:", reply);
      client.sendMessage(message.from, reply);
    }
  });

  await client.initialize();
}

// Démarrage
createClient().catch(err => {
  console.error("Erreur au démarrage :", err);
});

// Serveur Express pour Render
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000, () => {
  console.log(`Serveur lancé sur le port ${process.env.PORT || 3000}`);
});
