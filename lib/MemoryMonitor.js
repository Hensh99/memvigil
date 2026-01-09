const { EventEmitter } = require('events');
const path = require('path');
const v8 = require('v8');
const fs = require('fs');
const os = require('os');

class MemoryMonitor extends EventEmitter {
    constructor(threshold = 100 * 1024 * 1024, maxHistorySize = 1000, options = {}) { // This represents 100 megabytes (MB) in bytes.
        super();
        if (threshold <= 0) throw new Error('Threshold must be a positive number');
        if (maxHistorySize < 1) throw new Error('Max history size must be at least 1');
        this.threshold = threshold;
        this.maxHistorySize = maxHistorySize;
        this.interval = null;
        this.gcTrackingInterval = null;
        this.history = [];
        this.gcHistory = [];
        this.cpuUsageHistory = [];
        this.lastCpuUsage = process.cpuUsage();
        this.performanceImpact = { time: 0, count: 0 };
        this.enableGC = options.enableGC !== false;
        this.enablePredictions = options.enablePredictions !== false;
        this.alertThresholds = options.alertThresholds || {};
    }

    startMonitoring(interval = 5000) { // 5 Seconds
        if (interval < 1000) throw new Error('Interval must be at least 1000ms');
        
        // Stop existing monitoring if running
        if (this.interval) {
            this.stopMonitoring();
        }

        this.interval = setInterval(() => {
            const start = process.hrtime();

            const memoryUsage = process.memoryUsage();
            const cpuUsage = this.getCpuUsage();

            this.history.push({ timestamp: Date.now(), memoryUsage });
            if (this.history.length > this.maxHistorySize) {
                this.history = this.history.slice(-this.maxHistorySize);
            }
            
            this.cpuUsageHistory.push({ timestamp: Date.now(), cpuUsage });
            if (this.cpuUsageHistory.length > this.maxHistorySize) {
                this.cpuUsageHistory = this.cpuUsageHistory.slice(-this.maxHistorySize);
            }

            // Check threshold
            if (memoryUsage.heapUsed > this.threshold) {
                this.emit('thresholdExceeded', memoryUsage);
            }

            // Check alert thresholds
            this.checkAlertThresholds(memoryUsage);

            // Emit stats
            this.emit('memoryStats', memoryUsage);
            this.emit('cpuStats', cpuUsage);

            // Analyze trends if enabled
            if (this.enablePredictions && this.history.length >= 5) {
                const trend = this.analyzeMemoryTrend();
                if (trend) {
                    this.emit('memoryTrend', trend);
                }
            }

            const end = process.hrtime(start);
            this.updatePerformanceImpact(end);
        }, interval);

        // Start tracking garbage collection
        if (this.enableGC) {
            this.trackGarbageCollection();
        }
    }

