// ============== CONFIGURATION & UTILITIES ==============

const Config = {
    timeouts: {
        dnsQuery: 5000,
        connectionRetry: 2000,
        totalTest: 120000
    },
    limits: {
        concurrentQueries: 5,
        maxRetries: 2,
        maxResults: 100
    },
    validation: {
        minHostnameLength: 1,
        maxHostnameLength: 253,
        allowedChars: /^[a-zA-Z0-9.-]+$/
    },
    cache: {
        ttl: 300000 // 5 minutes
    }
};

// Custom Error Classes
class AppError extends Error {
    constructor(message, type = 'general', details = {}) {
        super(message);
        this.type = type;
        this.details = details;
        this.timestamp = new Date();
    }
}

class DNSServiceError extends AppError {
    constructor(serverName, error) {
        super(`DNS test failed for ${serverName}`, 'dns_service', {
            serverName,
            originalError: error.message,
            stack: error.stack
        });
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }
    
    startMeasure(name) {
        this.metrics.set(name, {
            start: performance.now(),
            marks: []
        });
    }
    
    mark(name, label) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.marks.push({
                label,
                time: performance.now()
            });
        }
    }
    
    endMeasure(name) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.duration = performance.now() - metric.start;
            return metric;
        }
    }
    
    getReport() {
        return Object.fromEntries(this.metrics);
    }
}

// Global State Management
const AppState = {
    dnsChart: null,
    chartData: [],
    particles: [],
    isAnimating: false,
    isTestRunning: false,
    abortController: null,
    
    // Cache for DNS results
    cache: new Map(),
    
    setChart(chart) { this.dnsChart = chart; },
    addChartData(data) { this.chartData.push(data); },
    clear() {
        this.chartData = [];
        this.dnsChart = null;
    },
    
    // TTL for cache
    getCache(url, hostname) {
        const key = `${url}:${hostname}`;
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > Config.cache.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.result;
    },
    
    setCache(url, hostname, result) {
        const key = `${url}:${hostname}`;
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }
};

// ============== DNS SERVICE ==============

class DNSService {
    constructor(servers) {
        this.servers = servers;
        this.performanceMonitor = new PerformanceMonitor();
    }
    
    // Input validation
    validateHostname(hostname) {
        if (!hostname || typeof hostname !== 'string') {
            throw new AppError('Invalid hostname provided', 'validation');
        }
        
        if (hostname.length < Config.validation.minHostnameLength || 
            hostname.length > Config.validation.maxHostnameLength) {
            throw new AppError('Hostname length out of bounds', 'validation');
        }
        
        if (!Config.validation.allowedChars.test(hostname)) {
            throw new AppError('Hostname contains invalid characters', 'validation');
        }
        
        // Additional checks for valid hostname
        const parts = hostname.split('.');
        if (parts.length < 2) {
            throw new AppError('Invalid hostname format', 'validation');
        }
        
        return hostname.toLowerCase();
    }
    
