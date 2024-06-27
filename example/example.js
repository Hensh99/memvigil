const MemoryMonitor = require("memvigil");

// Create a new memory monitor with a 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

monitor.on("thresholdExceeded", (memoryUsage) => {
    console.log("Memory threshold exceeded:", memoryUsage);
});

monitor.on("memoryStats", (memoryUsage) => {
    console.log("Memory stats:", memoryUsage);
});

monitor.on("heapSnapshot", (filePath) => {
    console.log(`Heap snapshot saved to ${filePath}`);
});

monitor.on("error", (error) => {
    console.error("Error:", error);
});

monitor.on("leakDetected", (details) => {
    console.log("Leak detected:", details);
});

// Start monitoring with a custom interval of 10 seconds
monitor.startMonitoring(10000);

// Take a heap snapshot manually
monitor.takeHeapSnapshot();

// Detect memory leaks
monitor.detectLeaks();

// Get a report of historical memory usage
const report = monitor.getMemoryUsageReport();
console.log("Memory Usage Report:", report);

// Clear historical memory usage data
monitor.clearHistory();

// Set up a custom notification method for threshold exceeded
monitor.notifyOnThresholdExceeded((message) => {
    console.log("Custom Notification:", message);
});
