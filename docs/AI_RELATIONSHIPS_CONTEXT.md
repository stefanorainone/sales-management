# AI Task Generation con Contesto Relazioni

## Overview
Il sistema AI per la generazione di task deve includere il contesto completo delle relazioni del venditore per fornire suggerimenti personalizzati e rilevanti.

## Dati Relazioni da Includere nel Contesto AI

### Per ogni relazione:
```typescript
{
  // Informazioni base
  name: string,
  company: string,
  role: string,

  // Stato relazione (Ferrazzi Model)
  strength: 'strong' | 'active' | 'developing' | 'weak',
  importance: 'critical' | 'high' | 'medium' | 'low',
  category: 'decision_maker' | 'influencer' | 'champion' | 'gatekeeper' | 'advisor' | 'connector',

  // Value exchange
  valueBalance: 'do_give_more' | 'balanced' | 'do_receive_more',
  mutualBenefits: string[],

  // Action tracking
  lastContact: string, // ISO date
  nextAction: string,
  actionsHistory: RelationshipAction[],

  // User context
  userId: string, // Per tasks multi-user
  userName: string // Per admin view
}
```

## Prompt Template per AI Task Generation

```
You are an AI sales assistant helping a salesperson manage their strategic relationships using the Keith Ferrazzi "Never Eat Alone" methodology.

### User Context:
- User: {{userName}}
- Email: {{userEmail}}
- Role: {{userRole}}

### Current Relationships Status:
{{#each relationships}}
- **{{name}}** ({{company}})
  - Role: {{role}}
  - Relationship Strength: {{strength}}
  - Strategic Importance: {{importance}}
  - Category: {{category}}
  - Value Balance: {{valueBalance}}
  - Last Contact: {{lastContact}} ({{daysAgo}} days ago)
  - Next Planned Action: {{nextAction}}
  - Mutual Benefits: {{#each mutualBenefits}}{{this}}, {{/each}}
  - Recent Actions:
    {{#each actionsHistory}}
    - {{completedAt}}: {{action}}
    {{/each}}
{{/each}}

### High Priority Relationships Needing Action:
{{#each criticalRelationships}}
- {{name}} ({{company}}): {{reason}}
{{/each}}

### Relationships with Imbalanced Value Exchange:
{{#each imbalancedRelationships}}
- {{name}}: Currently "{{valueBalance}}" - suggest ways to rebalance
{{/each}}

### Generate AI Tasks:
Based on the above context, generate prioritized tasks that will:
1. Strengthen weak relationships before they become dormant
2. Maintain strong relationships with regular touchpoints
3. Balance value exchange (give before you receive)
4. Leverage connectors to expand network
5. Nurture decision-makers and champions
6. Follow up on planned next actions
7. Identify opportunities for mutual benefit

For each task, include:
- Relationship context (name, company, strength, importance)
- Urgency score (1-100)
- Recommended time/date
- Specific talking points based on relationship history
- Expected outcome
- Value balance consideration
```

## Implementation Steps

### 1. Creare il Context Builder
```typescript
// lib/ai/relationshipsContextBuilder.ts
export function buildRelationshipsContext(userId: string, relationships: Relationship[]) {
  // Filter relationships for user
  const userRelationships = relationships.filter(r => r.userId === userId);

  // Identify critical relationships
  const criticalRelationships = userRelationships.filter(r =>
    r.importance === 'critical' &&
    (r.strength === 'weak' || daysSinceLastContact(r.lastContact) > 14)
  );

  // Identify imbalanced relationships
  const imbalancedRelationships = userRelationships.filter(r =>
    r.valueBalance === 'do_give_more' || r.valueBalance === 'do_receive_more'
  );

  // Build context object
  return {
    totalRelationships: userRelationships.length,
    strongRelationships: userRelationships.filter(r => r.strength === 'strong').length,
    criticalRelationships,
    imbalancedRelationships,
    relationships: userRelationships.map(r => ({
      ...r,
      daysAgo: daysSinceLastContact(r.lastContact),
      recentActionsCount: r.actionsHistory?.length || 0
    }))
  };
}
```

