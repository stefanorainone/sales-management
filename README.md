# Sales CRM - AI-Powered Sales Management System

Sistema completo di gestione vendite con AI coaching integrato per monitorare sellers, generare task intelligenti e tracciare performance basate su attività.

## 🚀 Caratteristiche Principali

### Per i Venditori (Sellers)
- **Dashboard** con KPIs attività-based (no revenue)
- **Pipeline** Kanban per gestire deals attraverso 5 stage
- **Clienti & Leads** con filtri avanzati e priorità
- **Attività** con calendario e tracking completo
- **AI Task Manager** - Tasks intelligenti generati dall'AI basati su performance
- **Training & Formazione** con raccomandazioni AI personalizzate
- **Analytics** con funnel conversion e confronto team

### Per gli Admin
- **Sales Command Center** - Monitoraggio real-time di tutti i sellers
- **AI Configuration** - Controllo completo del comportamento dell'AI
- **Team Analytics** - Insights e raccomandazioni per il team
- **Alerts & Notifications** - Notifiche critiche su performance

### AI Features
- Generazione automatica task giornalieri personalizzati
- Analisi pattern di performance
- Raccomandazioni corsi di formazione
- Scoring urgenza leads
- Insights strategici per chiusura deals

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Claude Opus (Anthropic)
- **Deployment**: Vercel (recommended)

## 📦 Installazione

### 1. Clone Repository

```bash
git clone <your-repo>
cd sales-managment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

Segui la guida completa in `FIREBASE_SETUP.md` per:
- Creare progetto Firebase
- Abilitare Authentication
- Creare database Firestore
- Deploy security rules
- Ottenere credenziali

### 4. Environment Variables

Crea `.env.local` basato su `.env.local.example`:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Run Development Server

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

L'app usa Firebase Authentication con email/password.

### Demo Account
- Email: `demo@salescrm.com`
- Password: `demo123456`

### Creare Nuovo Account
1. Vai a `/login`
2. Click "Sign Up"
3. Inserisci nome, email e password

## 📊 Struttura Dati Firestore

### Collections

```
users/
  ├── {userId}
  │   ├── email: string
  │   ├── name: string
  │   ├── role: "admin" | "seller"
  │   └── team: string

deals/
  ├── {dealId}
  │   ├── userId: string
  │   ├── title: string
  │   ├── stage: "lead" | "qualified" | "proposal" | "negotiation" | "won"
  │   ├── priority: "hot" | "warm" | "cold"
  │   └── ...

clients/
  ├── {clientId}
  │   ├── userId: string
  │   ├── name: string
  │   ├── email: string
  │   ├── status: "new" | "contacted" | "qualified" | "customer"
  │   └── ...

activities/
  ├── {activityId}
  │   ├── userId: string
  │   ├── type: "call" | "email" | "meeting" | "demo" | "task"
  │   ├── scheduledAt: timestamp
  │   └── ...

aiTasks/
  ├── {taskId}
  │   ├── userId: string
  │   ├── priority: "critical" | "high" | "medium" | "low"
  │   ├── urgency: number (0-100)
  │   └── ...
```

## 🎯 Features Implementate

### ✅ Core Features
- [x] Firebase Authentication con context
- [x] Protected routes
- [x] CRUD completo per Deals
- [x] CRUD completo per Clients
- [x] CRUD completo per Activities
- [x] Real-time sync con Firestore
- [x] Form e Modal riutilizzabili

### ✅ Dashboard Features
- [x] KPIs basati su attività (no revenue)
- [x] Pipeline Kanban con drag-to-advance
- [x] Gestione clienti con filtri
- [x] Calendario attività
- [x] AI Task Manager UI
- [x] Sistema Training con AI recommendations
- [x] Analytics con conversion funnel

### ✅ Admin Features
- [x] Sales Command Center
- [x] Monitoraggio real-time sellers
- [x] AI Configuration panel
- [x] Team insights e alerts

### 🔄 In Development
- [ ] AI Task Generation automatica (backend)
- [ ] Drag & Drop per Pipeline Kanban
- [ ] Notifiche real-time
- [ ] Export reports PDF
- [ ] Email notifications
- [ ] Mobile app (React Native)

## 🚢 Deployment

### Vercel (Raccomandato)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

## 🔒 Security

### Firestore Rules
Le security rules sono in `firestore.rules`:
- Users possono leggere/scrivere solo i propri dati
- Admin hanno accesso completo
- Validazione server-side per tutti i campi

### Best Practices
- ✅ Never commit `.env.local` o `serviceAccountKey.json`
- ✅ Use environment variables per API keys
- ✅ Enable Firebase App Check in production
- ✅ Review security rules prima di production
- ✅ Implement rate limiting per AI API calls

## 📝 Scripts Disponibili

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤖 AI Integration

### Claude API Configuration
L'app usa Claude Opus per:
- Generare task giornalieri personalizzati
- Analizzare performance e suggerire azioni
- Raccomandare corsi di formazione
- Scoring urgenza leads

### Custom AI Behavior
Gli admin possono configurare:
- Aggressività suggerimenti (0-100)
- Focus qualità vs quantità
- Livello autonomia decisionale
- Lunghezza contesto analisi
- Tolleranza al rischio
- Tono comunicazione

## 📖 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md) - Setup completo Firebase
- [API Documentation](./docs/API.md) - API endpoints (TODO)
- [Component Library](./docs/COMPONENTS.md) - UI Components (TODO)

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Auth Issues
- Verifica `.env.local` variables
- Restart dev server after env changes
- Check Firebase Console → Authentication enabled

### Firestore Permission Denied
```bash
# Deploy security rules
firebase deploy --only firestore:rules
```

### AI Tasks Not Generating
- Verifica `ANTHROPIC_API_KEY` in `.env.local`
- Check quota API Anthropic
- View console logs per errori

## 👥 Team

- **Design & UX**: Sales CRM Team
- **Development**: AI-Powered Development
- **AI Integration**: Claude Opus by Anthropic

## 📄 License

MIT License - Feel free to use for your business

## 🚀 Next Steps

1. **Setup Firebase** seguendo `FIREBASE_SETUP.md`
2. **Configura `.env.local`** con le tue credenziali
3. **Run `npm run dev`** e testa l'applicazione
4. **Crea primo seller account** via `/login`
5. **Aggiungi deals, clients e activities** per testare
6. **Configura AI** da admin panel (TODO: implement)
7. **Deploy to Vercel** quando pronto

## 📞 Support

Per supporto:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@salescrm.com
- Documentation: [docs.salescrm.com](https://docs.salescrm.com)

---

**Built with ❤️ using Next.js 15, Firebase, and Claude AI**
