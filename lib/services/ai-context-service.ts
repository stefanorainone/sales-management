import { adminDb } from '@/lib/firebase/admin';
import type { AIContext, AIContextTask, AITask } from '@/types';

/**
 * Servizio per gestire il contesto AI personalizzato per ogni venditore
 * Include task completati, guide, note, trascrizioni file e impostazioni admin
 */

/**
 * Aggiunge un task completato al contesto AI del venditore
 */
export async function addTaskToContext(
  userId: string,
  task: AITask,
  attachmentTranscriptions?: Array<{
    url: string;
    fileName: string;
    transcription?: string;
    summary?: string;
  }>
): Promise<void> {
  try {
    // Carica il contesto esistente o creane uno nuovo
    const contextRef = adminDb!.collection('aiContexts').doc(userId);
    const contextDoc = await contextRef.get();

    const contextTask: AIContextTask = {
      taskId: task.id,
      taskType: task.type,
      title: task.title,
      description: task.description,
      completedAt: task.completedAt || new Date().toISOString(),
      outcome: task.outcome || 'success',
      guidelines: task.guidelines || [],
      bestPractices: task.bestPractices || [],
      commonMistakes: task.commonMistakes || [],
      script: task.script || '',
      notes: task.notes || '',
      actualDuration: task.actualDuration,
      attachments: attachmentTranscriptions || [],
      aiAnalysis: task.aiAnalysis || '',
      lessonsLearned: task.lessonsLearned || [],
    };

    if (contextDoc.exists) {
      // Aggiorna contesto esistente
      const existingContext = contextDoc.data() as AIContext;

      // Aggiungi il nuovo task (mantieni max 100 task più recenti)
      const updatedTasks = [contextTask, ...existingContext.completedTasks].slice(0, 100);

      // Ricalcola statistiche
      const stats = calculateStats(updatedTasks);

      await contextRef.update({
        completedTasks: updatedTasks,
        stats,
        lastTaskAddedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: (existingContext.version || 0) + 1,
      });
    } else {
      // Crea nuovo contesto
      const newContext: AIContext = {
        id: userId,
        userId,
        sellerName: '', // Verrà popolato dall'admin
        completedTasks: [contextTask],
        stats: calculateStats([contextTask]),
        customContext: {
          sellerStrengths: [],
          sellerWeaknesses: [],
          learningGoals: [],
          specificInstructions: '',
          communicationStyle: 'Professionale e di supporto',
          industryKnowledge: '',
          companyGuidelines: '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastTaskAddedAt: new Date().toISOString(),
        version: 1,
      };

      await contextRef.set(newContext);
    }

    console.log(`[AI Context] Added task ${task.id} to context for user ${userId}`);
  } catch (error) {
    console.error('[AI Context] Error adding task to context:', error);
    throw error;
  }
}

/**
 * Calcola statistiche aggregate dai task completati
 */
function calculateStats(tasks: AIContextTask[]) {
  const totalTasksCompleted = tasks.length;

  const successCount = tasks.filter(t => t.outcome === 'success').length;
  const successRate = totalTasksCompleted > 0
    ? Math.round((successCount / totalTasksCompleted) * 100)
    : 0;

  const durationsWithValues = tasks
    .map(t => t.actualDuration)
    .filter((d): d is number => d !== undefined && d !== null);

  const averageDuration = durationsWithValues.length > 0
    ? Math.round(durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length)
    : 0;

  // Estrai obiezioni comuni dalle note
  const commonObjections: string[] = [];
  tasks.forEach(task => {
    if (task.notes?.toLowerCase().includes('obiezione')) {
      // Qui si potrebbe usare NLP per estrarre le obiezioni, per ora placeholder
      commonObjections.push(`Obiezione in ${task.title}`);
    }
  });

  // Identifica tattiche vincenti (task con successo e note positive)
  const bestPerformingTactics: string[] = [];
  tasks
    .filter(t => t.outcome === 'success')
    .forEach(task => {
      if (task.bestPractices && task.bestPractices.length > 0) {
        bestPerformingTactics.push(...task.bestPractices.slice(0, 2));
      }
    });

  return {
    totalTasksCompleted,
    successRate,
    averageDuration,
    commonObjections: [...new Set(commonObjections)].slice(0, 10),
    bestPerformingTactics: [...new Set(bestPerformingTactics)].slice(0, 10),
  };
}

/**
 * Recupera il contesto AI completo per un venditore
 */
export async function getAIContext(userId: string): Promise<AIContext | null> {
  try {
    const contextRef = adminDb!.collection('aiContexts').doc(userId);
    const contextDoc = await contextRef.get();

    if (!contextDoc.exists) {
      return null;
    }

    return contextDoc.data() as AIContext;
  } catch (error) {
    console.error('[AI Context] Error fetching context:', error);
    return null;
  }
}

/**
 * Aggiorna il contesto personalizzato dall'admin
 */
export async function updateCustomContext(
  userId: string,
  sellerName: string,
  customContext: Partial<AIContext['customContext']>
): Promise<void> {
  try {
    const contextRef = adminDb!.collection('aiContexts').doc(userId);
    const contextDoc = await contextRef.get();

    if (contextDoc.exists) {
      // Aggiorna contesto esistente
      const existingContext = contextDoc.data() as AIContext;

      await contextRef.update({
        sellerName,
        customContext: {
          ...existingContext.customContext,
          ...customContext,
        },
        updatedAt: new Date().toISOString(),
        version: (existingContext.version || 0) + 1,
      });
    } else {
      // Crea nuovo contesto con solo la parte custom
      const newContext: AIContext = {
        id: userId,
        userId,
        sellerName,
        completedTasks: [],
        stats: {
          totalTasksCompleted: 0,
          successRate: 0,
          averageDuration: 0,
          commonObjections: [],
          bestPerformingTactics: [],
        },
        customContext: {
          sellerStrengths: customContext.sellerStrengths || [],
          sellerWeaknesses: customContext.sellerWeaknesses || [],
          learningGoals: customContext.learningGoals || [],
          specificInstructions: customContext.specificInstructions || '',
          communicationStyle: customContext.communicationStyle || 'Professionale e di supporto',
          industryKnowledge: customContext.industryKnowledge || '',
          companyGuidelines: customContext.companyGuidelines || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      await contextRef.set(newContext);
    }

    console.log(`[AI Context] Updated custom context for user ${userId}`);
  } catch (error) {
    console.error('[AI Context] Error updating custom context:', error);
    throw error;
  }
}

/**
 * Formatta il contesto AI in una stringa leggibile per l'AI
 */
export function formatContextForAI(context: AIContext): string {
  let formatted = `# CONTESTO VENDITORE: ${context.sellerName}\n\n`;

  // Statistiche generali
  formatted += `## STATISTICHE PERFORMANCE\n`;
  formatted += `- Task completati: ${context.stats.totalTasksCompleted}\n`;
  formatted += `- Tasso di successo: ${context.stats.successRate}%\n`;
  formatted += `- Durata media task: ${context.stats.averageDuration} minuti\n\n`;

  // Contesto personalizzato dall'admin
  if (context.customContext.specificInstructions) {
    formatted += `## ISTRUZIONI SPECIFICHE DALL'ADMIN\n${context.customContext.specificInstructions}\n\n`;
  }

  if (context.customContext.sellerStrengths.length > 0) {
    formatted += `## PUNTI DI FORZA\n`;
    context.customContext.sellerStrengths.forEach(s => formatted += `- ${s}\n`);
    formatted += '\n';
  }

  if (context.customContext.sellerWeaknesses.length > 0) {
    formatted += `## AREE DI MIGLIORAMENTO\n`;
    context.customContext.sellerWeaknesses.forEach(w => formatted += `- ${w}\n`);
    formatted += '\n';
  }

  if (context.customContext.learningGoals.length > 0) {
    formatted += `## OBIETTIVI DI APPRENDIMENTO\n`;
    context.customContext.learningGoals.forEach(g => formatted += `- ${g}\n`);
    formatted += '\n';
  }

  if (context.customContext.communicationStyle) {
    formatted += `## STILE DI COMUNICAZIONE PREFERITO\n${context.customContext.communicationStyle}\n\n`;
  }

  if (context.customContext.industryKnowledge) {
    formatted += `## CONOSCENZE SETTORE\n${context.customContext.industryKnowledge}\n\n`;
  }

  if (context.customContext.companyGuidelines) {
    formatted += `## LINEE GUIDA AZIENDALI\n${context.customContext.companyGuidelines}\n\n`;
  }

  // Tattiche vincenti
  if (context.stats.bestPerformingTactics.length > 0) {
    formatted += `## TATTICHE VINCENTI (da esperienze passate)\n`;
    context.stats.bestPerformingTactics.forEach(t => formatted += `- ${t}\n`);
    formatted += '\n';
  }

  // Obiezioni comuni
  if (context.stats.commonObjections.length > 0) {
    formatted += `## OBIEZIONI COMUNI INCONTRATE\n`;
    context.stats.commonObjections.forEach(o => formatted += `- ${o}\n`);
    formatted += '\n';
  }

  // Ultimi 5 task completati con note e guide
  if (context.completedTasks.length > 0) {
    formatted += `## ULTIMI TASK COMPLETATI (contesto recente)\n\n`;
    context.completedTasks.slice(0, 5).forEach((task, index) => {
      formatted += `### ${index + 1}. ${task.title} (${task.outcome})\n`;
      formatted += `Data: ${new Date(task.completedAt).toLocaleDateString('it-IT')}\n`;

      if (task.notes) {
        formatted += `Note del venditore: ${task.notes}\n`;
      }

      if (task.aiAnalysis) {
        formatted += `Analisi AI: ${task.aiAnalysis}\n`;
      }

      if (task.attachments && task.attachments.length > 0) {
        formatted += `File caricati:\n`;
        task.attachments.forEach(att => {
          formatted += `- ${att.fileName}\n`;
          if (att.transcription) {
            formatted += `  Contenuto: ${att.transcription.slice(0, 200)}...\n`;
          }
          if (att.summary) {
            formatted += `  Riassunto: ${att.summary}\n`;
          }
        });
      }

      formatted += '\n';
    });
  }

  return formatted;
}