    stopMonitoring() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.gcTrackingInterval) {
            clearInterval(this.gcTrackingInterval);
            this.gcTrackingInterval = null;
        }
    }

    checkAlertThresholds(memoryUsage) {
        const heapUsed = memoryUsage.heapUsed;
        
        if (this.alertThresholds.critical && heapUsed > this.alertThresholds.critical) {
            this.emit('criticalAlert', {
                type: 'critical',
                memoryUsage,
                message: `Critical memory threshold exceeded: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`
            });
        } else if (this.alertThresholds.warning && heapUsed > this.alertThresholds.warning) {
            this.emit('warningAlert', {
                type: 'warning',
                memoryUsage,
                message: `Warning: Memory usage high: ${(heapUsed / 1024 / 1024).toFixed(2)}MB`
            });
        }
    }    

    async takeHeapSnapshot(automatic = false) {
        try {
            const diskSpace = await this.checkDiskSpace();
            if (diskSpace < 1024 * 1024 * 100) {
                throw new Error('Insufficient disk space for heap snapshot');
            }
    
            const snapshotStream = v8.getHeapSnapshot();
            const filePath = path.join(os.tmpdir(), `heap-${Date.now()}.heapsnapshot`);
            
            return new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                snapshotStream.on('error', reject);
                writeStream.on('error', reject);
                writeStream.on('finish', () => {
                    this.emit('heapSnapshot', filePath, automatic);
                    resolve(filePath);
                });
                snapshotStream.pipe(writeStream);
            });
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async checkDiskSpace() {
        return new Promise((resolve) => {
            if (process.platform === 'win32') {
                // Windows implementation
                resolve(1024 * 1024 * 1024); // Default to 1GB for Windows
            } else {
                // Unix-like systems
                try {
                    fs.statvfs('/', (err, stats) => {
                        if (err) resolve(1024 * 1024 * 1024); // Default to 1GB
                        else resolve(stats.bavail * stats.bsize);
                    });
                } catch (error) {
                    resolve(1024 * 1024 * 1024); // Default to 1GB on error
                }
            }
        });
    }
    

    getMemoryUsageReport() {
        return [...this.history];
    }

    getCpuUsageReport() {
        return [...this.cpuUsageHistory];
    }

    getGCReport() {
        return [...this.gcHistory];
    }

    clearHistory() {
        this.history = [];
        this.gcHistory = [];
        this.cpuUsageHistory = [];
    }

    notifyOnThresholdExceeded(notificationMethod) {
        this.on('thresholdExceeded', (memoryUsage) => {
            notificationMethod(`Memory threshold exceeded: ${JSON.stringify(memoryUsage)}`);
        });
    }

    detectLeaks(duration = 60000, threshold = 0.1, samples = 5) {
        return new Promise((resolve) => {
            const measurements = [];
            const interval = Math.max(Math.floor(duration / samples), 100);
            let measurementCount = 0;
            
            const measureInterval = setInterval(() => {
                const heapUsed = process.memoryUsage().heapUsed;
                measurements.push(heapUsed);
                measurementCount++;
                
                if (measurementCount >= samples) {
                    clearInterval(measureInterval);
                    const trend = this.analyzeTrend(measurements);
                    if (trend > threshold) {
                        const suggestions = this.getLeakSuggestions(measurements[0], measurements[measurements.length - 1]);
                        const severity = this.calculateLeakSeverity(trend);
                        this.emit('leakDetected', {
                            message: 'Potential memory leak detected',
                            trend,
                            measurements,
                            suggestions,
                            severity
                        });
                    }
                    resolve();
                }
            }, interval);
        });
    }

    analyzeTrend(measurements) {
        if (measurements.length < 2) return 0;
        const start = measurements[0];
        const end = measurements[measurements.length - 1];
        return (end - start) / start;
    }

    calculateLeakSeverity(trend) {
        if (trend >= 0.5) return 'critical';
        if (trend >= 0.3) return 'high';
        if (trend >= 0.15) return 'medium';
        return 'low';
    }

    analyzeMemoryTrend() {
        if (this.history.length < 5) return null;

        const recent = this.history.slice(-10);
        const times = recent.map(h => h.timestamp);
        const values = recent.map(h => h.memoryUsage.heapUsed);

        // Simple linear regression
        const n = recent.length;
        const sumX = times.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = times.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const rate = slope / 1000; // bytes per second

        const currentMemory = values[values.length - 1];
        const prediction = currentMemory + (rate * 3600); // prediction for 1 hour

        let direction;
        if (Math.abs(rate) < 100) {
            direction = 'stable';
        } else {
            direction = rate > 0 ? 'increasing' : 'decreasing';
        }

        return {
            direction,
            rate,
            prediction: Math.max(0, prediction)
        };
    }

    trackGarbageCollection() {
        // Track GC stats periodically
        this.gcTrackingInterval = setInterval(() => {
            const gcStats = v8.getHeapStatistics();
            this.gcHistory.push({
                timestamp: Date.now(),
                gcStats
            });

            if (this.gcHistory.length > this.maxHistorySize) {
                this.gcHistory = this.gcHistory.slice(-this.maxHistorySize);
            }

            this.emit('gcStats', gcStats);
        }, 5000);
    }

    getCpuUsage() {
        const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
        this.lastCpuUsage = process.cpuUsage();
        return currentCpuUsage;
    }

    getMemoryBreakdown() {
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();

        return {
            ...memoryUsage,
            totalSystemMemory: totalMemory,
            freeSystemMemory: freeMemory,
            usedSystemMemory: totalMemory - freeMemory,
            heapUtilization: memoryUsage.heapUsed / memoryUsage.heapTotal,
            systemMemoryUtilization: (totalMemory - freeMemory) / totalMemory
        };
    }

    automaticHeapDump(threshold = 0.9) {
        const memoryUsage = this.getMemoryBreakdown();
        if (memoryUsage.heapUtilization > threshold) {
            this.takeHeapSnapshot(true).catch((error) => {
                this.emit('error', error);
            });
        }
    }

    getLeakSuggestions(initialHeapSize, finalHeapSize) {
        const increase = ((finalHeapSize - initialHeapSize) / initialHeapSize) * 100;
        let suggestions = [
            `Memory increased by ${increase.toFixed(2)}% over the monitored period.`,
            'Consider checking for:',
            '1. Unclosed resources (e.g., file handles, database connections)',
            '2. Accumulating cache or large object stores',
            '3. Event listeners that are not being removed',
            '4. Circular references preventing garbage collection',
            '5. Large arrays or objects that are never cleared',
            '6. Timers or intervals that are not cleared'
        ];
        return suggestions;
    }

    updatePerformanceImpact(hrtime) {
        const nanoseconds = hrtime[0] * 1e9 + hrtime[1];
        this.performanceImpact.time = (this.performanceImpact.time + nanoseconds) % Number.MAX_SAFE_INTEGER;
        this.performanceImpact.count++;
        
        // Reset counters periodically to prevent overflow
        if (this.performanceImpact.count > 1000) {
            this.performanceImpact.time = Math.floor(this.performanceImpact.time / this.performanceImpact.count);
            this.performanceImpact.count = 1;
        }
    }

    getPerformanceImpact() {
        if (this.performanceImpact.count === 0) {
            return { averageTimeMs: 0, totalTimeMs: 0, count: 0 };
        }
        const averageNanoseconds = this.performanceImpact.time / this.performanceImpact.count;
        const averageTimeMs = averageNanoseconds / 1e6;
        const totalTimeMs = (this.performanceImpact.time / 1e6);

        return {
            averageTimeMs,
            totalTimeMs,
            count: this.performanceImpact.count
        };
    }

    checkNodeCompatibility() {
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

        if (majorVersion < 12) {
            this.emit('warning', 'This version of Node.js may not support all features of MemoryMonitor. Please upgrade to Node.js 12 or later for best results.');
        }

        if (majorVersion >= 12 && majorVersion < 14) {
            this.emit('info', 'Using Node.js 12+. All basic features are supported.');
        }

        if (majorVersion >= 14) {
            this.emit('info', 'Using Node.js 14+. All features including advanced heap profiling are fully supported.');
        }
    }

    // New feature: Export reports
    async exportReport(format = 'json', filePath) {
        const report = {
            memoryHistory: this.history,
            cpuHistory: this.cpuUsageHistory,
            gcHistory: this.gcHistory,
            summary: {
                totalSamples: this.history.length,
                averageMemoryUsage: this.calculateAverageMemory(),
                peakMemoryUsage: this.getPeakMemory(),
                currentMemory: process.memoryUsage(),
                performanceImpact: this.getPerformanceImpact()
            },
            exportedAt: new Date().toISOString()
        };

        const finalPath = filePath || path.join(os.tmpdir(), `memvigil-report-${Date.now()}.${format}`);

        if (format === 'json') {
            await fs.promises.writeFile(finalPath, JSON.stringify(report, null, 2), 'utf8');
        } else if (format === 'csv') {
            const csv = this.convertToCSV(report);
            await fs.promises.writeFile(finalPath, csv, 'utf8');
        }

        this.emit('reportExported', finalPath, format);
        return finalPath;
    }

    convertToCSV(report) {
        let csv = 'Timestamp,Heap Used (bytes),Heap Total (bytes),RSS (bytes),External (bytes)\n';
        
        for (const entry of this.history) {
            const { memoryUsage, timestamp } = entry;
            csv += `${timestamp},${memoryUsage.heapUsed},${memoryUsage.heapTotal},${memoryUsage.rss},${memoryUsage.external}\n`;
        }
        
        return csv;
    }

    calculateAverageMemory() {
        if (this.history.length === 0) return 0;
        const sum = this.history.reduce((acc, entry) => acc + entry.memoryUsage.heapUsed, 0);
        return sum / this.history.length;
    }

    getPeakMemory() {
        if (this.history.length === 0) {
            return { value: 0, timestamp: Date.now() };
        }
        
        let peak = this.history[0];
        for (const entry of this.history) {
            if (entry.memoryUsage.heapUsed > peak.memoryUsage.heapUsed) {
                peak = entry;
            }
        }
        
        return {
            value: peak.memoryUsage.heapUsed,
            timestamp: peak.timestamp
        };
    }

    // New feature: Get memory statistics
    getStatistics() {
        const cpuSum = this.cpuUsageHistory.reduce(
            (acc, entry) => ({
                user: acc.user + entry.cpuUsage.user,
                system: acc.system + entry.cpuUsage.system
            }),
            { user: 0, system: 0 }
        );

        return {
            memory: {
                current: process.memoryUsage(),
                average: this.calculateAverageMemory(),
                peak: this.getPeakMemory(),
                trend: this.analyzeMemoryTrend()
            },
            cpu: {
                current: this.getCpuUsage(),
                average: {
                    user: this.cpuUsageHistory.length > 0 ? cpuSum.user / this.cpuUsageHistory.length : 0,
                    system: this.cpuUsageHistory.length > 0 ? cpuSum.system / this.cpuUsageHistory.length : 0
                }
            },
            performance: this.getPerformanceImpact(),
            gc: {
                count: this.gcHistory.length,
                lastUpdate: this.gcHistory.length > 0 ? this.gcHistory[this.gcHistory.length - 1].timestamp : null
            }
        };
    }

    // New feature: Memory pressure detection
    detectMemoryPressure() {
        const breakdown = this.getMemoryBreakdown();
        const factors = [];
        let pressureLevel = 'low';

        // Check heap utilization
        if (breakdown.heapUtilization > 0.9) {
            factors.push(`Heap utilization is ${(breakdown.heapUtilization * 100).toFixed(1)}%`);
            pressureLevel = 'critical';
        } else if (breakdown.heapUtilization > 0.75) {
            factors.push(`Heap utilization is ${(breakdown.heapUtilization * 100).toFixed(1)}%`);
            pressureLevel = pressureLevel === 'low' ? 'high' : pressureLevel;
        }

        // Check system memory
        if (breakdown.systemMemoryUtilization > 0.9) {
            factors.push(`System memory utilization is ${(breakdown.systemMemoryUtilization * 100).toFixed(1)}%`);
            if (pressureLevel !== 'critical') {
                pressureLevel = 'high';
            }
        }

        // Check if over threshold
        if (breakdown.heapUsed > this.threshold) {
            factors.push(`Memory usage exceeds threshold`);
            if (pressureLevel === 'low') pressureLevel = 'medium';
        }

        // Check trend
        const trend = this.analyzeMemoryTrend();
        if (trend && trend.direction === 'increasing' && trend.rate > 10000) {
            factors.push(`Memory is increasing rapidly (${(trend.rate / 1024).toFixed(2)} KB/s)`);
            if (pressureLevel === 'low') pressureLevel = 'medium';
        }

        return {
            isUnderPressure: factors.length > 0,
            pressureLevel,
            factors
        };
    }
}

module.exports = MemoryMonitor;
