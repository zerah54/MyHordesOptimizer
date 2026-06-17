import { LogLevel } from './_types';

export interface LogEntry {
    timestamp: string;
    processId: number;
    threadId: number;
    correlationId: string;
    level: LogLevel;
    sourceContext: string;
    eventId: string;
    message: string;
    stackTrace?: string;
}

export interface LogPageResult {
    items: LogEntry[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface LogFilters {
    level?: LogLevel | '';
    correlationId?: string;
    search?: string;
}
