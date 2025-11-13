// User & Authentication Types
export type UserRole = 'admin' | 'team_leader' | 'seller';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatar?: string;
  territory?: string;
  team?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Client & Lead Types
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'event' | 'social' | 'ai_research' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'customer';
export type ClientPriority = 'hot' | 'warm' | 'cold';

// VR Business Specific
export type EntityType = 'scuola' | 'hotel' | 'museo_privato' | 'comune';
export type SchoolType = 'elementare' | 'media' | 'superiore' | 'università' | 'istituto_tecnico';
export type HotelStars = 1 | 2 | 3 | 4 | 5;

export interface DecisionMaker {
  name: string;
  role: string; // "Preside", "DSGA", "GM Hotel", "Sindaco", "Assessore", etc
  email?: string;
  phone?: string;
  influence: 'decisore' | 'influencer' | 'gatekeeper';
  notes?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  priority: ClientPriority;

  // VR Business Specific
  entityType: EntityType;

  // Scuola
  studentCount?: number;
  schoolType?: SchoolType;
  schoolGrade?: string; // es: "Classe 3-4-5"

  // Hotel
  stars?: HotelStars;
  roomCount?: number;
  seasonalPeak?: string; // es: "Estate", "Inverno", "Tutto l'anno"

  // Museo
  visitorCountYearly?: number;
  museumType?: string; // es: "Arte", "Storia", "Scienza"

  // Comune
  population?: number;
  touristFlowYearly?: number;
  province?: string;
  region?: string;

  // Decision Makers
  decisionMakers?: DecisionMaker[];

  // Timing & Context
  budgetCycle?: string; // es: "Settembre-Giugno", "Anno solare"
  bestContactPeriod?: string; // es: "Settembre-Dicembre (non esami)", "Primavera (pre-stagione)"

  // Relationship
  relationshipStrength?: 1 | 2 | 3 | 4 | 5; // 1=freddo, 5=partnership forte
  lastInteractionType?: string; // es: "Chiamata", "Meeting", "Email", "Evento"