    // Sanitize server data to prevent XSS
    sanitizeServerData(server) {
        return {
            name: this.sanitizeString(server.name),
            url: this.sanitizeString(server.url),
            ips: Array.isArray(server.ips) ? server.ips.map(ip => this.sanitizeString(ip)) : [],
            type: server.type || 'post',
            allowCors: Boolean(server.allowCors)
        };
    }
    
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>"'`&]/g, '');
    }
    
    // Build DNS query
    buildDNSQuery(hostname) {
        const domain = this.validateHostname(hostname);
        const buffer = new ArrayBuffer(32);
        const view = new DataView(buffer);
        
        let offset = 0;
        
        // ID (16-bit)
        view.setUint16(offset, Math.floor(Math.random() * 65535), false);
        offset += 2;
        
        // Flags (16-bit)
        view.setUint16(offset, 0x0100, false); // Standard query
        offset += 2;
        
        // Questions (16-bit)
        view.setUint16(offset, 1, false);
        offset += 2;
        
        // Answers, Authority, Additional (all 16-bit, all 0)
        offset += 6;
        
        // Query name
        const labels = domain.split('.');
        for (const label of labels) {
            view.setUint8(offset++, label.length);
            for (let i = 0; i < label.length; i++) {
                view.setUint8(offset++, label.charCodeAt(i));
            }
        }
        view.setUint8(offset++, 0); // End of domain name
        
        // Type A (1)
        view.setUint16(offset, 1, false);
        offset += 2;
        
        // Class IN (1)
        view.setUint16(offset, 1, false);
        offset += 2;
        
        return buffer;
    }
    
    // Core DNS measurement with proper error handling
    async measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
        this.performanceMonitor.startMeasure(`dns_${hostname}`);
        
        // Check cache first
        const cached = AppState.getCache(dohUrl, hostname);
        if (cached) {
            this.performanceMonitor.endMeasure(`dns_${hostname}`);
            return cached;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Config.timeouts.dnsQuery);

        try {
            const startTime = performance.now();

            let response;
            
            if (serverType === 'get') {
                const urlWithParam = new URL(dohUrl);
                urlWithParam.searchParams.append('name', hostname);
                urlWithParam.searchParams.append('type', 'A');
                urlWithParam.searchParams.append('cd', 'true');
                urlWithParam.searchParams.append('nocache', Date.now());

                let fetchOptions = {
                    method: 'GET', 
                    signal: controller.signal,
                    cache: 'no-store'
                };

                if (allowCors) {
                    fetchOptions.headers = {'Accept': 'application/dns-json'};
                } else {
                    fetchOptions.mode = 'no-cors';
                }

                response = await fetch(urlWithParam, fetchOptions);
                
                if (allowCors && !response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const dnsQuery = this.buildDNSQuery(hostname);
                let fetchOptions = {
                    method: 'POST', 
                    body: dnsQuery, 
                    mode: allowCors ? 'cors' : 'no-cors', 
                    signal: controller.signal,
                    cache: 'no-store'
                };

                if (allowCors) {
                    fetchOptions.headers = {'Content-Type': 'application/dns-message'};
                }

                response = await fetch(dohUrl, fetchOptions);
                
                if (allowCors && !response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            clearTimeout(timeoutId);
            const endTime = performance.now();
            const result = endTime - startTime;
            
            // Cache the result
            AppState.setCache(dohUrl, hostname, result);
            
            this.performanceMonitor.mark(`dns_${hostname}`, `success_${result.toFixed(2)}ms`);
            this.performanceMonitor.endMeasure(`dns_${hostname}`);
            
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            this.performanceMonitor.mark(`dns_${hostname}`, `error_${error.message}`);
            this.performanceMonitor.endMeasure(`dns_${hostname}`);
            
            if (error.name === 'AbortError' || error.message.includes('timeout')) {
                throw new DNSServiceError('timeout', error);
            }
            throw new DNSServiceError('network_error', error);
        } finally {
            clearTimeout(timeoutId);
        }
    }
    
    // Test a single server with retries
    async testServer(server, websites, retryCount = 0) {
        const sanitizedServer = this.sanitizeServerData(server);
        
        try {
            const speedResults = [];
            const individualResults = [];
            
            for (let i = 0; i < websites.length; i++) {
                // Check if test was aborted
                if (AppState.abortController?.signal.aborted) {
                    throw new AppError('Test was cancelled', 'cancelled');
                }
                
                try {
                    const result = await this.measureDNSSpeed(
                        sanitizedServer.url, 
                        websites[i], 
                        sanitizedServer.type, 
                        sanitizedServer.allowCors
                    );
                    
                    speedResults.push(result);
                    individualResults.push({
                        website: websites[i],
                        speed: result,
                        success: true
                    });
                } catch (error) {
                    individualResults.push({
                        website: websites[i],
                        speed: null,
                        success: false,
                        error: error.message
                    });
                    
                    if (error instanceof DNSServiceError && error.details.serverName === 'timeout' && retryCount < Config.limits.maxRetries) {
                        // Retry on timeout
                        console.debug(`Retrying ${sanitizedServer.name} for ${websites[i]} (attempt ${retryCount + 1})`);
                        const retryResult = await this.measureDNSSpeed(
                            sanitizedServer.url, 
                            websites[i], 
                            sanitizedServer.type, 
                            sanitizedServer.allowCors
                        );
                        speedResults.push(retryResult);
                        individualResults[individualResults.length - 1] = {
                            website: websites[i],
                            speed: retryResult,
                            success: true,
                            retried: true
                        };
                    } else {
                        speedResults.push(null);
                    }
                }
                
                // Update progress
                updateProgress(i + 1, websites.length, sanitizedServer.name);
            }
            
            const validResults = speedResults.filter(r => typeof r === 'number' && !isNaN(r));
            
            const result = {
                name: sanitizedServer.name,
                url: sanitizedServer.url,
                ips: sanitizedServer.ips,
                speed: validResults.length > 0 ? {
                    min: Math.min(...validResults),
                    max: Math.max(...validResults),
                    avg: validResults.reduce((a, b) => a + b, 0) / validResults.length,
                    median: this.calculateMedian(validResults)
                } : null,
                successRate: (validResults.length / speedResults.length) * 100,
                individualResults,
                serverType: sanitizedServer.type,
                allowCors: sanitizedServer.allowCors
            };
            
            return result;
        } catch (error) {
            if (error instanceof AppError && error.type === 'cancelled') {
                throw error;
            }
            throw new DNSServiceError(sanitizedServer.name, error);
        }
    }
    
    // Calculate median value
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    // Test all servers with concurrency limiting
    async testAllServers(websites) {
        if (AppState.isTestRunning) {
            throw new AppError('Test already running', 'state_error');
        }
        
        AppState.isTestRunning = true;
        AppState.abortController = new AbortController();
        
        try {
            const results = [];
            const errors = [];
            
            // Process servers in batches to limit concurrency
            for (let i = 0; i < this.servers.length; i += Config.limits.concurrentQueries) {
                const batch = this.servers.slice(i, i + Config.limits.concurrentQueries);
                
                const batchPromises = batch.map(async (server) => {
                    try {
                        const result = await this.testServer(server, websites);
                        results.push(result);
                        updateResult(result);
                        return { status: 'success', result };
                    } catch (error) {
                        errors.push({ server: server.name, error: error.message });
                        const errorResult = {
                            name: server.name,
                            url: server.url,
                            ips: server.ips || [],
                            speed: null,
                            successRate: 0,
                            individualResults: [],
                            serverType: server.type || 'post',
                            allowCors: Boolean(server.allowCors),
                            error: error.message
                        };
                        results.push(errorResult);
                        updateResult(errorResult);
                        return { status: 'error', error };
                    }
                });
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Check if test was cancelled
                if (AppState.abortController.signal.aborted) {
                    throw new AppError('Test was cancelled', 'cancelled');
                }
                
                // Small delay between batches to prevent overwhelming the network
                if (i + Config.limits.concurrentQueries < this.servers.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            return { results, errors };
        } finally {
            AppState.isTestRunning = false;
            AppState.abortController = null;
        }
    }
    
    // Cancel running test
    cancel() {
        if (AppState.abortController) {
            AppState.abortController.abort();
        }
    }
}

// ============== TABLE MANAGER ==============

class TableManager {
    constructor(table) {
        this.table = table;
        this.tbody = table.querySelector('tbody');
        this.rows = new Map(); // Cache rows
        this.currentSort = { columnIndex: null, direction: 1 };
    }
    
    // Secure DOM manipulation to prevent XSS
    createTableRow(server) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-600 hover:bg-white hover:bg-opacity-5 transition-colors';
        
        // Server name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'text-left py-2 px-4 text-gray-300';
        nameCell.textContent = server.name;
        
        // Speed cells (min, median, avg, max)
        const speedCells = ['min', 'median', 'avg', 'max'].map(metric => {
            const cell = document.createElement('td');
            cell.className = 'text-center py-2 px-4';
            
            if (server.speed && server.speed[metric]) {
                cell.textContent = server.speed[metric].toFixed(2);
                cell.classList.add('text-green-400');
            } else if (server.error) {
                cell.textContent = 'Error';
                cell.classList.add('text-red-400');
            } else {
                cell.textContent = 'Unavailable';
                cell.classList.add('text-gray-500');
            }
            
            return cell;
        });
        
        row.appendChild(nameCell);
        speedCells.forEach(cell => row.appendChild(cell));
        
        return row;
    }
    
    // Update row with server data
    updateRow(server) {
        const existingRow = Array.from(this.tbody.children).find(
            row => row.children[0]?.textContent === server.name
        );
        
        const newRow = this.createTableRow(server);
        
        if (existingRow) {
            this.tbody.replaceChild(newRow, existingRow);
        } else {
            this.tbody.appendChild(newRow);
        }
    }
    
    // Sort table data efficiently
    sort(columnIndex) {
        const startTime = performance.now();
        
        // Toggle sort direction if same column
        if (this.currentSort.columnIndex === columnIndex) {
            this.currentSort.direction *= -1;
        } else {
            this.currentSort = { columnIndex, direction: 1 };
        }
        
        const { columnIndex: colIndex, direction } = this.currentSort;
        
        // Get all rows including details
        const allRows = Array.from(this.tbody.children);
        const rowPairs = [];
        
        for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            const detailsRow = row.nextElementSibling && 
                row.nextElementSibling.classList.contains('details-row') ? 
                row.nextElementSibling : null;
            rowPairs.push([row, detailsRow]);
        }
        
        // Sort based on column
        rowPairs.sort((a, b) => {
            const cellA = a[0].cells[colIndex]?.textContent.trim();
            const cellB = b[0].cells[colIndex]?.textContent.trim();

            if (!cellA || !cellB) return 0;

            // Handle special cases
            if (cellA === 'Unavailable' && cellB === 'Unavailable') return 0;
            if (cellA === 'Unavailable') return 1;
            if (cellB === 'Unavailable') return -1;
            if (cellA === 'Error' && cellB === 'Error') return 0;
            if (cellA === 'Error') return 1;
            if (cellB === 'Error') return -1;

            const valA = parseFloat(cellA) || 0;
            const valB = parseFloat(cellB) || 0;

            return (valA - valB) * direction;
        });
        
        // Batch DOM updates
        requestAnimationFrame(() => {
            // Clear tbody
            this.tbody.innerHTML = '';
            
            // Re-append rows in sorted order
            rowPairs.forEach(pair => {
                this.tbody.appendChild(pair[0]);
                if (pair[1]) this.tbody.appendChild(pair[1]);
            });
            
            // Update sort indicators
            this.updateSortIndicators(colIndex, direction);
        });
        
        console.log(`Sorting took ${performance.now() - startTime}ms`);
    }
    
    // Update sort arrow indicators
    updateSortIndicators(activeColumn, direction) {
        const headers = Array.from(this.table.querySelectorAll('th'));
        headers.forEach((th, idx) => {
            // Remove existing arrows
            th.textContent = th.textContent.replace(/[▲▼]$/, '');
            
            if (idx === activeColumn) {
                th.textContent += direction === 1 ? ' ▲' : ' ▼';
                th.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
            } else {
                th.setAttribute('aria-sort', 'none');
            }
        });
    }
    
    // Clear all rows
    clear() {
        this.tbody.innerHTML = '';
        this.rows.clear();
        this.currentSort = { columnIndex: null, direction: 1 };
    }
}

// ============== NOTIFICATION SYSTEM ==============

class NotificationManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.notifications = new Map();
        this.maxNotifications = 5;
    }
    
    show(message, type = 'info', duration = 3000) {
        const id = Date.now().toString();
        const notification = this.createNotification(id, message, type);
        
        // Remove oldest notification if limit exceeded
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }
    
    hide(id) {
        const notification = this.notifications.get(id);
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }
    
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.className = `notification p-4 rounded-lg text-white shadow-lg max-w-sm mb-2 transform translate-x-full transition-transform duration-300`;
        
        const baseClasses = 'bg-red-600 border-red-700';
        const typeClasses = {
            error: 'bg-red-600 border-red-700',
            success: 'bg-green-600 border-green-700',
            info: 'bg-blue-600 border-blue-700',
            warning: 'bg-yellow-600 border-yellow-700'
        };
        
        notification.className += ` ${typeClasses[type] || typeClasses.info}`;
        notification.id = id;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium">${this.sanitizeString(message)}</span>
                <button onclick="notificationManager.hide('${id}')" 
                        class="ml-3 text-white hover:text-gray-200" 
                        aria-label="Close notification">×</button>
            </div>
        `;
        
        return notification;
    }
    
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[<>"'`&]/g, '');
    }
}

