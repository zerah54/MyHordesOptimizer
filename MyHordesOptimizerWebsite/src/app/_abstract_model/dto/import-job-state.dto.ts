/** Imports qui s'exécutent côté serveur en tâche de fond */
export type ImportJobKey = 'all' | 'towns';

/** État d'un import exécuté côté serveur en tâche de fond */
export interface ImportJobStateDTO {
    job: ImportJobKey;
    isRunning: boolean;
    /** Nature de ce qui est en cours de traitement (étape de l'import global, ou unité comptée) */
    currentStep: string | null;
    currentStepIndex: number;
    totalSteps: number;
    startedAt: string | null;
    finishedAt: string | null;
    /** Null tant qu'aucun import n'est allé au bout depuis le démarrage de l'API */
    lastRunSucceeded: boolean | null;
    error: string | null;
}