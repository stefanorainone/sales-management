# 🧪 Testing Guide - Task Generation & File Upload

## ✅ Cosa è stato implementato

### 1. **AI genera automaticamente `expectedOutputFormat`**
L'intelligenza artificiale ora genera automaticamente per ogni task:
- `type`: tipo di output richiesto (document, google_sheet, mixed, etc.)
- `description`: istruzioni dettagliate su cosa caricare
- `example`: esempio concreto di output atteso
- `fields`: campi richiesti (per dati strutturati)
- `documentRequired: true`: documento sempre obbligatorio

### 2. **UI aggiornata**
- Sezione rossa "DOCUMENTO DA CARICARE - OBBLIGATORIO" nel modal di esecuzione task
- Upload file obbligatorio con validazione
- Responsive su mobile/tablet/desktop
- Modal scrollabile per visualizzare tutto il contenuto

### 3. **Validazione**
- Non è possibile completare un task senza caricare almeno un file
- Alert chiaro che mostra il formato richiesto se si prova a completare senza file

## 📋 Script di Test Disponibili

### 1. **Test Locale** (`scripts/test-local-complete.js`)
Test automatizzato completo per l'ambiente di sviluppo.

```bash
# Avvia il server locale
npm run dev

# In un altro terminale, esegui il test
node scripts/test-local-complete.js
```

Cosa testa:
- ✅ Desktop layout
- ✅ Mobile responsive (iPhone 12 Pro)
- ✅ Task guidance modal
- ✅ Task execution modal
- ✅ Sezione expectedOutputFormat (rossa, obbligatoria)
- ✅ File upload section
- ✅ Validazione (completa senza file)
- ✅ API response con expectedOutputFormat

### 2. **Test Produzione** (`scripts/test-production-manual.js`)
Test interattivo per l'ambiente di produzione.

```bash
node scripts/test-production-manual.js
```

Questo script:
- Apre il browser in modalità visibile
- Ti chiede di fare login manualmente
- Ti guida attraverso i vari step di test
- Chiede conferma prima di generare nuovi task
- Fa screenshot di tutto
- Verifica che expectedOutputFormat sia presente in tutti i task

## 🎯 Come Verificare Manualmente

### 1. Verifica nel Pannello Admin

1. Vai su `/admin/tasks`
2. Clicca su "Genera Task" (se vuoi generarne di nuovi)
3. Attendi 10-30 secondi per la generazione AI
4. Clicca su un task per vedere i dettagli
5. Verifica che ci sia la sezione "Expected Output Format"

### 2. Verifica come Venditore

1. Vai su `/today`
2. Clicca su un task
3. Clicca "Vedi Guida" per vedere guidelines, best practices, common mistakes
4. Clicca "Inizia Task"
5. **Verifica sezione rossa "DOCUMENTO DA CARICARE - OBBLIGATORIO"**
6. Verifica che sia visibile anche su mobile (scrollando)
7. Prova a completare senza file → deve mostrare alert
8. Carica un file e completa → deve funzionare

### 3. Verifica Mobile

1. Apri DevTools (F12)
2. Clicca sull'icona mobile (toggle device toolbar)
3. Seleziona "iPhone 12 Pro" o altro dispositivo
4. Naviga su `/today`
5. Verifica che tutto sia visibile e scrollabile
6. Apri un task e verifica che il modal sia scrollabile
7. Scorri fino alla sezione upload file

## 📸 Screenshot Generati dai Test

Tutti gli screenshot vengono salvati in `test-results/`:

### Test Locale:
- `local-01-login.png` - Pagina di login
- `local-02-after-login.png` - Dopo il login
- `local-03-today-page.png` - Pagina /today
- `local-04-task-guidance.png` - Modal con linee guida
- `local-05-task-execution-modal.png` - Modal esecuzione task
- `local-06-upload-section.png` - Sezione upload file
- `local-07-after-validation.png` - Dopo test validazione
- `local-08-mobile-today.png` - Mobile: pagina today
- `local-09-mobile-task-modal.png` - Mobile: modal task
- `local-10-mobile-upload.png` - Mobile: sezione upload

