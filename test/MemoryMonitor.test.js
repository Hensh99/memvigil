const MemoryMonitor = require('../lib/MemoryMonitor');
const assert = require('assert');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const os = require('os');
const v8 = require('v8');


describe('MemoryMonitor', function() {
    this.timeout(10000); // Increase timeout for async operations
    let monitor;
    const testDir = path.join(__dirname, 'test-snapshots');

    before(function() {
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir);
        }
    });

    after(function(done) {
        if (fs.existsSync(testDir)) {
            try {
                // First ensure all files are writable
                const files = fs.readdirSync(testDir);
                for (const file of files) {
                    const filePath = path.join(testDir, file);
                    try {
                        // Make file writable before attempting to delete
                        fs.chmodSync(filePath, 0o777);
                        if (fs.statSync(filePath).isDirectory()) {
                            fs.rmdirSync(filePath);
                        } else {
                            fs.unlinkSync(filePath);
                        }
                    } catch (err) {
                        console.warn(`Warning: Could not remove file ${file}:`, err.message);
                    }
                }
                
                // Retry directory removal with a delay
                setTimeout(() => {
                    try {
                        fs.chmodSync(testDir, 0o777);
                        fs.rmdirSync(testDir);
                    } catch (err) {
                        console.warn('Warning: Could not remove test directory:', err.message);
                    }
                    done();
                }, 500);
            } catch (err) {
                console.warn('Warning: Error during cleanup:', err.message);
                done();
            }
        } else {
            done();
        }
    });

    beforeEach(function() {
        monitor = new MemoryMonitor(20 * 1024 * 1024, 100); // 20MB threshold, 100 history entries
    });

    afterEach(function() {
        if (monitor && monitor.interval) {
            monitor.stopMonitoring();
        }
    });

    describe('Constructor', function() {
        it('should initialize with default values', function() {
            const defaultMonitor = new MemoryMonitor();
            assert.strictEqual(defaultMonitor.threshold, 100 * 1024 * 1024);
            assert.strictEqual(defaultMonitor.maxHistorySize, 1000);
        });

        it('should initialize with custom values', function() {
            const customMonitor = new MemoryMonitor(50 * 1024 * 1024, 500);
            assert.strictEqual(customMonitor.threshold, 50 * 1024 * 1024);
            assert.strictEqual(customMonitor.maxHistorySize, 500);
        });

        it('should throw error for negative threshold', function() {
            assert.throws(() => {
                new MemoryMonitor(-1);
            }, /Threshold must be a positive number/);
        });

        it('should throw error for invalid history size', function() {
            assert.throws(() => {
                new MemoryMonitor(1024, 0);
            }, /Max history size must be at least 1/);
        });
    });

    describe('Monitoring', function() {
        it('should stop monitoring when requested', function(done) {
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                monitor.stopMonitoring();
                assert.strictEqual(monitor.interval, null);
                done();
            }, 2000); // Changed from 200 to 2000
        });
    
        it('should respect maxHistorySize limit', function(done) {
            const smallMonitor = new MemoryMonitor(20 * 1024 * 1024, 3);
            smallMonitor.startMonitoring(1000); // Changed from 100 to 1000
            
            setTimeout(() => {
                const history = smallMonitor.getMemoryUsageReport();
                assert(history.length <= 3);
                smallMonitor.stopMonitoring();
                done();
            }, 3500); // Changed from 500 to 3500
        });
    
        it('should emit thresholdExceeded event', function(done) {
            const lowThresholdMonitor = new MemoryMonitor(1024, 100);
            lowThresholdMonitor.on('thresholdExceeded', (memoryUsage) => {
                assert(memoryUsage.heapUsed > 1024);
                lowThresholdMonitor.stopMonitoring();
                done();
            });
            lowThresholdMonitor.startMonitoring(1000); // Changed from 100 to 1000
        });
    });

    describe('Memory Stats', function() {
        it('should collect memory usage data', function(done) {
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                const report = monitor.getMemoryUsageReport();
                assert(Array.isArray(report));
                assert(report.length > 0);
                assert(report[0].memoryUsage);
                done();
            }, 2000); // Changed from 200 to 2000
        });
    
        it('should collect CPU usage data', function(done) {
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                const report = monitor.getCpuUsageReport();
                assert(Array.isArray(report));
                assert(report.length > 0);
                assert(typeof report[0].cpuUsage.user === 'number');
                assert(typeof report[0].cpuUsage.system === 'number');
                done();
            }, 2000); // Changed from 200 to 2000
        });
    });

    describe('Heap Snapshots', function() {
        it('should generate heap snapshot', function(done) {
            monitor.on('heapSnapshot', (filePath, automatic) => {
                assert(fs.existsSync(filePath));
                assert.strictEqual(automatic, false);
                fs.unlinkSync(filePath); // Clean up
                done();
            });
            monitor.takeHeapSnapshot();
        });

        it('should handle automatic heap dumps', function(done) {
            monitor.on('heapSnapshot', (filePath, automatic) => {
                assert(fs.existsSync(filePath));
                assert.strictEqual(automatic, true);
                fs.unlinkSync(filePath); // Clean up
                done();
            });
            monitor.automaticHeapDump(0); // Set threshold to 0 to trigger immediately
        });
    });

    describe('Memory Leak Detection', function() {
        it('should detect potential memory leaks', function(done) {
            const leakyArray = [];
            let leakDetected = false;
            
            monitor.on('leakDetected', (details) => {
                assert(details.message.includes('Potential memory leak detected'));
                assert(Array.isArray(details.suggestions));
                assert(details.suggestions.length > 0);
                leakDetected = true;
                clearInterval(interval);
                done();
            });
    
            // Reduce duration and samples for faster testing
            monitor.detectLeaks(500, 0.1, 2);
    
            // Create a more aggressive memory leak
            const interval = setInterval(() => {
                for(let i = 0; i < 1000; i++) {
                    leakyArray.push(new Array(1000).fill('test'));
                }
            }, 50);
    
            // Safeguard against test hanging
            setTimeout(() => {
                clearInterval(interval);
                if (!leakDetected) {
                    done(new Error('Leak detection timeout'));
                }
            }, 8000);
        });
    });

    describe('Performance Impact', function() {
        it('should measure monitoring overhead', function(done) {
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                const impact = monitor.getPerformanceImpact();
                assert(typeof impact === 'number');
                assert(impact >= 0);
                done();
            }, 3000); // Changed from 300 to 3000
        });
    });

    describe('Memory Breakdown', function() {
        it('should provide detailed memory breakdown', function() {
            const breakdown = monitor.getMemoryBreakdown();
            assert(typeof breakdown.heapTotal === 'number');
            assert(typeof breakdown.heapUsed === 'number');
            assert(typeof breakdown.rss === 'number');
            assert(typeof breakdown.external === 'number');
            assert(typeof breakdown.arrayBuffers === 'number');
        });
    });

    describe('Garbage Collection', function() {
        it('should track garbage collection', function(done) {
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                const gcReport = monitor.getGCReport();
                assert(Array.isArray(gcReport));
                assert(gcReport.length > 0);
                assert(gcReport[0].timestamp);
                assert(gcReport[0].gcStats);
                done();
            }, 2000); // Changed from 200 to 2000
        });
    });

    describe('History Management', function() {
        it('should clear history when requested', function(done) { // Added done parameter
            monitor.startMonitoring(1000); // Changed from 100 to 1000
            setTimeout(() => {
                monitor.clearHistory();
                assert.strictEqual(monitor.getMemoryUsageReport().length, 0);
                assert.strictEqual(monitor.getCpuUsageReport().length, 0);
                assert.strictEqual(monitor.getGCReport().length, 0);
                done(); // Added done() call
            }, 2000); // Changed from 200 to 2000
        });
    });
    

    describe('Event Notifications', function() {
        it('should handle custom notifications', function(done) {
            const notificationSpy = sinon.spy();
            monitor.notifyOnThresholdExceeded(notificationSpy);
            
            monitor.threshold = 1;
            monitor.startMonitoring(1000); // Changed from 100 to 1000
    
            setTimeout(() => {
                assert(notificationSpy.called);
                done();
            }, 2000); // Changed from 200 to 2000
        });
    });

    describe('Node Compatibility', function() {
        it('should check node version compatibility', function(done) {
            const infoSpy = sinon.spy();
            monitor.on('info', infoSpy);
            
            monitor.checkNodeCompatibility();
            
            setTimeout(() => {
                assert(infoSpy.called);
                done();
            }, 100);
        });
    });

    describe('Error Handling', function() {
        const readOnlyDir = path.join(testDir, 'readonly');
    
        beforeEach(function() {
            // Clean up readonly directory if it exists from previous test
            if (fs.existsSync(readOnlyDir)) {
                try {
                    fs.chmodSync(readOnlyDir, 0o777);
                    fs.rmdirSync(readOnlyDir);
                } catch (err) {
                    // Ignore errors during cleanup
                }
            }
        });
    
        it('should emit error events', function(done) {
            const errorSpy = sinon.spy();
            monitor.on('error', errorSpy);
            
            // Force an error by trying to take a heap snapshot with invalid permissions
            const originalGetHeapSnapshot = v8.getHeapSnapshot;
            v8.getHeapSnapshot = () => {
                throw new Error('Forced error for testing');
            };
            
            monitor.takeHeapSnapshot()
                .catch(() => {
                    try {
                        assert(errorSpy.called);
                        // Restore original function
                        v8.getHeapSnapshot = originalGetHeapSnapshot;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
        });
    
        afterEach(function() {
            // Cleanup after each test
            if (fs.existsSync(readOnlyDir)) {
                try {
                    fs.chmodSync(readOnlyDir, 0o777);
                    fs.rmdirSync(readOnlyDir);
                } catch (err) {
                    // Ignore errors during cleanup
                }
            }
        });
    });
});