### 2. Integrate nel Task Generator
```typescript
// lib/ai/taskGenerator.ts
import { buildRelationshipsContext } from './relationshipsContextBuilder';
import { generateAITasks } from './anthropic'; // o altro provider

export async function generateTasksForUser(userId: string) {
  // Fetch relationships
  const relationships = await fetchRelationshipsForUser(userId);

  // Build context
  const context = buildRelationshipsContext(userId, relationships);

  // Generate tasks via AI
  const tasks = await generateAITasks({
    userId,
    relationshipsContext: context,
    userPreferences: await getUserPreferences(userId)
  });

  return tasks;
}
```

### 3. Admin View Context
Per l'admin che vuole vedere task di tutti i venditori:
```typescript
export async function generateTasksForAllUsers() {
  const allUsers = await fetchAllUsers();
  const allRelationships = await fetchAllRelationships();

  const tasksByUser = await Promise.all(
    allUsers.map(async (user) => {
      const userRelationships = allRelationships.filter(r => r.userId === user.id);
      const context = buildRelationshipsContext(user.id, userRelationships);
      const tasks = await generateAITasks({
        userId: user.id,
        userName: user.displayName,
        relationshipsContext: context
      });

      return {
        userId: user.id,
        userName: user.displayName,
        tasks
      };
    })
  );

  return tasksByUser;
}
```

## Esempi di Task Generati

### Task 1: Strengthen Weak Relationship
```
Priority: HIGH (85/100)
Relationship: Maria Bianchi (Acme Corp) - CTO
Strength: Weak → Target: Active
Last Contact: 21 days ago

Action: Send personalized follow-up email
Talking Points:
- Reference discussion about cloud migration from last meeting
- Share relevant case study: "How Company X reduced costs by 40%"
- Offer to introduce her to our technical architect
- No ask - pure value giving (current balance: do_give_more)

Expected Outcome: Re-engage relationship, move from weak to developing
```

### Task 2: Maintain Strong Relationship
```
Priority: MEDIUM (60/100)
Relationship: Paolo Verdi (Beta SRL) - Decision Maker
Strength: Strong
Last Contact: 5 days ago

Action: Coffee meeting this week
Talking Points:
- Congratulate on their recent product launch (saw on LinkedIn)
- Share industry insights from recent conference
- Ask about challenges with current solution
- Offer connection to potential client in their target market

Expected Outcome: Maintain strong relationship, create mutual value
```

### Task 3: Leverage Connector
```
Priority: HIGH (90/100)
Relationship: Laura Neri (Consulting Firm) - Connector
Strength: Active
Last Contact: 3 days ago

Action: Request introduction to 2-3 decision-makers in target companies
Talking Points:
- Remind of successful referral you gave her last month
- Explain specific profile you're looking for
- Offer to reciprocate with intros from your network
- Value balance: Currently balanced, this maintains reciprocity

Expected Outcome: 2-3 warm introductions to potential high-value relationships
```

## Benefits

1. **Personalized**: Tasks basati sullo stato reale delle relazioni
2. **Timely**: Intervento prima che le relazioni si raffreddino
3. **Strategic**: Focus su Ferrazzi principles (give before receive, network strategically)
4. **Actionable**: Talking points specifici basati su history
5. **Measurable**: Track success rate dei task AI vs manual

## Next Steps

1. [ ] Implementare relationshipsContextBuilder.ts
2. [ ] Integrare con AI provider (Anthropic Claude, OpenAI, etc.)
3. [ ] Creare task scheduling system
4. [ ] Add feedback loop (user marks tasks as good/bad)
5. [ ] Train AI on successful patterns
6. [ ] Add admin dashboard per vedere AI performance per user