### Test Produzione:
- `admin-tasks-dashboard.png` - Dashboard task admin
- `task-details.png` - Dettagli task
- `after-generation.png` - Dopo generazione
- `new-tasks-list.png` - Lista nuovi task
- `mobile-view.png` - Vista mobile
- `tablet-view.png` - Vista tablet

## 🔍 Cosa Verificare negli Screenshot

### ✅ Desktop
- [ ] Tasks visibili con priorità e badge
- [ ] Pulsante "Vedi Guida" presente
- [ ] Modal di esecuzione task con tutte le sezioni
- [ ] Sezione rossa "OBBLIGATORIO" ben visibile
- [ ] Sezione upload file con sfondo rosso
- [ ] Testo leggibile (nero, non bianco)

### ✅ Mobile
- [ ] Layout responsive (testo e pulsanti ridimensionati)
- [ ] Modal scrollabile
- [ ] Sezione upload visibile dopo scroll
- [ ] Pulsanti cliccabili (non troppo piccoli)

### ✅ API
- [ ] Tutti i task hanno `expectedOutputFormat`
- [ ] Tutti hanno `documentRequired: true`
- [ ] Tutti hanno `guidelines`, `bestPractices`, `commonMistakes`

## 🚀 Deploy e Test in Produzione

### 1. Deploy delle modifiche

```bash
# Commit le modifiche
git add .
git commit -m "feat: AI generates expectedOutputFormat automatically"

# Deploy su Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

### 2. Verifica produzione

```bash
# Esegui test manuale interattivo
node scripts/test-production-manual.js
```

### 3. Verifica con utenti reali

1. Chiedi a un venditore di testare
2. Verifica che veda chiaramente cosa deve caricare
3. Verifica che non possa completare senza file
4. Raccogli feedback sull'esperienza utente

## 📝 Checklist Finale

Prima di considerare il feature completo:

- [ ] AI genera `expectedOutputFormat` per tutti i task
- [ ] `documentRequired: true` per tutti i task
- [ ] UI mostra chiaramente cosa caricare (sfondo rosso)
- [ ] Validazione impedisce completamento senza file
- [ ] File vengono caricati su Firebase Storage
- [ ] URL file vengono salvati in Firestore
- [ ] Admin può vedere file caricati
- [ ] Mobile responsive funziona
- [ ] Testo leggibile su tutti i campi
- [ ] Modal scrollabile su mobile

## 🐛 Troubleshooting

### File upload non visibile su mobile
- Verifica che modal abbia `overflow-y-auto`
- Verifica che non ci siano elementi con `height: 100%` che bloccano scroll
- Usa DevTools mobile per simulare

### Testo bianco/illeggibile
- Aggiungi `text-gray-900` a input e textarea
- Verifica contrasto su Lighthouse

### Alert non appare
- Verifica console per errori JavaScript
- Verifica che la validazione sia nel click handler del pulsante

### API non ritorna expectedOutputFormat
- Verifica prompt AI in `lib/services/ai-service.ts`
- Verifica che OpenAI API key sia configurata
- Controlla logs: `gcloud logs read --service=sales-management`

## 📚 File Modificati

### Core Changes:
1. `/lib/services/ai-service.ts` (linee 205-218, 616-841)
   - Prompt AI aggiornato
   - Mock tasks aggiornati

2. `/components/ai/TaskExecutionModal.tsx`
   - Validazione file obbligatoria
   - Sezione rossa "OBBLIGATORIO"

3. `/components/ui/Modal.tsx`
   - Modal scrollabile
   - Mobile responsive

4. `/components/today/CompletedTaskModal.tsx`
   - Visualizzazione/editing file allegati

### Test Scripts:
- `/scripts/test-local-complete.js`
- `/scripts/test-production-manual.js`
- `/scripts/test-task-generation-prod.js`

## 🎉 Successo!

Se tutti i test passano:
- ✅ AI genera automaticamente expectedOutputFormat
- ✅ Venditore vede chiaramente cosa caricare
- ✅ Non può completare senza file
- ✅ File vengono salvati correttamente
- ✅ Admin vede i risultati
- ✅ Mobile responsive funziona

**Il feature è pronto per la produzione! 🚀**
