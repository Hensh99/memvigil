# memvigil

A comprehensive Node.js memory management and monitoring library with real-time tracking capabilities.

![npm](https://img.shields.io/npm/dt/memvigil)
![npm version](https://img.shields.io/npm/v/memvigil)
![License](https://img.shields.io/npm/l/memvigil)

## Table of Contents
- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [License](#license)

## Installation

```bash
npm install memvigil
```

## Features
- 🔍 Real-time memory monitoring
- 📊 CPU usage tracking
- 🚨 Automatic leak detection
- 📸 Heap snapshot generation
- ♻️ Garbage collection analysis
- 📈 Performance metrics
- 🎯 Custom threshold alerts

## Quick Start

```javascript
const MemoryMonitor = require('memvigil');

// Initialize with 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

// Set up basic event listeners
monitor.on('thresholdExceeded', (memoryUsage) => {
    console.log('Memory threshold exceeded:', 
        `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
});

monitor.on('leakDetected', (details) => {
    console.log('Memory leak detected:', details.message);
    console.log('Suggestions:', details.suggestions);
});

// Start monitoring with 10-second intervals
monitor.startMonitoring(10000);
```

## Usage Examples

### Basic Monitoring

```javascript
const MemoryMonitor = require('memvigil');

// Initialize with 200MB threshold
const monitor = new MemoryMonitor(200 * 1024 * 1024);

// Start monitoring with 10-second intervals
monitor.startMonitoring(10000);
```

[Rest of the existing usage examples remain the same...]

## Production Best Practices

1. **Appropriate Monitoring Intervals**
   ```javascript
   // Use longer intervals in production
   monitor.startMonitoring(30000); // 30 seconds
   ```

2. **Resource Management**
   ```javascript
   // Clean up old snapshots
   monitor.on('heapSnapshot', (filePath) => {
       // Keep only last 5 snapshots
       cleanupOldSnapshots(5);
   });
   ```

3. **Error Handling**
   ```javascript
   monitor.on('error', (error) => {
       logger.error('Memory monitor error:', error);
   });
   ```

4. **Performance Impact Monitoring**
   ```javascript
   setInterval(() => {
       const impact = monitor.getPerformanceImpact();
       if (impact > 100) { // If overhead exceeds 100ms
           monitor.stopMonitoring();
       }
   }, 60000);
   ```

## License

MIT License - see LICENSE file for details