// ============== APPLICATION LOGIC ==============

// Initialize services and managers
const notificationManager = new NotificationManager('notification-container');
const tableManager = new TableManager(document.getElementById('resultsTable'));

// DNS Servers Configuration
const dnsServers = [
  { "name": "Shecan (شکن)", "url": "https://free.shecan.ir/dns-query", "ips": ["178.22.122.100", "185.51.200.2"] },
  { "name": "Begzar (بگذر)", "url": "https://dns.begzar.ir/dns-query", "type": "post", "allowCors": false, "ips": ["185.55.226.26", "185.55.225.25"] },
  { "name": "403.online", "url": "https://dns.403.online/dns-query", "type": "post", "allowCors": false, "ips": ["10.202.10.202", "10.202.10.102"] },
  { "name": "ZeusDNS", "url":"https://zeusdns.ir/dns-query", "ips": ["37.32.5.60", "37.32.5.61"] },
  { "name": "Radar Game", "url": "https://dns.radar.game/dns-query", "ips": ["10.202.10.10", "10.202.10.11"] },
  { "name": "Electro", "url": "https://dns.electrotm.org/dns-query", "ips": ["78.157.42.100", "78.157.42.101"] },
  { "name": "xStack", "url": "https://rustdns.devefun.org/dns-query", "ips": [] },
  { "name": "AdGuard", "url": "https://dns.adguard-dns.com/dns-query", "ips": ["94.140.14.14", "94.140.15.15"] },
  { "name": "AliDNS", "url": "https://dns.alidns.com/dns-query", "ips": ["223.5.5.5", "223.6.6.6"] },
  { "name": "OpenDNS", "url": "https://doh.opendns.com/dns-query", "ips": ["208.67.222.222", "208.67.220.220"] },
  { "name": "CleanBrowsing", "url": "https://doh.cleanbrowsing.org/doh/family-filter/", "ips": ["185.228.168.9", "185.228.169.9"] },
  { "name": "Cloudflare", "url": "https://cloudflare-dns.com/dns-query", "type": "get", "allowCors": true, "ips": ["1.1.1.1", "1.0.0.1"] },
  { "name": "ControlD", "url": "https://freedns.controld.com/p0", "ips": ["76.76.2.0", "76.223.122.150"] },
  { "name": "DNS.SB", "url": "https://doh.dns.sb/dns-query", "type": "get", "allowCors": true, "ips": ["185.222.222.222", "45.11.45.11"] },
  { "name": "DNSPod", "url": "https://dns.pub/dns-query", "type": "post", "allowCors": false, "ips": ["119.29.29.29", "182.254.116.116"] },
  { "name": "Google", "url": "https://dns.google/resolve", "type": "get", "allowCors": true, "ips": ["8.8.8.8", "8.8.4.4"] },
  { "name": "Mullvad", "url": "https://dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.2"] },
  { "name": "Mullvad Base", "url": "https://base.dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.4"] },
  { "name": "NextDNS", "url": "https://dns.nextdns.io", "type": "get", "ips": ["45.90.28.0", "45.90.30.0"] },
  { "name": "OpenBLD", "url": "https://ada.openbld.net/dns-query", "ips": ["146.112.41.2", "146.112.41.102"] },
  { "name": "DNS0.EU", "url": "https://zero.dns0.eu/", "ips": ["193.110.81.9", "185.253.5.9"] },
  { "name": "Quad9", "url": "https://dns.quad9.net/dns-query", "ips": ["9.9.9.9", "149.112.112.112"] },
  { "name": "360", "url": "https://doh.360.cn/dns-query", "ips": ["101.226.4.6", "180.163.224.54"] },
  { "name": "Canadian Shield", "url": "https://private.canadianshield.cira.ca/dns-query", "ips": ["149.112.121.10", "149.112.122.10"] },
  { "name": "Digitale Gesellschaft", "url": "https://dns.digitale-gesellschaft.ch/dns-query", "ips": ["185.95.218.42", "185.95.218.43"] },
  { "name": "DNS for Family", "url": "https://dns-doh.dnsforfamily.com/dns-query", "ips": ["94.130.180.225", "78.47.64.161"] },
  { "name": "Restena", "url": "https://dnspub.restena.lu/dns-query", "ips": ["158.64.1.29"] },
  { "name": "IIJ", "url": "https://public.dns.iij.jp/dns-query", "ips": ["203.180.164.45", "203.180.166.45"] },
  { "name": "LibreDNS", "url": "https://doh.libredns.gr/dns-query", "ips": ["116.202.176.26", "147.135.76.183"] },
  { "name": "Switch", "url": "https://dns.switch.ch/dns-query", "ips": ["130.59.31.248", "130.59.31.251"] },
  { "name": "Foundation for Applied Privacy", "url": "https://doh.applied-privacy.net/query", "ips": ["146.255.56.98"] },
  { "name": "UncensoredDNS", "url": "https://anycast.uncensoreddns.org/dns-query", "ips": ["91.239.100.100", "89.233.43.71"] },
  { "name": "RethinkDNS", "url": "https://sky.rethinkdns.com/dns-query", "allowCors": false, "ips": ["104.21.83.62", "172.67.214.246"] },
  { "name": "FlashStart (registration required)", "url": "https://doh.flashstart.com/f17c9ee5", "type": "post", "allowCors": false, "ips": ["185.236.104.104"] },
  { "name": "Cloudflare (Security)", "url": "https://security.cloudflare-dns.com/dns-query", "ips": ["1.1.1.2", "1.0.0.2"] },
  { "name": "Cloudflare (Family)", "url": "https://family.cloudflare-dns.com/dns-query", "ips": ["1.1.1.3", "1.0.0.3"] },
  { "name": "OpenDNS (Family)", "url": "https://doh.familyshield.opendns.com/dns-query", "ips": ["208.67.222.123", "208.67.220.123"] },
  { "name": "Cisco Umbrella", "url": "https://doh.umbrella.com/dns-query", "ips": ["208.67.222.222", "208.67.220.220"] },
  { "name": "Mozilla DNS", "url": "https://mozilla.cloudflare-dns.com/dns-query", "ips": ["104.16.248.249", "104.16.249.249"] },
  { "name": "Bitdefender DNS", "url": "https://dns.bitdefender.net/dns-query", "ips": [] },
  { "name": "Yandex (Safe)", "url": "https://safe.dot.dns.yandex.net/dns-query", "ips": ["77.88.8.7", "77.88.8.3"] },
  { "name": "DNS4EU Unfiltered", "url": "https://unfiltered.joindns4.eu/dns-query", "ips": ["86.54.11.100", "86.54.11.200"] },
  { "name": "DNS4EU Protective", "url": "https://protective.joindns4.eu/dns-query", "ips": ["86.54.11.1", "86.54.11.201"] },
  { "name": "AdGuard (Unfiltered)", "url": "https://unfiltered.adguard-dns.com/dns-query", "ips": ["94.140.14.140", "94.140.14.141"] },
  { "name": "NextDNS (Public)", "url": "https://dns.nextdns.io", "ips": ["45.90.28.236", "45.90.30.236"] },
  { "name": "Alternate DNS", "url": "https://dns.alternate-dns.com/dns-query", "ips": ["76.76.19.19", "76.223.122.150"] },
  { "name": "DNS-Low", "url": "https://dnslow.me/dns-query", "ips": [] },
  { "name": "Avast (Default)", "url": "https://secure.avastdns.com/dns-query", "ips": ["8.26.56.26", "8.20.247.20"] },
  { "name": "ComSS", "url": "https://dns.comss.one/dns-query", "ips": ["95.217.205.213"] },
  { "name": "Nord DNS", "url": "https://dns1.nordvpn.com/dns-query", "ips": ["103.86.96.100", "103.86.99.100"] },
  { "name": "Windscribe DNS", "url": "https://windscribe.com/dns-query", "ips": ["10.255.255.3", "10.255.255.2"] },
  { "name": "Wikimedia", "url": "https://wikimedia-dns.org/dns-query", "ips": [] },
  { "name": "SurfShark", "url": "https://dns.surfsharkdns.com/dns-query", "ips": ["162.252.172.5", "146.112.41.2"] },
  { "name": "Smart Guard", "url": "https://dns.smartguard.io/dns-query", "ips": [] },
  { "name": "OpenNIC", "url": "https://doh.opennic.org/dns-query", "ips": [] },
  { "name": "G-Core DNS", "url": "https://dns.gcore.com/dns-query", "ips": ["95.85.95.85", "2.56.220.2"] },
  { "name": "Yandex DNS", "url": "https://dns.yandex.ru/dns-query", "ips": ["77.88.8.8", "77.88.8.1"] },
  { "name": "Verisign Public DNS", "url": null, "ips": ["64.6.64.6", "64.6.65.6"] },
  { "name": "Quad101 (TWNIC)", "url": null, "ips": ["101.101.101.101", "101.102.103.104"] },
  { "name": "114DNS", "url": null, "ips": ["114.114.114.114", "114.114.115.115"] },
  { "name": "Level3 DNS", "url": null, "ips": ["4.2.2.1", "4.2.2.2", "4.2.2.3", "4.2.2.4"] },
  { "name": "Hurricane Electric (HE.net)", "url": null, "ips": ["74.82.42.42"] },
  { "name": "NTT Public DNS", "url": null, "ips": ["129.250.35.250", "129.250.35.251"] },
  { "name": "TREX DNS", "url": null, "ips": ["195.140.195.21", "195.140.195.22"] },
  { "name": "Comodo Secure DNS", "url": "https://doh.comodo.com/dns-query", "type": "get", "allowCors": true, "ips": ["8.26.56.26", "8.20.247.20"] },
  { "name": "SafeDNS", "url": "https://doh.safedns.com/dns-query", "type": "post", "allowCors": false, "ips": ["195.46.39.39", "195.46.39.40"] },
  { "name": "DNS.Watch", "url": "https://resolver.dnswatch.info/dns-query", "type": "get", "allowCors": true, "ips": ["84.200.69.80", "84.200.70.40"] },
  { "name": "CDNetworks Gaming DNS", "url": "https://dns.cdnetworks.com/dns-query", "type": "get", "allowCors": false, "ips": ["153.19.1.1", "153.19.1.2"] },
  { "name": "Control D (Uncensored)", "url": "https://freedns.controld.com/uncensored", "type": "get", "allowCors": true, "ips": ["76.76.2.1", "76.76.10.1"] },
  { "name": "CleanBrowsing (Gaming)", "url": "https://doh.cleanbrowsing.org/doh/gaming-filter/", "type": "post", "allowCors": false, "ips": ["185.228.168.168", "185.228.169.168"] },
  { "name": "Surfshark DNS (Gaming)", "url": "https://dns.surfsharkdns.com/dns-query", "type": "get", "allowCors": false, "ips": ["162.252.172.57", "149.154.159.92"] },
  { "name": "ExpressVPN DNS (Gaming)", "url": "https://dns.expressvpn.com/dns-query", "type": "get", "allowCors": true, "ips": ["208.67.222.222", "208.67.220.220"] },
  { "name": "NordVPN DNS (Gaming)", "url": "https://dns.nordvpn.com/dns-query", "type": "get", "allowCors": false, "ips": ["103.86.96.100", "103.86.99.100"] },
  { "name": "Mullvad DNS (Gaming)", "url": "https://dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.2", "194.242.2.4"] },
  { "name": "NextDNS (Gaming Config)", "url": "https://dns.nextdns.io/gaming", "type": "get", "ips": ["45.90.28.190", "45.90.30.190"] },
  { "name": "OpenNIC (Gaming)", "url": "https://doh.opennic.org/dns-query", "type": "get", "allowCors": true, "ips": ["208.111.2.4", "208.111.2.6"] },
  { "name": "Shatel Users", "url": null, "ips": ["85.15.1.14", "85.15.1.15"] },
  { "name": "Server.ir", "url": null, "ips": ["194.104.158.48", "194.104.158.78"] },
  { "name": "Pars Online", "url": null, "ips": ["46.224.1.221", "46.224.1.220"] },
  { "name": "Hamrah Aval (OpenDNS)", "url": "https://doh.opendns.com/dns-query", "type": "get", "allowCors": true, "ips": ["208.67.220.200"] },
  { "name": "Irancell DNS", "url": null, "ips": ["109.69.8.51"] },
  { "name": "MelliDNS", "url": null, "ips": ["185.51.200.2", "185.51.200.10"] },
  { "name": "Shelter DNS", "url": null, "ips": ["91.92.255.160", "91.92.255.24"] },
  { "name": "Level3 (Alternative)", "url": null, "ips": ["4.2.2.5", "4.2.2.6"] },
  { "name": "Swiss DNS", "url": null, "ips": ["176.10.118.132", "176.10.118.133"] },
  { "name": "Kuwait DNS", "url": null, "ips": ["94.187.170.2", "94.187.170.3"] },
  { "name": "Spain DNS", "url": null, "ips": ["195.235.194.7", "195.235.194.8"] },
  { "name": "Tajikistan DNS", "url": null, "ips": ["45.81.37.0", "45.81.37.1"] },
  { "name": "FutureDNS", "url": null, "ips": [], "note": "QUIC: quic://dns.futuredns.me" },
  { "name": "DandelionSprout", "url": null, "ips": [], "note": "QUIC: quic://dandelionsprout.asuscomm.com:48582" }
];

