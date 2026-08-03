export type ExternalToolId = 'myHordesOptimizer' | 'gestHordes' | 'fataMorgana' | 'bigBrothHordes';

export type ExternalToolUpdateStatus = 'pending' | 'success' | 'error';

export interface ExternalToolUpdateErrorDTO {
    unit: string;
    message: string;
}

export interface ExternalToolUpdateStateDTO {
    tool: ExternalToolId;
    status: ExternalToolUpdateStatus;
    errors: ExternalToolUpdateErrorDTO[];
}

export interface ExternalToolsUpdateJobStateDTO {
    jobId: string;
    isRunning: boolean;
    startedAt: string | null;
    finishedAt: string | null;
    tools: ExternalToolUpdateStateDTO[];
}
