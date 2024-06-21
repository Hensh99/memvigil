const MemoryMonitor = require('../lib/MemoryMonitor');

const monitor = new MemoryMonitor(200 * 1024 * 1024); // Set threshold to 200MB

monitor.on('thresholdExceeded', (memoryUsage) => {
    console.log('Memory threshold exceeded:', memoryUsage);
});

monitor.on('memoryStats', (memoryUsage) => {
    console.log('Memory stats:', memoryUsage);
});

monitor.on('heapSnapshot', (filePath) => {
    console.log(`Heap snapshot saved to ${filePath}`);
});

monitor.on('leakDetected', (info) => {
    console.log('Leak detected:', info);
});

monitor.on('error', (error) => {
    console.error('Error:', error);
});

// Start monitoring
monitor.startMonitoring();

// Optionally, take a heap snapshot after some time
setTimeout(() => {
    monitor.takeHeapSnapshot();
}, 10000);

// Simulate a leak detection check
setTimeout(() => {
    monitor.detectLeaks();
}, 15000);

// Stop monitoring after some time
setTimeout(() => {
    monitor.stopMonitoring();
}, 60000); // Stop after 1 minute
