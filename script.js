
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
    isAnimating: false,
    isTestRunning: false,
    abortController: null,
    
    // Cache for DNS results
    cache: new Map(),
    
    setChart(chart) { this.dnsChart = chart; },
    clear() {
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
            url: this.sanitizeString(server.url || ''),
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
                urlWithParam.searchParams.append('nocache', Date.now().toString());

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
                    mode: (allowCors ? 'cors' : 'no-cors'), 
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

class TableManager {
    constructor(table) {
        if (!table) throw new Error("Table element not found");
        this.table = table;
        this.tbody = table.querySelector('tbody');
        this.rows = new Map(); // Cache rows
        this.currentSort = { columnIndex: null, direction: 1 };
    }
    
    // Secure DOM manipulation to prevent XSS
    createTableRow(server) {
        const row = document.createElement('tr');
        row.className = 'transition-all duration-200';
        
        // Server name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = server.name;
        
        // Speed cells (min, median, avg, max)
        const speedCells = ['min', 'median', 'avg', 'max'].map(metric => {
            const cell = document.createElement('td');
            
            if (server.speed && typeof server.speed[metric] === 'number') {
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
            const cellA = a[0].cells[colIndex]?.textContent?.trim();
            const cellB = b[0].cells[colIndex]?.textContent?.trim();

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
            th.textContent = th.textContent?.replace(/[▲▼]$/, '') || '';
            
            if (idx === activeColumn) {
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

class NotificationManager {
    constructor(containerId) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error("Notification container not found");
        this.container = container;
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
        
        const typeClasses = {
            error: 'notification-error',
            success: 'notification-success',
            info: 'notification-info',
            warning: 'notification-warning'
        };
        
        notification.className += ` ${typeClasses[type] || typeClasses.info}`;
        notification.id = id;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium">${this.sanitizeString(message)}</span>
                <button onclick="window.closeNotification('${id}')" 
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

// Initialize services and managers
const notificationManager = new NotificationManager('notification-container');
const tableManager = new TableManager(document.getElementById('resultsTable'));

// DNS Servers Configuration
const dnsServers = [
  { "name": "Shecan (شکن)", "url": "https://free.shecan.ir/dns-query", "ips": ["178.22.122.100", "185.51.200.2"] },
  { "name": "Begzar (بگذر)", "url": "https://dns.begzar.ir/dns-query", "type": "post", "allowCors": false, "ips": ["185.55.226.26", "185.55.225.25"] },
  { "name": "403.online", "url": "https://dns.403.online/dns-query", "type": "post", "allowCors": false, "ips": ["10.202.10.202", "10.202.10.102"] },
  { "name": "vanillapp", "url": "https://vanillapp.ir/dns-query", "ips": ["10.139.177.21", "10.139.177.22"] },
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
        updateChartWithData(server);
        
        // Show notifications for errors
        if (server.error) {
            notificationManager.show(`Error testing ${server.name}: ${server.error}`, 'error');
        }
    } catch (error) {
        console.error('Error updating result:', error);
        notificationManager.show(`Failed to update result for ${server.name}`, 'error');
    }
}

function updateChartWithData(server) {
    const existingIndex = chartData.findIndex(item => item.name === server.name);
    const serverInfo = {
        name: server.name,
        avg: server.speed && server.speed.avg !== 'Unavailable' ? server.speed.avg : null,
        min: server.speed && server.speed.min !== 'Unavailable' ? server.speed.min : null,
        max: server.speed && server.speed.max !== 'Unavailable' ? server.speed.max : null
    };

    if (existingIndex === -1) {
        chartData.push(serverInfo);
    } else {
        chartData[existingIndex] = serverInfo;
    }

    updateChart();
}

function getPerformanceColor(responseTime, allData, border = false) {
    if (!allData || allData.length === 0) return border ? '#22c55e' : '#22c55e80';
    
    const validTimes = allData.map(d => d.avg).filter(t => t !== null);
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    
    if (minTime === maxTime) return border ? '#22c55e' : '#22c55e80';
    
    const normalized = (responseTime - minTime) / (maxTime - minTime);
    
    let r, g, b;
    if (normalized <= 0.5) {
        r = Math.round(255 * (normalized * 2));
        g = 255;
        b = 0;
    } else {
        r = 255;
        g = Math.round(255 * (2 - normalized * 2));
        b = 0;
    }
    
    const alpha = border ? '' : '80';
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha}`;
}

function updateChart() {
    const chartContainer = document.getElementById('chartContainer');
    const canvas = document.getElementById('dnsChart');
    const ctx = canvas.getContext('2d');
    
    const validData = chartData.filter(item => item.avg !== null).sort((a, b) => a.avg - b.avg);
    
    if (validData.length === 0) return;

    const minHeight = 300;
    const maxHeight = 800;
    const heightPerServer = 35;
    const dynamicHeight = Math.max(minHeight, Math.min(maxHeight, validData.length * heightPerServer + 100));
    
    const container = chartContainer.querySelector('.chart-container');
    container.style.height = `${dynamicHeight}px`;

    chartContainer.classList.remove('hidden');

    if (dnsChart) {
        dnsChart.destroy();
    }

    const minValue = Math.min(...validData.map(item => item.avg));
    const maxValue = Math.max(...validData.map(item => item.avg));
    const scaleMin = Math.max(0, minValue * 0.7);

    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(item => item.name),
            datasets: [{
                label: 'Average Response Time (ms)',
                data: validData.map(item => item.avg),
                backgroundColor: validData.map(item => getPerformanceColor(item.avg, validData)),
                borderColor: validData.map(item => getPerformanceColor(item.avg, validData, true)),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const server = validData[context.dataIndex];
                            return [
                                `Average: ${server.avg.toFixed(2)}ms`,
                                `Min: ${server.min?.toFixed(2) || 'N/A'}ms`,
                                `Max: ${server.max?.toFixed(2) || 'N/A'}ms`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: scaleMin,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0) + 'ms';
                        }
                    }
                },
                y: {
                    title: {
                        display: window.innerWidth >= 768,
                        text: 'DNS Servers (Slowest to Fastest)'
                    },
                    ticks: {
                        maxRotation: 0,
                        font: {
                            size: 11
                        }
                    },
                    categoryPercentage: 0.8,
                    barPercentage: 0.6
                }
            },
            elements: {
                bar: {
                    borderWidth: 1
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 15,
                    bottom: 15
                }
            }
        }
    });
}

function updateBestDNS() {
    const validServers = chartData
        .filter(d => d.avg !== null && d.avg > 0)
        .map(d => {
             const serverConfig = dnsServers.find(s => s.name === d.name);
             return { ...d, ...serverConfig };
        })
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3);
    
    const container = document.getElementById('bestDNSContainer');
    if (!container) return;

    if (validServers.length === 0) {
        container.innerHTML = `
            <div class="mt-8 p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-center">
                <h3 class="text-xl font-bold text-yellow-300 mb-3">No reliable DNS found!</h3>
                <p class="text-gray-300">All DNS servers failed to respond reliably. Try running the test again.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">';
    
    validServers.forEach((server, index) => {
        let rankClass = '';
        let rankLabel = '';
        let rankColor = '';
        
        if (index === 0) {
            rankClass = 'border-yellow-400/50 bg-gradient-to-br from-yellow-400/10 to-transparent';
            rankLabel = '🏆 #1 Gold';
            rankColor = 'text-yellow-400';
        } else if (index === 1) {
            rankClass = 'border-gray-300/50 bg-gradient-to-br from-gray-300/10 to-transparent';
            rankLabel = '🥈 #2 Silver';
            rankColor = 'text-gray-300';
        } else {
            rankClass = 'border-orange-400/50 bg-gradient-to-br from-orange-400/10 to-transparent';
            rankLabel = '🥉 #3 Bronze';
            rankColor = 'text-orange-400';
        }

        const ips = server.ips && server.ips.length > 0 ? server.ips.join(', ') : 'No IP';
        const safeIps = ips.replace(/'/g, "\\'");
        
        html += `
            <div class="relative p-6 rounded-2xl border ${rankClass} transition-transform hover:-translate-y-1 shadow-lg">
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider ${rankColor}">
                    ${rankLabel}
                </div>
                <h3 class="text-lg font-bold text-white mt-4 mb-2 text-center h-8 flex items-center justify-center">${server.name}</h3>
                <div class="text-center mb-4">
                    <span class="text-3xl font-bold ${rankColor}">${server.avg.toFixed(1)}</span>
                    <span class="text-gray-400 text-sm ml-1">ms</span>
                </div>
                <div class="bg-black/30 rounded-lg p-3 mb-4 font-mono text-sm text-gray-300 text-center break-all border border-white/5 min-h-[3rem] flex items-center justify-center">
                    ${ips}
                </div>
                <button onclick="window.copyBestDNS('${safeIps}', this)" 
                        class="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group">
                    <svg class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Copy IPs
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth' });
}

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
        btn.innerHTML = '<span class="inline-flex items-center text-green-400"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!</span>';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        notificationManager.show('Failed to copy IPs. Please try again.', 'error');
    });
}

function sortTable(columnIndex) {
    try {
        tableManager.sort(columnIndex);
    } catch (error) {
        console.error('Error sorting table:', error);
        notificationManager.show('Error sorting table', 'error');
    }
}

async function performDNSTests() {
    if (AppState.isTestRunning) {
        notificationManager.show('Test is already running!', 'warning');
        return;
    }
    
    try {
        // Reset UI
        const checkButton = document.getElementById('checkButton');
        const checkButtonText = document.getElementById('checkButtonText');
        const checkButtonSpinner = document.getElementById('checkButtonSpinner');
        const loadingMessage = document.getElementById('loadingMessage');
        const bestDNSContainer = document.getElementById('bestDNSContainer');
        const chartContainer = document.getElementById('chartContainer');
        
        if (checkButton) checkButton.disabled = true;
        if (checkButtonText) checkButtonText.textContent = 'Testing...';
        if (checkButtonSpinner) checkButtonSpinner.classList.remove('hidden');
        
        if (loadingMessage) {
            loadingMessage.classList.remove('hidden');
            loadingMessage.setAttribute('aria-busy', 'true');
        }
        
        // Clear previous results
        tableManager.clear();
        chartData = []; // Clear chart data
        if (bestDNSContainer) bestDNSContainer.innerHTML = '';
        if (chartContainer) chartContainer.classList.add('hidden');
        
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
        
        updateBestDNS();
        updateChart();
        
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
        const checkButtonText = document.getElementById('checkButtonText');
        const checkButtonSpinner = document.getElementById('checkButtonSpinner');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (checkButton) checkButton.disabled = false;
        if (checkButtonText) checkButtonText.textContent = 'Start DNS Test';
        if (checkButtonSpinner) checkButtonSpinner.classList.add('hidden');
        
        if (loadingMessage) {
            loadingMessage.classList.add('hidden');
            loadingMessage.setAttribute('aria-busy', 'false');
        }
        
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

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        
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
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Wait for transition
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
        
        closeModal('dohModal');
        
    } catch (error) {
        notificationManager.show(`Error: ${error.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {

    // Initialize Particles
    initParticles();

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
        ctaButton.addEventListener('click', shareResults);
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
            const modal = this.closest('.modal-overlay');
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
    });
    
    // Close modals when clicking outside
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    console.log('DoHSpeedTest initialized successfully');
});

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        const speed = Math.random() * 1.5 + 0.5;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 2 + 1;
        this.color = this.getRandomColor();
        this.life = 0;
        this.maxLife = Math.random() * 150 + 100;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    getRandomColor() {
        const colors = [
            `hsl(200, 100%, 70%)`,
            `hsl(220, 100%, 75%)`,
            `hsl(240, 100%, 80%)`,
            `hsl(180, 100%, 70%)`,
            `hsl(160, 100%, 75%)`
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        this.pulsePhase += 0.1;

        if (this.x < -this.radius) this.x = this.canvas.width + this.radius;
        if (this.x > this.canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = this.canvas.height + this.radius;
        if (this.y > this.canvas.height + this.radius) this.y = -this.radius;

        if (this.life >= this.maxLife) {
            this.x = Math.random() * this.canvas.width;
            this.y = Math.random() * this.canvas.height;
            this.life = 0;
        }
    }

    draw(ctx) {
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.3;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulseScale, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3 * pulseScale
        );
        gradient.addColorStop(0, this.color.replace('70%', '90%'));
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = [];
    let animationFrameId = null;
    let isVisible = true;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function checkCollision(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 80;
    }

    function drawConnections() {
        if (!ctx) return;
        ctx.save();
        ctx.lineWidth = 1;
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                if (checkCollision(particles[i], particles[j])) {
                    const distance = Math.sqrt(
                        Math.pow(particles[i].x - particles[j].x, 2) + 
                        Math.pow(particles[i].y - particles[j].y, 2)
                    );
                    
                    const opacity = Math.max(0, 1 - (distance / 80));
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    
                    const gradient = ctx.createLinearGradient(
                        particles[i].x, particles[i].y,
                        particles[j].x, particles[j].y
                    );
                    gradient.addColorStop(0, particles[i].color.replace('70%', '60%'));
                    gradient.addColorStop(1, particles[j].color.replace('70%', '60%'));
                    
                    ctx.strokeStyle = gradient;
                    ctx.globalAlpha = opacity * 0.6;
                    ctx.stroke();

                    const midX = (particles[i].x + particles[j].x) / 2;
                    const midY = (particles[i].y + particles[j].y) / 2;
                    
                    ctx.beginPath();
                    const glowGradient = ctx.createRadialGradient(midX, midY, 0, midX, midY, 30);
                    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.4})`);
                    glowGradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = glowGradient;
                    ctx.fill();
                }
            }
        }
        
        ctx.restore();
    }

    function animate() {
        if (!isVisible || isReducedMotion || !ctx) return;
        
        ctx.fillStyle = 'rgba(12, 12, 12, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw(ctx);
        });

        drawConnections();

        animationFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
        if (!isReducedMotion) {
            particles = [];
            const particleCount = Math.min(100, Math.floor(canvas.width * canvas.height / 8000));
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(canvas));
            }
        }
    });

    if (!isReducedMotion) {
        const particleCount = Math.min(100, Math.floor(canvas.width * canvas.height / 8000));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(canvas));
        }
        animate();
    } else {
        ctx.fillStyle = 'rgba(12, 12, 12, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    document.addEventListener('visibilitychange', function () {
        isVisible = !document.hidden;
        
        if (isVisible && !animationFrameId && !isReducedMotion) {
            animate();
        } else if (!isVisible && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });
}

window.sortTable = sortTable;
window.copyToClipboard = copyToClipboard;
window.copyBestDNS = copyBestDNS;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeNotification = (id) => notificationManager.hide(id);
