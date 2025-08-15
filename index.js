import { GoogleGenerativeAI } from '@google/generative-ai';
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core'); // Remplacement de puppeteer par puppeteer-core
require('dotenv').config();

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

    // Création du client WhatsApp en utilisant ce navigateur
    const client = new Client({
        puppeteer: browser
    });

    // QR Code pour la première connexion
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    // Quand prêt
    client.once('ready', () => {
        console.log('✅ Client WhatsApp prêt !');
    });

    // Réponses automatiques
    client.on('message_create', async message => {
        if (message.body.toString().toLowerCase().startsWith('ping,')) {
            const result = await model.generateContent(message.body);
            console.log("Réponse IA:", result.response.text());
            client.sendMessage(message.from, result.response.text());
        }
    });

    await client.initialize();
}

// Démarrage
createClient().catch(err => {
    console.error("Erreur au démarrage :", err);
});

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
