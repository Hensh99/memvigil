const { EventEmitter } = require('events');
const v8 = require('v8');
const fs = require('fs');

class MemoryMonitor extends EventEmitter {
    constructor(threshold = 100 * 1024 * 1024) {
        super();
        this.threshold = threshold;
        this.interval = null;
    }

    startMonitoring(interval = 5000) {
        this.interval = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            if (memoryUsage.heapUsed > this.threshold) {
                this.emit('thresholdExceeded', memoryUsage);
            }
            this.emit('memoryStats', memoryUsage);
        }, interval);
    }

    stopMonitoring() {
        clearInterval(this.interval);
    }

    takeHeapSnapshot() {
        try {
            const snapshotStream = v8.getHeapSnapshot();
            const filePath = `heap-${Date.now()}.heapsnapshot`;
            snapshotStream.pipe(fs.createWriteStream(filePath));
            this.emit('heapSnapshot', filePath);
        } catch (error) {
            this.emit('error', error);
        }
    }

    detectLeaks() {
        // Placeholder for more advanced leak detection logic
        this.emit('leakDetected', { message: 'Potential memory leak detected' });
    }
}

module.exports = MemoryMonitor;
