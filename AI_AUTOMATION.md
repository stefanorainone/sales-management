# 🤖 AI Automation System - Sales CRM

Sistema di automazione intelligente per la generazione automatica di task giornalieri e ricerca di nuovi potenziali clienti.

## 📋 Panoramica

L'AI analizza **tutto il database centralizzato** (deals, clienti, attività, note) per:
1. ✅ Generare task personalizzati per ogni venditore (oggi e domani)
2. 🔍 Ricercare nuovi potenziali clienti e creare task di contatto
3. 📊 Ottimizzare il lavoro del team basandosi su pattern e priorità

## 🗄️ Database Centralizzato

Il sistema usa **Firestore** con le seguenti collezioni:

### Collections
- `users` - Tutti gli utenti (admin, team_leader, seller)
- `deals` - Tutti i deals di tutti i venditori
- `clients` - Tutti i clienti (inclusi prospects generati dall'AI)
- `tasks` - Task giornalieri generati dall'AI per ogni venditore
- `activities` - Storico di tutte le attività (chiamate, email, meeting, ecc.)

### Permessi
- **Admin**: Accesso completo a tutto il database
- **Venditori**: Vedono solo i propri deals/clienti/tasks
- **AI System**: Accesso in lettura a tutto, scrittura su tasks/clients/deals

## 🚀 API Endpoints

### 1. Generazione Task Giornalieri
```
POST /api/ai/generate-daily-tasks
Authorization: Bearer <admin-token>
```

**Cosa fa:**
- Raccoglie tutti i deals, clienti e attività dal database
- Per ogni venditore:
  - Analizza i suoi deals attivi, priorità, probabilità
  - Analizza le attività recenti e i task già programmati
  - Genera 3-5 task per oggi e 2-3 per domani
  - Salva i task nel database

**Response:**
```json
{
  "success": true,
  "summary": {
    "sellersProcessed": 4,
    "tasksGenerated": 18,
    "timestamp": "2025-10-17T06:00:00.000Z"
  },
  "tasks": [...]
}
```

### 2. Ricerca Prospect
```
POST /api/ai/research-prospects
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "targetSectors": ["scuola", "hotel", "museo_privato", "comune"],
  "targetRegions": ["Toscana", "Lazio", "Campania", "Lombardia"],
  "numberOfProspects": 5,
  "assignToSellerId": null  // Opzionale, altrimenti distribuisce round-robin
}
```

**Cosa fa:**
- Analizza i clienti esistenti per capire il pattern di successo
- Genera prospect realistici basati su:
  - Settori target
  - Regioni geografiche
  - Analisi dei deals di successo
- Per ogni prospect:
  - Crea record cliente (status: 'prospect')
  - Crea deal prospect
  - Crea task di primo contatto per il venditore assegnato
  - Salva tutto nel database

**Response:**
```json
{
  "success": true,
  "summary": {
    "prospectsCreated": 5,
    "tasksCreated": 5,
    "timestamp": "2025-10-17T10:00:00.000Z"
  },
  "prospects": [...],
  "tasks": [...]
}
```

### 3. Database Overview (Admin)
```
GET /api/admin/database
Authorization: Bearer <admin-token>
```

**Cosa fa:**
- Ritorna una vista completa del database
- Include statistiche aggregate
- Attività per venditore

## ⏰ Automazione (Cron Jobs)

### Endpoint Cron
```
GET/POST /api/cron/daily-automation
Authorization: Bearer <CRON_SECRET>
```

**Cosa fa (automaticamente ogni giorno):**
1. Genera task giornalieri per tutti i venditori
2. Ricerca nuovi prospect (solo lunedì e giovedì)
3. Salva tutto nel database centralizzato

### Configurazione Cloud Scheduler (Google Cloud)

I cron jobs sono configurati con **Google Cloud Scheduler** per chiamare l'endpoint su Cloud Run:

```bash
# Crea job Cloud Scheduler
gcloud scheduler jobs create http daily-automation \
  --schedule="0 6 * * *" \
  --uri="https://sales-crm-412055180465.europe-west1.run.app/api/cron/daily-automation" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_CRON_SECRET" \
  --location=europe-west1
```

**Schedule**: Ogni giorno alle 6:00 AM (UTC)

### Environment Variables Required
```bash
# .env.local o Cloud Run Environment Variables
CRON_SECRET=your-super-secret-cron-key-here

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Claude AI
ANTHROPIC_API_KEY=your-claude-api-key
```

### Configurazione Alternativa (Self-Hosted)

Puoi anche configurare un cron job esterno alternativo che chiama l'endpoint:

#### Opzione 1: cron-job.org (Free)
1. Vai su https://cron-job.org
2. Crea un nuovo job:
   - URL: `https://your-domain.com/api/cron/daily-automation`
   - Schedule: `0 6 * * *` (ogni giorno alle 6 AM)
   - HTTP Method: `POST`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

#### Opzione 2: GitHub Actions
Crea `.github/workflows/daily-automation.yml`:

```yaml
name: Daily AI Automation

on:
  schedule:
    - cron: '0 6 * * *'  # Every day at 6 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  run-automation:
    runs-on: ubuntu-latest
    steps:
      - name: Call automation endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/daily-automation \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Opzione 3: Node-cron (Self-Hosted)
Se self-hosted, puoi usare node-cron:

```bash
npm install node-cron
```

Crea `scripts/cron.js`:
```javascript
const cron = require('node-cron');

// Ogni giorno alle 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily automation...');

  const response = await fetch('http://localhost:3000/api/cron/daily-automation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });

  const result = await response.json();
  console.log('Automation result:', result);
});