const dnsService = new DNSService(dnsServers);
let topWebsites = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'];
let dnsChart;
let chartData = [];

// ============== UI UPDATE FUNCTIONS ==============

function updateProgress(current, total, serverName) {
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingText = document.getElementById('loadingText');
    const progressFill = document.getElementById('progressFill');
    
    if (loadingMessage && loadingText && progressFill) {
        const percentage = Math.round((current / total) * 100);
        loadingText.textContent = `Testing ${serverName}... (${current}/${total}) - ${percentage}%`;
        progressFill.style.width = `${percentage}%`;
        
        // Update progress bar aria attributes
        progressFill.setAttribute('aria-valuenow', percentage.toString());
        progressFill.setAttribute('aria-valuetext', `${percentage}% complete`);
    }
}

function updateResult(server) {
    try {
        tableManager.updateRow(server);
        
        // Update chart if available
        if (dnsChart && server.speed && typeof server.speed.avg === 'number') {
            updateChart(server);
        }
        
        // Show notifications for errors
        if (server.error) {
            notificationManager.show(`Error testing ${server.name}: ${server.error}`, 'error');
        }
    } catch (error) {
        console.error('Error updating result:', error);
        notificationManager.show(`Failed to update result for ${server.name}`, 'error');
    }
}

function updateChart(server) {
    if (!dnsChart || !server.speed) return;
    
    const existingData = dnsChart.data.datasets[0].data;
    const existingLabels = dnsChart.data.labels;
    
    const existingIndex = existingLabels.indexOf(server.name);
    
    if (existingIndex >= 0) {
        existingData[existingIndex] = server.speed.avg;
    } else {
        dnsChart.data.labels.push(server.name);
        dnsChart.data.datasets[0].data.push(server.speed.avg);
    }
    
    dnsChart.update('none');
}

