const assert = require('assert');
const MemoryMonitor = require('../lib/MemoryMonitor');

describe('MemoryMonitor', () => {
    it('should emit memoryStats at intervals', (done) => {
        const monitor = new MemoryMonitor();
        let called = false;

        monitor.on('memoryStats', (stats) => {
            called = true;
            assert(stats.heapUsed > 0);
            monitor.stopMonitoring();
            done();
        });

        monitor.startMonitoring(1000);

        setTimeout(() => {
            if (!called) {
                monitor.stopMonitoring();
                done(new Error('memoryStats event was not emitted'));
            }
        }, 1500);
    });

    it('should emit thresholdExceeded when memory exceeds threshold', (done) => {
        const monitor = new MemoryMonitor(0); // Set low threshold
        monitor.on('thresholdExceeded', (stats) => {
            assert(stats.heapUsed > 0);
            monitor.stopMonitoring();
            done();
        });
        monitor.startMonitoring(1000);
    });

    it('should emit heapSnapshot event when snapshot is taken', (done) => {
        const monitor = new MemoryMonitor();
        monitor.on('heapSnapshot', (filePath) => {
            assert(filePath.includes('heap-'));
            monitor.stopMonitoring();
            done();
        });
        monitor.startMonitoring(1000);
        setTimeout(() => {
            monitor.takeHeapSnapshot();
        }, 500);
    });

    it('should emit leakDetected for placeholder leak detection', (done) => {
        const monitor = new MemoryMonitor();
        monitor.on('leakDetected', (info) => {
            assert(info.message === 'Potential memory leak detected');
            done();
        });
        monitor.detectLeaks();
    });

    it('should handle errors gracefully', (done) => {
        const monitor = new MemoryMonitor();
        monitor.on('error', (error) => {
            assert(error instanceof Error);
            done();
        });
        monitor.takeHeapSnapshot = function () {
            throw new Error('Test error');
        };
        monitor.takeHeapSnapshot();
    });
});
