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
        for (let i = 0; i < 1000000; i++) {
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
});