function updateBestDNS() {
    const resultsTable = document.getElementById('resultsTable');
    const tbody = resultsTable.querySelector('tbody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr:not(.details-row)'));
    const validServers = rows
        .map(row => {
            const name = row.children[0]?.textContent;
            const avg = parseFloat(row.children[3]?.textContent);
            const server = dnsServers.find(s => s.name === name);
            return server && !isNaN(avg) ? { ...server, avgSpeed: avg } : null;
        })
        .filter(Boolean);
    
    const bestDNSContainer = document.getElementById('bestDNSContainer');
    
    if (validServers.length === 0) {
        bestDNSContainer.innerHTML = `
            <div class="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-3">No reliable DNS found!</h3>
                <p class="text-gray-700 dark:text-gray-300 mb-4">All DNS servers failed to respond reliably. Try running the test again.</p>
            </div>
        `;
        return;
    }
    
    validServers.sort((a, b) => a.avgSpeed - b.avgSpeed);
    const best = validServers[0];
    const ips = best.ips && best.ips.length > 0 ? best.ips.join(', ') : 'No IP available';
    
    bestDNSContainer.innerHTML = `
        <div class="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">Best DNS for you:</h3>
            <p class="font-mono text-lg mb-3"><strong>${best.name}</strong></p>
            <p class="font-mono text-gray-700 dark:text-gray-300 mb-4 break-all">${ips}</p>
            <button onclick="copyBestDNS('${ips.replace(/'/g, "\\'")}', this)" 
                    class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Copy IPs
            </button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Use these IPs in your network, router, or game settings.</p>
        </div>
    `;
    
    bestDNSContainer.scrollIntoView({ behavior: 'smooth' });
}

