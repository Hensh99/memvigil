const { EventEmitter } = require('events');
const v8 = require('v8');
const fs = require('fs');
const { exec } = require('child_process');

class MemoryMonitor extends EventEmitter {
    constructor(threshold = 100 * 1024 * 1024) {
        super();
        this.threshold = threshold; // Memory usage threshold in bytes
        this.interval = null; // Interval ID for monitoring
        this.history = []; // Array to store historical memory usage data
    }

    startMonitoring(interval = 5000) {
        // Start monitoring memory usage at the specified interval (default: 5000ms)
        this.interval = setInterval(() => {
            const memoryUsage = process.memoryUsage();
            this.history.push({ timestamp: Date.now(), memoryUsage }); // Store memory usage data

            if (memoryUsage.heapUsed > this.threshold) {
                // Emit an event if memory usage exceeds the threshold
                this.emit('thresholdExceeded', memoryUsage);
            }

            // Emit an event with the current memory usage statistics
            this.emit('memoryStats', memoryUsage);
        }, interval);
    }

    stopMonitoring() {
        // Stop monitoring memory usage
        clearInterval(this.interval);
    }

    takeHeapSnapshot() {
        // Take a heap snapshot and save it to a file
        try {
            const snapshotStream = v8.getHeapSnapshot();
            const filePath = `heap-${Date.now()}.heapsnapshot`;
            snapshotStream.pipe(fs.createWriteStream(filePath));
            this.emit('heapSnapshot', filePath); // Emit an event with the file path
        } catch (error) {
            this.emit('error', error); // Emit an error event if snapshot fails
        }
    }

    detectLeaks() {
        // Placeholder for more advanced leak detection logic
        // Execute a command to inspect the application (for demonstration purposes)
        exec('node --inspect-brk your-app.js', (error, stdout, stderr) => {
            if (error) {
                this.emit('error', error); // Emit an error event if command fails
            } else {
                this.emit('leakDetected', { message: 'Potential memory leak detected', details: stdout });
            }
        });
    }

    getMemoryUsageReport() {
        // Return the stored historical memory usage data
        return this.history;
    }

    clearHistory() {
        // Clear the historical memory usage data
        this.history = [];
    }

    notifyOnThresholdExceeded(notificationMethod) {
        // Send a notification when memory threshold is exceeded using the provided method
        this.on('thresholdExceeded', (memoryUsage) => {
            notificationMethod(`Memory threshold exceeded: ${JSON.stringify(memoryUsage)}`);
        });
    }
}

module.exports = MemoryMonitor;
