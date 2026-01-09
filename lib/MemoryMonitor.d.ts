import { EventEmitter } from 'events';
import * as v8 from 'v8';

export interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}

export interface CpuUsage {
    user: number;
    system: number;
}

export interface MemoryHistoryEntry {
    timestamp: number;
    memoryUsage: MemoryUsage;
}

export interface CpuHistoryEntry {
    timestamp: number;
    cpuUsage: CpuUsage;
}

export interface GCHistoryEntry {
    timestamp: number;
    gcStats: v8.HeapStatistics;
    type?: string;
    duration?: number;
}

export interface MemoryBreakdown extends MemoryUsage {
    totalSystemMemory: number;
    freeSystemMemory: number;
    usedSystemMemory: number;
    heapUtilization: number;
    systemMemoryUtilization: number;
}

export interface LeakDetectionResult {
    message: string;
    trend: number;
    measurements: number[];
    suggestions: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceImpact {
    averageTimeMs: number;
    totalTimeMs: number;
    count: number;
}

export interface MemoryTrend {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    prediction: number;
}

export interface MonitorOptions {
    threshold?: number;
    maxHistorySize?: number;
    enableGC?: boolean;
    enablePredictions?: boolean;
    alertThresholds?: {
        warning?: number;
        critical?: number;
    };
}

export type NotificationMethod = (message: string) => void;
export type ExportFormat = 'json' | 'csv';

export interface MemoryStatistics {
    memory: {
        current: MemoryUsage;
        average: number;
        peak: { value: number; timestamp: number };
        trend: MemoryTrend | null;
    };
    cpu: {
        current: CpuUsage;
        average: { user: number; system: number };
    };
    performance: PerformanceImpact;
    gc: {
        count: number;
        lastUpdate: number | null;
    };
}

export interface MemoryPressure {
    isUnderPressure: boolean;
    pressureLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
}

export interface AlertInfo {
    type: 'warning' | 'critical';
    memoryUsage: MemoryUsage;
    message: string;
}

export declare class MemoryMonitor extends EventEmitter {
    constructor(threshold?: number, maxHistorySize?: number, options?: MonitorOptions);
    
    startMonitoring(interval?: number): void;
    stopMonitoring(): void;
    
    takeHeapSnapshot(automatic?: boolean): Promise<string>;
    checkDiskSpace(): Promise<number>;
    
    getMemoryUsageReport(): MemoryHistoryEntry[];
    getCpuUsageReport(): CpuHistoryEntry[];
    getGCReport(): GCHistoryEntry[];
    clearHistory(): void;
    
    notifyOnThresholdExceeded(notificationMethod: NotificationMethod): void;
    detectLeaks(duration?: number, threshold?: number, samples?: number): Promise<void>;
    
    analyzeTrend(measurements: number[]): number;
    analyzeMemoryTrend(): MemoryTrend | null;
    calculateLeakSeverity(trend: number): 'low' | 'medium' | 'high' | 'critical';
    
    getCpuUsage(): CpuUsage;
    getMemoryBreakdown(): MemoryBreakdown;
    automaticHeapDump(threshold?: number): void;
    
    getLeakSuggestions(initialHeapSize: number, finalHeapSize: number): string[];
    getPerformanceImpact(): PerformanceImpact;
    checkNodeCompatibility(): void;
    
    checkAlertThresholds(memoryUsage: MemoryUsage): void;
    exportReport(format?: ExportFormat, filePath?: string): Promise<string>;
    convertToCSV(report: any): string;
    calculateAverageMemory(): number;
    getPeakMemory(): { value: number; timestamp: number };
    getStatistics(): MemoryStatistics;
    detectMemoryPressure(): MemoryPressure;

    // Event emitter types
    on(event: 'thresholdExceeded', listener: (memoryUsage: MemoryUsage) => void): this;
    on(event: 'memoryStats', listener: (memoryUsage: MemoryUsage) => void): this;
    on(event: 'cpuStats', listener: (cpuUsage: CpuUsage) => void): this;
    on(event: 'leakDetected', listener: (result: LeakDetectionResult) => void): this;
    on(event: 'heapSnapshot', listener: (filePath: string, automatic: boolean) => void): this;
    on(event: 'memoryTrend', listener: (trend: MemoryTrend) => void): this;
    on(event: 'warningAlert', listener: (alert: AlertInfo) => void): this;
    on(event: 'criticalAlert', listener: (alert: AlertInfo) => void): this;
    on(event: 'gcStats', listener: (gcStats: v8.HeapStatistics) => void): this;
    on(event: 'reportExported', listener: (filePath: string, format: ExportFormat) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'warning', listener: (message: string) => void): this;
    on(event: 'info', listener: (message: string) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
}

export default MemoryMonitor;
