const MemoryMonitor = require("./MemoryMonitor");

const monitor = new MemoryMonitor(200 * 1024 * 1024);

monitor.on("thresholdExceeded", (memoryUsage) => {
    console.log("Memory threshold exceeded:", memoryUsage);
});

monitor.on("memoryStats", (memoryUsage) => {
    console.log("Memory stats:", memoryUsage);
});

monitor.on("cpuStats", (cpuUsage) => {
    console.log("CPU stats:", cpuUsage);
});

monitor.on("heapSnapshot", (filePath, automatic) => {
    console.log(`Heap snapshot ${automatic ? 'automatically ' : ''}saved to ${filePath}`);
});

monitor.on("error", (error) => {
    console.error("Error:", error);
});

monitor.on("leakDetected", (details) => {
    console.log("Leak detected:", details);
});

monitor.on("warning", (message) => {
    console.warn("Warning:", message);
});

monitor.on("info", (message) => {
    console.info("Info:", message);
});

monitor.startMonitoring(10000);
monitor.takeHeapSnapshot();
monitor.detectLeaks();
monitor.checkNodeCompatibility();

setInterval(() => {
    console.log("Memory breakdown:", monitor.getMemoryBreakdown());
    console.log("GC report:", monitor.getGCReport());
    console.log("Performance impact:", monitor.getPerformanceImpact(), "ms");
    monitor.automaticHeapDump(0.8);
}, 30000);

// Example of creating a memory leak for demonstration
const leakyArray = [];
setInterval(() => {
    leakyArray.push(new Array(1000000).fill('leaky'));
}, 1000);