// ============== COPY FUNCTIONS (SECURE) ==============

function copyToClipboard(text, buttonElement) {
    try {
        const sanitizedText = String(text).replace(/[<>]/g, '');
        navigator.clipboard.writeText(sanitizedText).then(() => {
            buttonElement.classList.add('copied');
            buttonElement.disabled = true;
            
            const originalHTML = buttonElement.innerHTML;
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="mr-1">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Copied!
            `;

            setTimeout(() => {
                buttonElement.classList.remove('copied');
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => {
            console.error('Error in copying text: ', err);
            notificationManager.show('Failed to copy to clipboard', 'error');
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="mr-1">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Error
            `;
            setTimeout(() => {
                buttonElement.innerHTML = originalHTML;
            }, 2000);
        });
    } catch (error) {
        notificationManager.show('Copy function error', 'error');
    }
}

function copyBestDNS(ips, btn) {
    const safeIPs = String(ips).replace(/[<>"'`&]/g, '');
    navigator.clipboard.writeText(safeIPs).then(() => {
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!</span>';
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-green-800');
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('bg-green-800');
            btn.classList.add('bg-green-600');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        notificationManager.show('Failed to copy IPs. Please try again.', 'error');
        
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="inline-flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>Error</span>';
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-red-600');
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('bg-red-600');
            btn.classList.add('bg-green-600');
        }, 3000);
    });
}

