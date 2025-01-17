const { EventEmitter } = require('events');
const path = require('path');
const v8 = require('v8');
const fs = require('fs');
const os = require('os');

class MemoryMonitor extends EventEmitter {
    constructor(threshold = 100 * 1024 * 1024, maxHistorySize = 1000) { // This represents 100 megabytes (MB) in bytes.
        //this.setMaxListeners(20); // Set appropriate limit
        super();
        if (threshold <= 0) throw new Error('Threshold must be a positive number');
        if (maxHistorySize < 1) throw new Error('Max history size must be at least 1');
        this.threshold = threshold;
        this.maxHistorySize = maxHistorySize;
        this.interval = null;
        this.history = [];
        this.gcHistory = [];
        this.cpuUsageHistory = [];
        this.lastCpuUsage = process.cpuUsage();
        this.performanceImpact = { time: 0, count: 0 };
    }

    startMonitoring(interval = 5000) { // 5 Seconds
        if (interval < 1000) throw new Error('Interval must be at least 1000ms');
        this.interval = setInterval(() => {
            const start = process.hrtime();

            const memoryUsage = process.memoryUsage();
            const cpuUsage = this.getCpuUsage();

            this.history.push({ timestamp: Date.now(), memoryUsage });
            if (this.history.length > this.maxHistorySize) {
                this.history = this.history.slice(-this.maxHistorySize);
            }
            this.cpuUsageHistory.push({ timestamp: Date.now(), cpuUsage });

            if (memoryUsage.heapUsed > this.threshold) {
                this.emit('thresholdExceeded', memoryUsage);
            }

            this.emit('memoryStats', memoryUsage);
            this.emit('cpuStats', cpuUsage);

            const end = process.hrtime(start);
            this.updatePerformanceImpact(end);
        }, interval);

        // Start tracking garbage collection
        this.trackGarbageCollection();
    }

    stopMonitoring() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
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
                fs.statvfs('/', (err, stats) => {
                    if (err) resolve(1024 * 1024 * 1024); // Default to 1GB
                    else resolve(stats.bavail * stats.bsize);
                });
            }
        });
    }
    

    getMemoryUsageReport() {
        return this.history;
    }

    getCpuUsageReport() {
        return this.cpuUsageHistory;
    }

    getGCReport() {
        return this.gcHistory;
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
                        this.emit('leakDetected', {
                            message: 'Potential memory leak detected',
                            trend,
                            measurements,
                            suggestions
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

    trackGarbageCollection() {
        const gcStats = v8.getHeapStatistics();
        this.gcHistory.push({ timestamp: Date.now(), gcStats });
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
            usedSystemMemory: totalMemory - freeMemory
        };
    }

    automaticHeapDump(threshold = 0.9) {
        const memoryUsage = this.getMemoryBreakdown();
        if (memoryUsage.heapUsed / memoryUsage.heapTotal > threshold) {
            this.takeHeapSnapshot(true);
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
            '4. Circular references preventing garbage collection'
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
        if (this.performanceImpact.count === 0) return 0;
        const averageNanoseconds = this.performanceImpact.time / this.performanceImpact.count;
        return averageNanoseconds / 1e6; // Convert to milliseconds
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
}

module.exports = MemoryMonitor;
