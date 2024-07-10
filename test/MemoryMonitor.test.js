const MemoryMonitor = require('../lib/MemoryMonitor');
const assert = require('assert');
const sinon = require('sinon');

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

    it('should emit cpuStats event', (done) => {
        monitor.on('cpuStats', (cpuUsage) => {
            assert(cpuUsage.user !== undefined);
            assert(cpuUsage.system !== undefined);
            done();
        });

        monitor.startMonitoring(1000);
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
        monitor.on('heapSnapshot', (filePath, automatic) => {
            assert(filePath.includes('heap-'));
            assert.strictEqual(automatic, false);
            done();
        });

        monitor.takeHeapSnapshot();
    });

    it('should return historical memory usage data', (done) => {
        monitor.startMonitoring(1000);

        setTimeout(() => {
            const history = monitor.getMemoryUsageReport();
            assert(history.length > 0);
            assert(history[0].memoryUsage.heapUsed !== undefined);
            done();
        }, 2000);
    });

    it('should return historical CPU usage data', (done) => {
        monitor.startMonitoring(1000);

        setTimeout(() => {
            const history = monitor.getCpuUsageReport();
            assert(history.length > 0);
            assert(history[0].cpuUsage.user !== undefined);
            assert(history[0].cpuUsage.system !== undefined);
            done();
        }, 2000);
    });

    it('should clear historical data', (done) => {
        monitor.startMonitoring(1000);

        setTimeout(() => {
            monitor.clearHistory();
            const memoryHistory = monitor.getMemoryUsageReport();
            const cpuHistory = monitor.getCpuUsageReport();
            const gcHistory = monitor.getGCReport();
            assert.strictEqual(memoryHistory.length, 0);
            assert.strictEqual(cpuHistory.length, 0);
            assert.strictEqual(gcHistory.length, 0);
            done();
        }, 2000);
    });

    it('should notify on threshold exceeded', (done) => {
        const notificationMethod = sinon.spy();
        monitor.notifyOnThresholdExceeded(notificationMethod);

        monitor.startMonitoring(1000);

        // Simulate memory usage
        const memoryLeakArray = [];
        for (let i = 0; i < 1000000; i++) {
            memoryLeakArray.push({ data: new Array(1000).fill('*') });
        }

        setTimeout(() => {
            assert(notificationMethod.calledOnce);
            done();
        }, 2000);
    });

    it('should detect potential memory leaks', (done) => {
        monitor.on('leakDetected', (details) => {
            assert(details.message.includes('Potential memory leak detected'));
            assert(details.suggestions.length > 0);
            done();
        });

        monitor.detectLeaks(1000); // Shorter duration for testing

        // Simulate a memory leak
        const leakyArray = [];
        for (let i = 0; i < 1000000; i++) {
            leakyArray.push(new Array(1000).fill('leaky'));
        }
    });

    it('should provide memory breakdown', () => {
        const breakdown = monitor.getMemoryBreakdown();
        assert(breakdown.heapTotal !== undefined);
        assert(breakdown.heapUsed !== undefined);
        assert(breakdown.rss !== undefined);
        assert(breakdown.external !== undefined);
        assert(breakdown.arrayBuffers !== undefined);
        assert(breakdown.totalSystemMemory !== undefined);
        assert(breakdown.freeSystemMemory !== undefined);
        assert(breakdown.usedSystemMemory !== undefined);
    });

    it('should take automatic heap snapshot', (done) => {
        monitor.on('heapSnapshot', (filePath, automatic) => {
            assert(filePath.includes('heap-'));
            assert.strictEqual(automatic, true);
            done();
        });

        monitor.automaticHeapDump(0);  // Set threshold to 0 to ensure it triggers
    });

    it('should track garbage collection', (done) => {
        monitor.startMonitoring(1000);

        setTimeout(() => {
            const gcHistory = monitor.getGCReport();
            assert(gcHistory.length > 0);
            assert(gcHistory[0].gcStats.total_heap_size !== undefined);
            done();
        }, 2000);
    });

    it('should measure performance impact', (done) => {
        monitor.startMonitoring(1000);

        setTimeout(() => {
            const impact = monitor.getPerformanceImpact();
            assert(typeof impact === 'number');
            assert(impact >= 0);
            done();
        }, 2000);
    });

    it('should check Node.js compatibility', (done) => {
        const infoSpy = sinon.spy();
        const warningSpy = sinon.spy();

        monitor.on('info', infoSpy);
        monitor.on('warning', warningSpy);

        monitor.checkNodeCompatibility();

        assert(infoSpy.calledOnce || warningSpy.calledOnce);
        done();
    });
});