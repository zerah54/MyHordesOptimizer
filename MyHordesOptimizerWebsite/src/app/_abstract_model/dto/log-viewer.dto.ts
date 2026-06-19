import { LogLevel } from '../types/_types';

export interface LogEntryDTO {
    timestamp: string;
    processId: number;
    threadId: number;
    correlationId: string;
    level: LogLevel;
    sourceContext: string;
    eventId: string;
    message: string;
    stackTrace?: string;
    mhoOrigin: string;
    mhoAddonVersion: string;
    requestPath: string;
    query: string;
    body?: string;
}

export interface LogPageResultDTO {
    items: LogEntryDTO[];
    totalCount: number;
    page: number;
    pageSize: number;
}
