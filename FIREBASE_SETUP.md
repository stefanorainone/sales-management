# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "Sales CRM"
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Save

## 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **production mode** (we have security rules)
4. Choose location (e.g., `europe-west`)
5. Enable

## 4. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Firestore
# - Use existing project: sales-crm
# - Accept default paths

# Deploy rules
firebase deploy --only firestore:rules
```

## 5. Get Firebase Config

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Scroll down to **Your apps**
3. Click **Web** icon (</>)
4. Register app with nickname: "Sales CRM Web"
5. Copy the config object

## 6. Create Environment File

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# For Claude AI
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 7. Create Firebase Admin Service Account

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file as `serviceAccountKey.json` in project root
4. **IMPORTANT**: Add to `.gitignore`

Create `.env.local` variables:

```env
# Add these to your .env.local
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 8. Create Demo User

In Firebase Console:
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Email: `demo@salescrm.com`
4. Password: `demo123456`

Then manually add to Firestore:
1. Go to **Firestore Database**
2. Create collection: `users`
3. Document ID: (use the UID from Authentication)
4. Fields:
   ```
   email: "demo@salescrm.com"
   name: "Mario Rossi"
   role: "seller"
   team: "sales"
   createdAt: (current timestamp)
   ```

## 9. Firestore Collections Structure

The app uses these collections:

### users
- `id` (auto)
- `email`: string
- `name`: string
- `role`: "admin" | "seller"
- `team`: string
- `createdAt`: timestamp

### deals
- `id` (auto)
- `userId`: string (ref to users)
- `clientId`: string (ref to clients)
- `title`: string
- `stage`: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
- `priority`: "hot" | "warm" | "cold"
- `source`: string
- `notes`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### clients
- `id` (auto)
- `userId`: string (ref to users)
- `name`: string
- `email`: string
- `phone`: string
- `company`: string
- `status`: "new" | "contacted" | "qualified" | "customer"
- `priority`: "hot" | "warm" | "cold"
- `source`: string
- `notes`: string
- `createdAt`: timestamp
- `updatedAt`: timestamp

### activities
- `id` (auto)
- `userId`: string (ref to users)
- `clientId`: string (ref to clients)
- `dealId`: string (ref to deals, optional)
- `type`: "call" | "email" | "meeting" | "demo" | "task"
- `title`: string
- `description`: string
- `status`: "pending" | "completed" | "cancelled"
- `scheduledAt`: timestamp
- `completedAt`: timestamp (optional)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### aiTasks
- `id` (auto)
- `userId`: string (ref to users)
- `clientId`: string (ref to clients, optional)
- `dealId`: string (ref to deals, optional)
- `priority`: "critical" | "high" | "medium" | "low"
- `urgency`: number (0-100)
- `title`: string
- `context`: string
- `talkingPoints`: array of strings
- `rationale`: string
- `status`: "pending" | "completed" | "dismissed"
- `createdAt`: timestamp
- `completedAt`: timestamp (optional)

### aiConfig
- `id`: "default"
- `aggressiveness`: number (0-100)
- `qualityVsQuantity`: number (0-100)
- `autonomy`: number (0-100)
- `contextLength`: number (0-100)
- `riskTolerance`: number (0-100)
- `tone`: "professional" | "friendly" | "direct"
- `priorities`: array of strings
- `updatedAt`: timestamp

## 10. Restart Development Server

```bash
npm run dev
```

## Security Notes

1. **Never commit** `.env.local` or `serviceAccountKey.json`
2. **Always use** environment variables for sensitive data
3. **Review** Firestore security rules before production
4. **Enable** App Check in production for additional security
5. **Set up** Firebase Auth email verification for production

## Testing

1. Navigate to `http://localhost:3000/login`
2. Sign in with demo account or create new account
3. You should be redirected to `/dashboard`
4. Try creating deals, clients, activities

## Troubleshooting

**Auth not working:**
- Check `.env.local` variables are correct
- Restart dev server after adding env vars
- Check Firebase Console → Authentication is enabled

**Firestore permission denied:**
- Deploy security rules: `firebase deploy --only firestore:rules`
- Check user is authenticated
- Verify rules match collection names

**AI tasks not generating:**
- Add ANTHROPIC_API_KEY to `.env.local`
- Check Claude API quota
- View logs in browser console