console.log('Cron job started. Waiting for schedule...');
```

Esegui: `node scripts/cron.js`

## 📊 Admin Dashboard

L'admin può controllare il sistema da `/admin/dashboard`:

### AI Automation Center
- **Genera Task Giornalieri**: Esegui manualmente la generazione task
- **Ricerca Prospect**: Esegui manualmente la ricerca prospect
- Visualizza timestamp ultima esecuzione

### Come Usare
1. Login come admin
2. Vai su `/admin/dashboard`
3. Sezione "🤖 AI Automation Center"
4. Clicca sui pulsanti per eseguire le operazioni

## 🎯 Task Generati dall'AI

Ogni task contiene:
- `type`: call, email, meeting, demo, follow_up, research
- `title`: Titolo specifico con nome cliente
- `description`: Descrizione dettagliata dell'azione
- `aiRationale`: Perché questo task è importante
- `priority`: critical, high, medium, low
- `scheduledAt`: Data/ora pianificata
- `objectives`: Array di obiettivi da raggiungere
- `confidence`: Probabilità di successo (0-100)
- `impactScore`: Impatto sul revenue (0-100)
- `relatedEntity`: Link a deal o cliente
- `userId`: Venditore assegnato
- `createdBy`: 'ai_daily_generation' o 'ai_cron_daily'

## 🔍 Prospect Generati dall'AI

Ogni prospect contiene:
- Cliente record (status: 'prospect')
- Deal prospect (stage: 'prospect')
- Task di primo contatto per il venditore
- Score di priorità basato su potenziale
- Suggerimento di approccio per il contatto
- Motivazione AI (perché è un buon prospect)

## 📝 Logica AI

### Generazione Task
L'AI analizza:
1. **Deals attivi**: Stage, probabilità, priorità, note
2. **Attività recenti**: Outcome, pattern, frequenza
3. **Task esistenti**: Per evitare duplicati
4. **Timeline**: Urgenze e scadenze

Genera task che:
- Danno priorità a deals HOT (>80% probabilità)
- Suggeriscono follow-up su deals in stallo
- Preparano meeting schedulati
- Ricercano nuovi prospect nel settore target

### Ricerca Prospect
L'AI analizza:
1. **Pattern di successo**: Clienti che hanno convertito bene
2. **Settori target**: Scuole, hotel, musei, comuni
3. **Regioni geografiche**: Focus su aree turistiche/strategiche
4. **Deal value**: Potenziale revenue

Genera prospect che:
- Sono realistici (nomi italiani credibili)
- Hanno alto potenziale (città turistiche, istituzioni grandi)
- Sono adatti al business model VR/XR
- Includono strategia di approccio

## 🛠️ Troubleshooting

### Cron job non parte
1. Verifica `CRON_SECRET` in env variables
2. Controlla logs Cloud Run (Google Cloud Console)
3. Testa manualmente: `curl -X POST https://your-domain.com/api/cron/daily-automation -H "Authorization: Bearer YOUR_CRON_SECRET"`

### Task non vengono generati
1. Verifica `ANTHROPIC_API_KEY` configurata
2. Controlla che ci siano sellers nel database
3. Controlla logs per errori AI

### Prospect non vengono creati
1. Verifica che sia lunedì o giovedì (schedule default)
2. Controlla permessi Firebase (write su clients/deals/tasks)
3. Verifica quota API Claude

## 📈 Metriche & Monitoring

Ogni esecuzione logga:
- Numero di sellers processati
- Numero di task generati
- Numero di prospect creati
- Timestamp esecuzione
- Eventuali errori

Check logs:
- Cloud Run: Google Cloud Console → Cloud Run → sales-crm → Logs
- Firebase: Firebase Console → Functions → Logs

## 🔒 Sicurezza

- Endpoint cron protetto con `CRON_SECRET`
- Admin endpoints richiedono token Firebase admin
- Sellers vedono solo i propri dati
- AI ha accesso in sola lettura al database (tranne tasks/prospects che crea)

## 💡 Best Practices

1. **Esegui generazione task ogni mattina** (6-7 AM) prima dell'inizio lavoro
2. **Ricerca prospect 2-3 volte a settimana** (non ogni giorno)
3. **Monitora qualità task generati** e feedback venditori
4. **Ajusta prompt AI** se i task non sono rilevanti
5. **Backup database** prima di deployment major

## 🚦 Status

✅ Sistema attivo e funzionante
✅ API endpoints implementati
✅ Cron job configurato
✅ Admin dashboard integrato
✅ Database centralizzato operativo

## 📞 Support

Per problemi o miglioramenti, contatta il team dev.
