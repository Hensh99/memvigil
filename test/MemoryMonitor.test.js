const MemoryMonitor = require('../lib/MemoryMonitor');
const assert = require('assert');

describe('MemoryMonitor', function () {
    this.timeout(10000); // Increase timeout for async operations

    let monitor;

    beforeEach(() => {
        monitor = new MemoryMonitor(20 * 1024 * 1024); // Set lower threshold for testing
    });

    afterEach(() => {
        monitor.stopMonitoring();
    });

    it('should emit memoryStats event', (done) => {
        monitor.on('memoryStats', (memoryUsage) => {
            assert(memoryUsage.heapUsed !== undefined);
            done();
        });

        monitor.startMonitoring(1000); // Check every 1 second
    });

    it('should emit thresholdExceeded event', (done) => {
        monitor.on('thresholdExceeded', (memoryUsage) => {
            assert(memoryUsage.heapUsed > monitor.threshold);
            done();
        });

        monitor.startMonitoring(1000);

        // Simulate memory usage
        const memoryLeakArray = [];
        for (let i = 0; i < 100000; i++) {
            memoryLeakArray.push({ data: new Array(1000).fill('*') });
        }
    });

    it('should take a heap snapshot', (done) => {
        monitor.on('heapSnapshot', (filePath) => {
            assert(filePath.includes('heap-'));
            done();
        });

        monitor.takeHeapSnapshot();
    });

    it('should return historical memory usage data', (done) => {
        monitor.startMonitoring(1000); // Check every 1 second

        setTimeout(() => {
            const history = monitor.getMemoryUsageReport();
            assert(history.length > 0);
            assert(history[0].memoryUsage.heapUsed !== undefined);
            done();
        }, 2000); // Wait for 2 intervals
    });

    it('should clear historical memory usage data', (done) => {
        monitor.startMonitoring(1000); // Check every 1 second

        setTimeout(() => {
            monitor.clearHistory();
            const history = monitor.getMemoryUsageReport();
            assert(history.length === 0);
            done();
        }, 2000); // Wait for 2 intervals
    });

    it('should notify on threshold exceeded', (done) => {
        monitor.notifyOnThresholdExceeded((message) => {
            assert(message.includes('Memory threshold exceeded'));
            done();
        });

        monitor.startMonitoring(1000);

        // Simulate memory usage
        const memoryLeakArray = [];
        for (let i = 0; i < 1000000; i++) {
            memoryLeakArray.push({ data: new Array(1000).fill('*') });
        }
    });

    it('should detect potential memory leaks', (done) => {
        monitor.on('leakDetected', (details) => {
            assert(details.message.includes('Potential memory leak detected'));
            done();
        });

        // Call detectLeaks to simulate a leak detection
        monitor.detectLeaks();
    });
});
