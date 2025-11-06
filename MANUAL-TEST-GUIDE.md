# 📘 Guida al Test Manuale Completo

## 🎯 Test Completo del Sistema

**URL**: https://sales-crm-412055180465.europe-west1.run.app
**Credenziali**: admin@vr.com / Admin123!
**Tempo**: 10-15 minuti

---

## FASE 1: Login ✅

1. Apri: https://sales-crm-412055180465.europe-west1.run.app
2. Inserisci: admin@vr.com / Admin123!
3. Clicca "Accedi"
4. Verifica redirect a dashboard

---

## FASE 2: Genera Task con AI 🤖

1. Menu laterale → **Admin** → **AI Tasks**
2. Clicca **"Genera con AI"**
3. Seleziona venditore: **admin**
4. Inserisci prompt:
```
Genera 3 task per oggi:
1. Chiamata follow-up cliente
2. Email presentazione prodotto
3. Meeting preparazione proposta

Task semplici, 15-30 minuti ciascuno.
```
5. Clicca **"Genera Task"**
6. **Attendi 30-40 secondi** (AI sta generando)
7. Verifica che appaiano 3 task con:
   - Guidelines dettagliate (7-12 step)
   - Best practices (6-10 tips)
   - Common mistakes
8. Clicca **"Conferma"**

---

## FASE 3: Visualizza Task 📅

1. Menu → **"I Miei Task"** (o vai su /today)
2. Attendi caricamento briefing
3. Verifica che appaiano i 3 task come card
4. Ogni task mostra:
   - Icon (📞/✉️/🤝)
   - Titolo e priorità
   - Tempo stimato
   - Pulsanti: "Vedi Guida", "Inizia Task"

---

## FASE 4: Vedi Guida Dettagliata 📋

1. Clicca **"📋 Vedi Guida"** su un task
2. Verifica contenuto approfondito:
   - **Guidelines**: 7-12 step MOLTO dettagliati
   - **Best Practices**: 6-10 tips con spiegazione PERCHÉ
   - **Common Mistakes**: formato ❌ → CONSEGUENZA → ✅
3. Chiudi modal

---

## FASE 5: Completa un Task ⚡

1. Clicca **"Inizia Task"**
2. Compila form:
   - **Note**: "Test completato! Cliente interessato. Follow-up programmato."
   - **Durata**: 25 minuti
   - **Esito**: ✅ Successo
3. (Opzionale) Carica file - se va in timeout, clicca OK per continuare
4. Clicca **"Completa Task"**
5. Verifica che il task scompaia dalla lista

---

## ✅ Checklist Verifica

- [ ] Login funziona
- [ ] AI genera 3 task (attendi 30-40s)
- [ ] Guidelines hanno 7-12 step dettagliati
- [ ] Best practices hanno 6-10 tips con emoji
- [ ] Common mistakes hanno formato completo
- [ ] Task appaiono su /today
- [ ] Modal esecuzione si apre
- [ ] Form completamento funziona
- [ ] Upload timeout gestito (OK per continuare)
- [ ] Task completato salvato
- [ ] Task scompare da lista

**Se tutto ✅ → Sistema funzionante al 100%!**

---

## 🐛 Problemi Comuni

**Task non appaiono**: Aspetta 20s, ricarica pagina
**Upload timeout**: Normale, clicca OK per continuare senza file
**AI lenta**: Generazione richiede 30-40 secondi

---

**Buon Test!** 🎉