// ============== CHART FUNCTIONS ==============

function showChart() {
    const chartContainer = document.getElementById('chartContainer');
    const chartCanvas = document.getElementById('dnsChart');
    
    if (!chartContainer || !chartCanvas) return;
    
    chartContainer.classList.remove('hidden');
    
    // Destroy existing chart if any
    if (dnsChart) {
        dnsChart.destroy();
    }
    
    // Collect data from table
    const table = document.getElementById('resultsTable');
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.details-row)'));
    
    const chartData = rows.map(row => {
        const name = row.children[0]?.textContent;
        const avg = parseFloat(row.children[3]?.textContent);
        return { name, avg: !isNaN(avg) ? avg : 0 };
    }).filter(item => item.avg > 0);
    
    chartData.sort((a, b) => b.avg - a.avg);
    
    dnsChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: chartData.map(item => item.name),
            datasets: [{
                label: 'Average Response Time (ms)',
                data: chartData.map(item => item.avg),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return value + ' ms';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Scroll to chart
    chartContainer.scrollIntoView({ behavior: 'smooth' });
}

// ============== SORTING FUNCTION ==============

function sortTable(columnIndex) {
    try {
        tableManager.sort(columnIndex);
    } catch (error) {
        console.error('Error sorting table:', error);
        notificationManager.show('Error sorting table', 'error');
    }
}

// ============== MAIN TESTING FUNCTIONS ==============

async function performDNSTests() {
    if (AppState.isTestRunning) {
        notificationManager.show('Test is already running!', 'warning');
        return;
    }
    
    try {
        // Reset UI
        const checkButton = document.getElementById('checkButton');
        const loadingMessage = document.getElementById('loadingMessage');
        const resultsTable = document.getElementById('resultsTable');
        const bestDNSContainer = document.getElementById('bestDNSContainer');
        const chartContainer = document.getElementById('chartContainer');
        
        checkButton.disabled = true;
        checkButton.innerHTML = `
            <svg class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Testing...
        `;
        
        loadingMessage.classList.remove('hidden');
        loadingMessage.setAttribute('aria-busy', 'true');
        
        // Clear previous results
        tableManager.clear();
        bestDNSContainer.innerHTML = '';
        chartContainer.classList.add('hidden');
        
        if (dnsChart) {
            dnsChart.destroy();
            dnsChart = null;
        }
        
        // Start the test
        notificationManager.show('Starting DNS speed test...', 'info');
        
        const startTime = performance.now();
        const { results, errors } = await dnsService.testAllServers(topWebsites);
        const endTime = performance.now();
        
        // Show summary
        const successCount = results.filter(r => r.speed).length;
        const errorCount = errors.length;
        
        notificationManager.show(
            `Test completed! ${successCount} servers successful, ${errorCount} errors. Took ${((endTime - startTime) / 1000).toFixed(1)}s`,
            'success'
        );
        
        // Show chart button if we have data
        if (successCount > 0) {
            const chartButton = document.getElementById('cta');
            chartButton.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Show Chart
            `;
        }
        
        updateBestDNS();
        
    } catch (error) {
        console.error('Test error:', error);
        
        if (error instanceof AppError && error.type === 'cancelled') {
            notificationManager.show('Test was cancelled', 'warning');
        } else {
            notificationManager.show(`Test failed: ${error.message}`, 'error');
        }
    } finally {
        // Reset UI
        const checkButton = document.getElementById('checkButton');
        const loadingMessage = document.getElementById('loadingMessage');
        
        checkButton.disabled = false;
        checkButton.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>Start DNS Test</span>
        `;
        
        loadingMessage.classList.add('hidden');
        loadingMessage.setAttribute('aria-busy', 'false');
        
        // Show performance report
        const perfReport = dnsService.performanceMonitor.getReport();
        console.log('Performance Report:', perfReport);
    }
}

function cancelTest() {
    try {
        dnsService.cancel();
        notificationManager.show('Test cancellation requested', 'info');
    } catch (error) {
        console.error('Error cancelling test:', error);
        notificationManager.show('Error cancelling test', 'error');
    }
}

// ============== MODAL FUNCTIONS ==============

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // Focus first input for accessibility
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Escape key to close
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeModal(modalId);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function addHostname() {
    const input = document.getElementById('newWebsite');
    const hostname = input.value.trim();
    
    try {
        const validatedHostname = dnsService.validateHostname(hostname);
        
        if (topWebsites.includes(validatedHostname)) {
            notificationManager.show('Hostname already exists', 'warning');
            return;
        }
        
        topWebsites.push(validatedHostname);
        updateWebsiteList();
        input.value = '';
        notificationManager.show(`Added ${validatedHostname}`, 'success');
    } catch (error) {
        notificationManager.show(`Invalid hostname: ${error.message}`, 'error');
    }
}

function removeHostname(hostname) {
    const index = topWebsites.indexOf(hostname);
    if (index > -1) {
        topWebsites.splice(index, 1);
        updateWebsiteList();
        notificationManager.show(`Removed ${hostname}`, 'info');
    }
}

function updateWebsiteList() {
    const websiteList = document.getElementById('websiteList');
    if (!websiteList) return;
    
    websiteList.innerHTML = '';
    
    topWebsites.forEach(hostname => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-white bg-opacity-10 p-2 rounded';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = hostname;
        nameSpan.className = 'text-white';
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'text-red-400 hover:text-red-300 px-2 py-1 rounded';
        removeBtn.onclick = () => removeHostname(hostname);
        
        li.appendChild(nameSpan);
        li.appendChild(removeBtn);
        websiteList.appendChild(li);
    });
}

function suggestDoHServer() {
    const nameInput = document.getElementById('newDoHName');
    const urlInput = document.getElementById('newDoHUrl');
    const ipsInput = document.getElementById('newDoHIPs');
    
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const ips = ipsInput.value.trim();
    
    try {
        if (!name || !url) {
            throw new Error('Name and URL are required');
        }
        
        // Basic URL validation
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(url)) {
            throw new Error('Please provide a valid HTTP/HTTPS URL');
        }
        
        const suggestion = `DNS Server Suggestion:
        
Name: ${dnsService.sanitizeString(name)}
URL: ${dnsService.sanitizeString(url)}
IPs: ${ips ? ips.split(',').map(ip => ip.trim()).filter(Boolean).join(', ') : 'Not provided'}

Please review and consider adding this DNS server to the testing list.`;
        
        const githubUrl = 'https://github.com/Argh94/DoHSpeedTest/issues/new?title=' + 
                         encodeURIComponent(`DNS Server Suggestion: ${name}`) + 
                         '&body=' + encodeURIComponent(suggestion);
        
        window.open(githubUrl, '_blank');
        
        notificationManager.show('Opening GitHub to submit suggestion...', 'info');
        
        // Clear form
        nameInput.value = '';
        urlInput.value = '';
        ipsInput.value = '';
        
    } catch (error) {
        notificationManager.show(`Error: ${error.message}`, 'error');
    }
}