  // Referenze
  canBeReference?: boolean; // può fare da referenza per altri clienti
  referenceProvidedTo?: string[]; // IDs di altri clienti a cui ha fatto referenza
  tags?: string[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

// Relationship Action Plan (Ferrazzi Model)
// Basato su "Never Eat Alone" di Keith Ferrazzi
export type RelationshipStrength = 'weak' | 'developing' | 'active' | 'strong';
export type RelationshipImportance = 'low' | 'medium' | 'high' | 'critical';
export type RelationshipCategory = 'decision_maker' | 'influencer' | 'champion' | 'gatekeeper' | 'advisor' | 'connector';

export interface RelationshipNote {
  id: string;
  date: string;
  content: string;
  type: 'meeting' | 'call' | 'email' | 'event' | 'personal' | 'gift' | 'favor';
  mood?: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
}

export interface ValueExchangeTracker {
  // Valore che diamo alla persona
  valueGiven: {
    introductions?: string[]; // presentazioni fatte
    advice?: string[]; // consigli/expertise condivisi
    opportunities?: string[]; // opportunità create
    personalSupport?: string[]; // supporto personale offerto
    other?: string[];
  };
  // Valore che riceviamo
  valueReceived: {
    introductions?: string[]; // presentazioni ricevute
    advice?: string[]; // consigli ricevuti
    opportunities?: string[]; // opportunità ricevute
    personalSupport?: string[]; // supporto ricevuto
    other?: string[];
  };
  balance: 'do_give_more' | 'balanced' | 'do_receive_more'; // chi deve dare di più
}

export interface Relationship {
  id: string;
  userId: string; // venditore che gestisce la relazione

  // Informazioni Persona
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;

  // Ferrazzi Model - Metriche Chiave
  strength: RelationshipStrength; // forza e solidità della relazione
  importance: RelationshipImportance; // quanto è importante per i nostri obiettivi
  category: RelationshipCategory; // tipo di relazione strategica

  // Obiettivi e Allineamento
  theirGoals?: string[]; // cosa vogliono raggiungere loro
  ourGoals?: string[]; // cosa vogliamo raggiungere noi con questa relazione
  whatICanGive?: string[]; // cosa posso dare alla relazione
  whatICanReceive?: string[]; // cosa posso ricevere dalla relazione

  // Scambio di Valore (oltre il business)
  valueExchange?: ValueExchangeTracker;

  // Relazione Personale
  personalInterests?: string[]; // hobby, passioni, interessi personali
  familyNotes?: string; // note su famiglia (compleanno figli, etc)
  importantDates?: { // date importanti da ricordare
    type: 'birthday' | 'anniversary' | 'work_anniversary' | 'other';
    date: string;
    description?: string;
  }[];

  // Storico Interazioni
  notes: RelationshipNote[]; // cronologia dettagliata interazioni

  // Rete e Connessioni
  introducedBy?: string; // chi ci ha presentato
  introducedTo?: string[]; // a chi l'abbiamo presentato
  mutualConnections?: string[]; // conoscenze in comune

  // Business Context
  relatedDeals?: string[]; // IDs di deal collegati
  potentialValue?: number; // valore potenziale business
  currentValue?: number; // valore business attuale

  // Reminder e Follow-up
  nextContactDate?: string;
  nextContactReason?: string;
  reminderSet?: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  contactFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'; // frequenza consigliata

  // Tags liberi
  tags?: string[];
}

// Deal/Pipeline Types - VR Business Specific
export type DealStage =
  | 'prospect'           // AI ha individuato, da contattare
  | 'first_contact'      // Primo contatto fatto
  | 'meeting_scheduled'  // Appuntamento fissato
  | 'meeting_done'       // Meeting completato
  | 'proposal_sent'      // Proposta inviata
  | 'under_review'       // In valutazione (giunta/direzione)
  | 'verbal_agreement'   // Accordo verbale ottenuto
  | 'contract_signing'   // Firma contratto in corso
  | 'won'                // Contratto firmato
  | 'in_delivery'        // Evento/installazione in corso
  | 'active'             // Cliente attivo/servizio erogato
  | 'renewal_period'     // Periodo rinnovo
  | 'lost';              // Perso

// VR Service Types
export type ServiceType =
  | 'evento_scuola'         // Evento VR nella scuola
  | 'postazione_hotel'      // Postazione VR hotel (revenue share)
  | 'postazione_museo'      // Postazione VR museo (revenue share)
  | 'esperienza_comune'     // Sviluppo esperienza 360 per comune
  | 'postazione_comune'     // Postazione InfoPoint comunale
  | 'evento_comune';        // Evento pubblico per comune

export type ContractType =
  | 'evento_singolo'        // Un evento una tantum
  | 'abbonamento_annuale'   // Contratto annuale
  | 'sviluppo_custom';      // Sviluppo esperienza custom

export interface Deal {
  id: string;
  userId: string;
  clientId: string;
  clientName?: string;
  entityType?: EntityType; // replicated for easy filtering
  stage: DealStage;
  priority: ClientPriority;
  source?: LeadSource;

  // VR Business Specific
  serviceType: ServiceType;
  contractType: ContractType;

  // Scuole - Evento
  eventDate?: string;
  studentCount?: number;
  hoursRequested?: number;
  experiencesSelected?: string[]; // quali esperienze VR

  // Hotel/Musei - Postazione (NO revenue tracking come richiesto)
  installationDate?: string;
  contractDurationMonths?: number;

  // Comuni - Esperienza + Postazione
  experienceTheme?: string; // es: "Patrimonio UNESCO", "Centro storico"
  shootingRequired?: boolean; // serve fare riprese 360?
  eventPlanned?: boolean;
  eventDate2?: string; // data evento inaugurale
  installationLocation?: string; // dove sarà la postazione

  // Contratto
  contractValue?: number; // valore contratto fisso (solo se applicabile)

  // Timing
  expectedSigningDate?: string;
  budgetApprovalDate?: string; // quando approvano budget/giunta

  // Follow-up e Relationship
  followUpStrategy?: string; // strategia personalizzata per questo cliente
  relationshipNotes?: string; // cosa è importante per questo cliente
  daysSinceLastContact?: number; // auto-calcolato

  // Standard fields
  probability: number; // 0-100
  createdAt: string;
  updatedAt: string;
  expectedCloseDate?: string;
  closedDate?: string;
  lostReason?: string;
  notes?: string;
  title?: string;
}

// Activity Types
export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'demo'
  | 'follow_up'
  | 'note'
  | 'task';

export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

export interface Activity {
  id: string;
  userId?: string; // user ID
  type: ActivityType;
  title: string;
  description?: string;
  clientId?: string;
  dealId?: string;
  assignedTo?: string; // user ID
  status: ActivityStatus;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number; // in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// AI Task Types
export type AITaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AITaskStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'skipped' | 'snoozed';
export type AITaskType = 'call' | 'email' | 'meeting' | 'demo' | 'follow_up' | 'research' | 'admin';

export interface TaskPostponeReason {
  timestamp: string;
  reason: string;
  postponedFrom: string; // original date
  postponedTo: string; // new date
}

export interface AITask {
  id: string;
  userId: string;
  type: AITaskType;
  title: string;
  description: string;
  aiRationale: string; // Why AI created this task
  priority: AITaskPriority;
  status: AITaskStatus;

  // Scheduling
  scheduledAt: string; // ISO date-time
  originalScheduledAt?: string; // Original date before any postpones
  snoozedUntil?: string; // When snoozed, reschedule for this date
  dismissedAt?: string; // When dismissed
  postponeHistory?: TaskPostponeReason[]; // History of all postpones with reasons

  // Relations
  clientId?: string;
  clientName?: string;
  dealId?: string;
  dealTitle?: string;

  // AI Assistance
  script?: string; // Call/email script generated by AI
  talkingPoints?: string[];
  objectives?: string[];
  emailDraft?: string; // Pre-written email
  demoScript?: string; // Demo presentation flow

  // Task Guidance
  guidelines?: string[]; // Step-by-step guidelines on how to execute the task
  bestPractices?: string[]; // Tips and best practices for this task
  commonMistakes?: string[]; // Common errors to avoid

  // Expected Output Format
  expectedOutputFormat?: {
    type: 'text' | 'structured_data' | 'google_sheet' | 'document' | 'mixed';
    description: string; // What format the seller should provide
    example?: string; // Example of expected output
    fields?: string[]; // For structured data, what fields to include
    documentRequired?: boolean; // Whether file upload is mandatory
  };

  // Context
  clientContext?: string; // AI summary of client history
  dealContext?: string; // AI summary of deal status
  suggestedActions?: string[]; // What to do after task

  // Tracking
  startedAt?: string;
  completedAt?: string;
  outcome?: 'success' | 'partial' | 'failed' | 'no_answer';
  results?: string; // Concrete results obtained from the task
  notes?: string; // Seller notes after completion
  additionalNotes?: string; // Additional comments or observations
  aiAnalysis?: string; // AI analysis of notes
  attachments?: string[]; // URLs to uploaded documents/files

  // Time Tracking
  estimatedDuration?: number; // Estimated time in minutes (optimistic)
  actualDuration?: number; // Actual time taken in minutes

  // Metadata
  confidence?: number; // 0-100 AI confidence this task will succeed (optional, legacy)
  impactScore?: number; // 0-100 expected impact on deal (optional, legacy)
  createdAt: string;
  updatedAt: string;
}

// AI Insights Types
export type AIInsightType = 'warning' | 'opportunity' | 'suggestion' | 'celebration' | 'tip';
export type AIInsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AIInsight {
  id: string;
  userId: string;
  type: AIInsightType;
  title: string;
  message: string;
  priority: AIInsightPriority;
  actionable: boolean;
  suggestedAction?: string;
  relatedClientId?: string;
  relatedDealId?: string;
  relatedTaskId?: string;
  dismissed: boolean;
  createdAt: string;
}

// AI Coach Chat Types
export type AICoachMessageRole = 'user' | 'assistant';

export interface AICoachMessage {
  id: string;
  userId: string;
  role: AICoachMessageRole;
  content: string;
  context?: {
    currentTask?: AITask;
    recentActivities?: Activity[];
    activePipeline?: Deal[];
  };
  timestamp: string;
}

export interface AICoachSession {
  id: string;
  userId: string;
  messages: AICoachMessage[];
  startedAt: string;
  lastMessageAt: string;
  topic?: string; // e.g., "objection handling", "demo prep"
}

// Daily Briefing Types
export interface DailyBriefing {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD

  // Summary
  tasksCount: number;
  priorityBreakdown: Record<AITaskPriority, number>;

  // Tasks
  tasks: AITask[];

  // Insights
  insights: AIInsight[];

  // Yesterday recap
  yesterdayCompleted: number;
  yesterdayTotal: number;

  // AI Productivity Coaching
  motivationalMessage: string;
  focusAreas: string[];
  productivityTips?: string[]; // AI suggestions to speed up and do more
  bottlenecks?: string[]; // What's slowing down the seller

  createdAt: string;
}

// Task Execution Session
export interface TaskExecutionSession {
  id: string;
  taskId: string;
  userId: string;

  // Timing
  startedAt: string;
  endedAt?: string;
  pausedDuration?: number; // minutes paused

  // During execution
  timerRunning: boolean;
  elapsedTime: number; // seconds

  // Notes & outcome
  notes: string;
  outcome?: 'success' | 'partial' | 'failed' | 'no_answer';
  nextSteps?: string[];

  // AI real-time assistance
  aiSuggestions?: string[];
  questionsAsked?: string[];
}

// Training Types
export type TrainingStatus = 'not_started' | 'in_progress' | 'completed';

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  modules: TrainingModule[];
  createdAt: Date;
}

export interface TrainingModule {
  id: string;
  title: string;
  content: string;
  order: number;
  duration: number;
  quizzes?: Quiz[];
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface UserTrainingProgress {
  userId: string;
  courseId: string;
  status: TrainingStatus;
  currentModule: number;
  completedModules: number[];
  score?: number;
  startedAt: Date;
  completedAt?: Date;
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

// Personal Progress Tracking (non-competitive)
export interface PersonalProgress {
  userId: string;
  period: 'week' | 'month' | 'quarter';
  currentPeriod: {
    dealsWon: number;
    tasksCompleted: number;
    avgResponseTime: number; // hours
    meetingsHeld: number;
  };
  previousPeriod: {
    dealsWon: number;
    tasksCompleted: number;
    avgResponseTime: number; // hours
    meetingsHeld: number;
  };
  improvements: {
    dealsWon: number; // delta
    tasksCompleted: number; // delta
    avgResponseTime: number; // delta (negative = improvement)
    meetingsHeld: number; // delta
  };
}

// Team Goals (collaborative, not competitive)
export interface TeamGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  period: 'quarter' | 'month' | 'year';
  startDate: string;
  endDate: string;
  type: 'deals_won' | 'revenue' | 'meetings' | 'custom';
}

// Team Celebrations (highlight achievements without ranking)
export interface TeamCelebration {
  id: string;
  userId: string;
  userName: string;
  type: 'deal_won' | 'milestone' | 'team_goal' | 'achievement';
  message: string;
  icon?: string;
  timestamp: string;
}

// DEPRECATED: Use PersonalProgress instead
// @deprecated
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  points: number;
  rank: number;
  metrics: {
    calls?: number;
    meetings?: number;
    deals?: number;
    revenue?: number;
  };
}

// Metrics & Analytics Types
export interface SellerMetrics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;

  // Activity metrics
  calls: number;
  emails: number;
  meetings: number;
  followUps: number;

  // Pipeline metrics
  leadsAcquired: number;
  leadsQualified: number;
  meetingsScheduled: number;
  proposalsSent: number;
  proposalsAccepted: number;
  contractsSigned: number;

  // Conversion rates
  conversionRates: {
    leadToQualified: number;
    qualifiedToMeeting: number;
    meetingToProposal: number;
    proposalToContract: number;
  };

  // Performance
  revenue?: number;
  avgDealSize?: number;
  avgSalesCycle: number; // in days
  winRate: number;

  // Score
  aiScore: number; // 0-100 AI evaluation of performance

  // DEPRECATED: Use PersonalProgress for tracking improvements
  // @deprecated
  points?: number; // gamification points
}

// AI Configuration Types
export interface AIConfig {
  behavior: {
    focusPrimary: string;
    focusSecondary: string;
    customContext: string;
    aggressiveness: number; // 0-100
    qualityVsQuantity: number; // 0-100
    autonomy: number; // 0-100
    contextLength: number; // 0-100
    riskTolerance: number; // 0-100
  };
  priorities: {
    weights: Record<string, number>;
    thresholds: Record<string, number>;
    stageBasedPriorities: Record<DealStage, number>;
  };
  personality: {
    tone: string;
    useEmoji: boolean;
    celebrateSuccess: boolean;
    provideConstructiveFeedback: boolean;
    collaborativeMode: boolean; // Celebrate team wins, not individual competition
  };
  timing: {
    dailyAnalysis: boolean;
    dailyAnalysisTime: string; // HH:mm
    morningBoost: boolean;
    morningBoostTime: string;
    realTime: boolean;
  };
}

export interface SellerAIPreferences {
  userId: string;
  preferredTimes: {
    calls: string[];
    followUps: string[];
    prospecting: string[];
    meetingPrep: string[];
  };
  detailLevel: 'minimal' | 'medium' | 'maximum';
  tasksPerDay: number;
  preferredTaskTypes: ActivityType[];
  communicationStyle: string;
  notifications: {
    morningEmail: boolean;
    pushNotifications: boolean;
    smsAlerts: boolean;
    eveningRecap: boolean;
  };
  autonomy: 'auto_schedule' | 'suggest' | 'alert_only';
}

// Dashboard Types
export interface DashboardStats {
  userId: string;
  role: UserRole;
  period: string;

