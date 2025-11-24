# Configurazione Tavily API per Prospect Reali

Per ottenere suggerimenti di prospect basati su **dati reali da ricerche web**, devi configurare Tavily API.

## Come ottenere la API Key (Gratuita)

1. **Vai su https://tavily.com**
2. **Registrati** con email o GitHub
3. **Ottieni la tua API key** dal dashboard
4. **Free tier**: 1000 ricerche/mese gratuite

## Configurazione

1. Aggiungi la chiave al file `.env.local`:

```bash
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxx
```

2. Riavvia il server di sviluppo:

```bash
npm run dev
```

## Come funziona

Quando configurato, il sistema:
- Cerca **articoli recenti** su startup italiane, funding rounds, CEO
- Estrae **nomi reali** di founder, CEO, executive
- Verifica che siano **persone reali** con aziende reali
- Fornisce **fonti verificabili** (StartupItalia, Il Sole 24 Ore, etc.)

## Senza Tavily API

Se non configuri la chiave:
- Il widget mostrerà **solo task per relazioni esistenti**
- **Non** verranno mostrati prospect inventati (come prima)
- La sezione "Persone che dovresti conoscere" sarà vuota o con pochi risultati

## Deploy su Cloud Run

Aggiungi la variabile d'ambiente anche su Cloud Run:

```bash
# Nel file deploy-cloud-run.sh, aggiungi:
--set-env-vars="TAVILY_API_KEY=your_tavily_key_here"
```

Oppure via console GCloud:
```bash
gcloud run services update sales-crm \
  --update-env-vars TAVILY_API_KEY=tvly-xxxxx \
  --region=europe-west1 \
  --project=culturaimmersiva-it
```