// ============== SHARE FUNCTIONS ==============

async function shareResults() {
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'DoHSpeedTest - Fastest DNS Tool',
                text: 'Find the fastest DNS server for your location with DoHSpeedTest!',
                url: window.location.href
            });
            notificationManager.show('Thanks for sharing!', 'success');
        } else {
            // Fallback: copy URL to clipboard
            await navigator.clipboard.writeText(window.location.href);
            notificationManager.show('URL copied to clipboard!', 'success');
        }
    } catch (error) {
        console.error('Share error:', error);
        notificationManager.show('Share failed', 'error');
    }
}

// ============== EVENT LISTENERS ==============

document.addEventListener('DOMContentLoaded', function() {
    // Main test button
    const checkButton = document.getElementById('checkButton');
    if (checkButton) {
        checkButton.addEventListener('click', function() {
            if (AppState.isTestRunning) {
                cancelTest();
            } else {
                performDNSTests();
            }
        });
    }
    
    // Edit hosts button
    const editButton = document.getElementById('editButton');
    if (editButton) {
        editButton.addEventListener('click', () => {
            updateWebsiteList();
            openModal('websiteModal');
        });
    }
    
    // Suggest DNS button
    const editDoHButton = document.getElementById('editDoHButton');
    if (editDoHButton) {
        editDoHButton.addEventListener('click', () => openModal('dohModal'));
    }
    
    // Chart/Share button
    const ctaButton = document.getElementById('cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            if (dnsChart) {
                showChart();
            } else {
                shareResults();
            }
        });
    }
    
    // Add hostname button
    const addButton = document.getElementById('addHostname');
    if (addButton) {
        addButton.addEventListener('click', addHostname);
        
        // Enter key to add hostname
        const hostnameInput = document.getElementById('newWebsite');
        if (hostnameInput) {
            hostnameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addHostname();
                }
            });
        }
    }
    
    // Suggest DoH server button
    const suggestButton = document.getElementById('suggestDoHServer');
    if (suggestButton) {
        suggestButton.addEventListener('click', suggestDoHServer);
    }
    
    // Modal close handlers
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.fixed');
            if (modal) {
                closeModal(modal.id);
            }
        });
        
        // Keyboard support for close buttons
        btn.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Keyboard accessibility for table headers
    const headers = document.querySelectorAll('#resultsTable th[onclick]');
    headers.forEach((header, index) => {
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sortTable(index);
            }
        });
        
        // Add tabindex for keyboard navigation
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.setAttribute('aria-label', `Sort by ${header.textContent}`);
    });
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('[id$="Modal"]');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Performance logging
    console.log('DoHSpeedTest initialized successfully');
    console.log('Configuration:', Config);
    
    // Add service worker registration if available
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});

// ============== ERROR HANDLING ==============

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    notificationManager.show(`Unexpected error: ${e.error?.message || 'Unknown error'}`, 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    notificationManager.show(`Async error: ${e.reason?.message || 'Unknown async error'}`, 'error');
});

// ============== EXPORT FOR GLOBAL ACCESS ==============

// Make functions available globally for HTML onclick handlers
window.sortTable = sortTable;
window.copyToClipboard = copyToClipboard;
window.copyBestDNS = copyBestDNS;
window.openModal = openModal;
window.closeModal = closeModal;