  // KPIs
  revenue: number;
  revenueTarget: number;
  deals: number;
  dealsTarget: number;
  winRate: number;
  avgDealCycle: number;

  // This week/month
  weeklyActivities: number;
  monthlyActivities: number;
  upcomingMeetings: number;
  overdueTask: number;

  // Pipeline
  pipelineValue: number;
  pipelineByStage: Record<DealStage, number>;

  // Personal Progress (non-competitive)
  personalProgress?: PersonalProgress;

  // DEPRECATED: Use personalProgress instead
  // @deprecated
  rank?: number;
  // @deprecated
  points?: number;
}

// Admin Dashboard Types
export interface AICustomInstructions {
  id: string;
  userId: string; // seller ID
  adminId: string; // who created the instructions
  instructions: string; // custom instructions for AI
  priority: 'high' | 'medium' | 'low';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // optional expiration date
}

export interface AdminSellerOverview {
  user: User;
  stats: {
    activeDeals: number;
    dealsWon: number;
    tasksToday: number;
    tasksCompleted: number;
    lastActivity?: string;
  };
  recentDeals: Deal[];
  todayTasks: AITask[];
  customInstructions?: AICustomInstructions[];
  recentChats?: AICoachSession[]; // Recent AI coach conversations
}

export interface AdminChatIntervention {
  id: string;
  sessionId: string;
  userId: string; // seller ID
  adminId: string;
  adminMessage: string; // message from admin to seller
  timestamp: string;
  resolved: boolean;
}

export interface AdminDashboardData {
  sellers: AdminSellerOverview[];
  teamStats: {
    totalDeals: number;
    dealsWon: number;
    avgWinRate: number;
    totalRevenue: number;
  };
}

// AI Context Types - Sistema di contesto personalizzato per ogni venditore
export interface AIContextTask {
  taskId: string;
  taskType: AITaskType;
  title: string;
  description: string;
  completedAt: string;
  outcome: 'success' | 'partial' | 'failed' | 'no_answer';

