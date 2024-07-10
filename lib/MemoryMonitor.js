const { EventEmitter } = require('events');
const v8 = require('v8');
const fs = require('fs');
const os = require('os');

class MemoryMonitor extends EventEmitter {
    constructor(threshold = 100 * 1024 * 1024) {
        super();
        this.threshold = threshold;
        this.interval = null;
        this.history = [];
        this.gcHistory = [];
        this.cpuUsageHistory = [];
        this.lastCpuUsage = process.cpuUsage();
        this.performanceImpact = { time: 0, count: 0 };
    }

    startMonitoring(interval = 5000) {
        this.interval = setInterval(() => {
            const start = process.hrtime();

            const memoryUsage = process.memoryUsage();
            const cpuUsage = this.getCpuUsage();

            this.history.push({ timestamp: Date.now(), memoryUsage });
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
        clearInterval(this.interval);
    }

    takeHeapSnapshot(automatic = false) {
        try {
            const snapshotStream = v8.getHeapSnapshot();
            const filePath = `heap-${Date.now()}.heapsnapshot`;
            snapshotStream.pipe(fs.createWriteStream(filePath));
            this.emit('heapSnapshot', filePath, automatic);
        } catch (error) {
            this.emit('error', error);
        }
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

    detectLeaks(duration = 60000) {
        const initialHeapSize = process.memoryUsage().heapUsed;
        setTimeout(() => {
            const finalHeapSize = process.memoryUsage().heapUsed;
            if (finalHeapSize > initialHeapSize * 1.1) { // 10% increase threshold
                const suggestions = this.getLeakSuggestions(initialHeapSize, finalHeapSize);
                this.emit('leakDetected', {
                    message: 'Potential memory leak detected',
                    initialHeapSize,
                    finalHeapSize,
                    suggestions
                });
            }
        }, duration);
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
        this.performanceImpact.time += nanoseconds;
        this.performanceImpact.count++;
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