  // Guide del task
  guidelines?: string[];
  bestPractices?: string[];
  commonMistakes?: string[];
  script?: string;

  // Note e risultati del venditore
  notes?: string;
  actualDuration?: number;

  // File caricati e loro trascrizioni
  attachments?: Array<{
    url: string;
    fileName: string;
    transcription?: string; // Trascrizione OCR o contenuto estratto
    summary?: string; // Riassunto AI del contenuto
  }>;

  // Insights AI dal task completato
  aiAnalysis?: string;
  lessonsLearned?: string[];
}

export interface AIContext {
  id: string;
  userId: string;
  sellerName: string;

  // Contesto automaticamente generato dai task completati
  completedTasks: AIContextTask[];

  // Statistiche aggregate
  stats: {
    totalTasksCompleted: number;
    successRate: number; // % success vs partial/failed
    averageDuration: number;
    commonObjections: string[];
    bestPerformingTactics: string[];
  };

  // Contesto personalizzato dall'admin (modificabile)
  customContext: {
    sellerStrengths: string[]; // Punti di forza del venditore
    sellerWeaknesses: string[]; // Aree di miglioramento
    learningGoals: string[]; // Obiettivi di apprendimento
    specificInstructions: string; // Istruzioni specifiche per questo venditore
    communicationStyle: string; // Come l'AI dovrebbe parlare con questo venditore
    industryKnowledge: string; // Conoscenze specifiche del settore
    companyGuidelines: string; // Linee guida aziendali specifiche
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastTaskAddedAt?: string;
  version: number; // Per tracking delle modifiche
}

// Per l'admin: form per modificare il contesto
export interface AIContextUpdateInput {
  userId: string;
  sellerStrengths?: string[];
  sellerWeaknesses?: string[];
  learningGoals?: string[];
  specificInstructions?: string;
  communicationStyle?: string;
  industryKnowledge?: string;
  companyGuidelines?: string;
}
