// === Improved DNS Speed Test Script ===
// Enhanced with better error handling, CORS fallback, and XSS protection

// === Global Variables ===
const checkButton = document.getElementById('checkButton');
const editButton = document.getElementById('editButton');
const topWebsites = [
    'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 
    'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 
    'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'
];

// Enhanced DNS Servers with better metadata
const dnsServers = [
    { "name": "Shecan (شکن)", "url": "https://free.shecan.ir/dns-query", "ips": ["178.22.122.100", "185.51.200.2"], "region": "IR" },
    { "name": "Begzar (بگذر)", "url": "https://dns.begzar.ir/dns-query", "type": "post", "allowCors": false, "ips": ["185.55.226.26", "185.55.225.25"], "region": "IR" },
    { "name": "403.online", "url": "https://dns.403.online/dns-query", "type": "post", "allowCors": false, "ips": ["10.202.10.202", "10.202.10.102"], "region": "IR" },
    { "name": "Radar Game", "url": "https://dns.radar.game/dns-query", "ips": ["10.202.10.10", "10.202.10.11"], "region": "IR" },
    { "name": "Electro", "url": "https://dns.electrotm.org/dns-query", "ips": ["78.157.42.100", "78.157.42.101"], "region": "IR" },
    { "name": "xStack", "url": "https://rustdns.devefun.org/dns-query", "ips": [], "region": "IR" },
    { "name": "AdGuard", "url": "https://dns.adguard-dns.com/dns-query", "ips": ["94.140.14.14", "94.140.15.15"], "region": "Global" },
    { "name": "AliDNS", "url": "https://dns.alidns.com/dns-query", "ips": ["223.5.5.5", "223.6.6.6"], "region": "CN" },
    { "name": "OpenDNS", "url": "https://doh.opendns.com/dns-query", "ips": ["208.67.222.222", "208.67.220.220"], "region": "Global" },
    { "name": "CleanBrowsing", "url": "https://doh.cleanbrowsing.org/doh/family-filter/", "ips": ["185.228.168.9", "185.228.169.9"], "region": "Global" },
    { "name": "Cloudflare", "url": "https://cloudflare-dns.com/dns-query", "type": "get", "allowCors": true, "ips": ["1.1.1.1", "1.0.0.1"], "region": "Global" },
    { "name": "ControlD", "url": "https://freedns.controld.com/p0", "ips": ["76.76.2.0", "76.223.122.150"], "region": "Global" },
    { "name": "DNS.SB", "url": "https://doh.dns.sb/dns-query", "type": "get", "allowCors": true, "ips": ["185.222.222.222", "45.11.45.11"], "region": "Global" },
    { "name": "DNSPod", "url": "https://dns.pub/dns-query", "type": "post", "allowCors": false, "ips": ["119.29.29.29", "182.254.116.116"], "region": "CN" },
    { "name": "Google", "url": "https://dns.google/resolve", "type": "get", "allowCors": true, "ips": ["8.8.8.8", "8.8.4.4"], "region": "Global" },
    { "name": "Mullvad", "url": "https://dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.2"], "region": "SE" },
    { "name": "Mullvad Base", "url": "https://base.dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.4"], "region": "SE" },
    { "name": "NextDNS", "url": "https://dns.nextdns.io", "type": "get", "ips": ["45.90.28.0", "45.90.30.0"], "region": "Global" },
    { "name": "OpenBLD", "url": "https://ada.openbld.net/dns-query", "ips": ["146.112.41.2", "146.112.41.102"], "region": "Global" },
    { "name": "DNS0.EU", "url": "https://zero.dns0.eu/", "ips": ["193.110.81.9", "185.253.5.9"], "region": "EU" },
    { "name": "Quad9", "url": "https://dns.quad9.net/dns-query", "ips": ["9.9.9.9", "149.112.112.112"], "region": "Global" },
    { "name": "360", "url": "https://doh.360.cn/dns-query", "ips": ["101.226.4.6", "180.163.224.54"], "region": "CN" },
    { "name": "Canadian Shield", "url": "https://private.canadianshield.cira.ca/dns-query", "ips": ["149.112.121.10", "149.112.122.10"], "region": "CA" },
    { "name": "Digitale Gesellschaft", "url": "https://dns.digitale-gesellschaft.ch/dns-query", "ips": ["185.95.218.42", "185.95.218.43"], "region": "CH" },
    { "name": "DNS for Family", "url": "https://dns-doh.dnsforfamily.com/dns-query", "ips": ["94.130.180.225", "78.47.64.161"], "region": "DE" },
    { "name": "Restena", "url": "https://dnspub.restena.lu/dns-query", "ips": ["158.64.1.29"], "region": "LU" },
    { "name": "IIJ", "url": "https://public.dns.iij.jp/dns-query", "ips": ["203.180.164.45", "203.180.166.45"], "region": "JP" },
    { "name": "LibreDNS", "url": "https://doh.libredns.gr/dns-query", "ips": ["116.202.176.26", "147.135.76.183"], "region": "GR" },
    { "name": "Switch", "url": "https://dns.switch.ch/dns-query", "ips": ["130.59.31.248", "130.59.31.251"], "region": "CH" },
    { "name": "Foundation for Applied Privacy", "url": "https://doh.applied-privacy.net/query", "ips": ["146.255.56.98"], "region": "AT" },
    { "name": "UncensoredDNS", "url": "https://anycast.uncensoreddns.org/dns-query", "ips": ["91.239.100.100", "89.233.43.71"], "region": "DK" },
    { "name": "RethinkDNS", "url": "https://sky.rethinkdns.com/dns-query", "allowCors": false, "ips": ["104.21.83.62", "172.67.214.246"], "region": "Global" },
    { "name": "FlashStart", "url": "https://doh.flashstart.com/f17c9ee5", "type": "post", "allowCors": false, "ips": ["185.236.104.104"], "region": "IT" },
    { "name": "Cloudflare (Security)", "url": "https://security.cloudflare-dns.com/dns-query", "ips": ["1.1.1.2", "1.0.0.2"], "region": "Global" },
    { "name": "Cloudflare (Family)", "url": "https://family.cloudflare-dns.com/dns-query", "ips": ["1.1.1.3", "1.0.0.3"], "region": "Global" },
    { "name": "OpenDNS (Family)", "url": "https://doh.familyshield.opendns.com/dns-query", "ips": ["208.67.222.123", "208.67.220.123"], "region": "Global" },
    { "name": "Cisco Umbrella", "url": "https://doh.umbrella.com/dns-query", "ips": ["208.67.222.222", "208.67.220.220"], "region": "Global" },
    { "name": "Mozilla DNS", "url": "https://mozilla.cloudflare-dns.com/dns-query", "ips": ["104.16.248.249", "104.16.249.249"], "region": "Global" },
    { "name": "Bitdefender DNS", "url": "https://dns.bitdefender.net/dns-query", "ips": [], "region": "Global" },
    { "name": "Yandex (Safe)", "url": "https://safe.dot.dns.yandex.net/dns-query", "ips": ["77.88.8.7", "77.88.8.3"], "region": "RU" },
    { "name": "DNS4EU Unfiltered", "url": "https://unfiltered.joindns4.eu/dns-query", "ips": ["86.54.11.100", "86.54.11.200"], "region": "EU" },
    { "name": "DNS4EU Protective", "url": "https://protective.joindns4.eu/dns-query", "ips": ["86.54.11.1", "86.54.11.201"], "region": "EU" },
    { "name": "AdGuard (Unfiltered)", "url": "https://unfiltered.adguard-dns.com/dns-query", "ips": ["94.140.14.140", "94.140.14.141"], "region": "Global" },
    { "name": "NextDNS (Public)", "url": "https://dns.nextdns.io", "ips": ["45.90.28.236", "45.90.30.236"], "region": "Global" },
    { "name": "Alternate DNS", "url": "https://dns.alternate-dns.com/dns-query", "ips": ["76.76.19.19", "76.223.122.150"], "region": "Global" },
    { "name": "DNS-Low", "url": "https://dnslow.me/dns-query", "ips": [], "region": "Global" },
    { "name": "Avast (Default)", "url": "https://secure.avastdns.com/dns-query", "ips": ["8.26.56.26", "8.20.247.20"], "region": "Global" },
    { "name": "ComSS", "url": "https://dns.comss.one/dns-query", "ips": ["95.217.205.213"], "region": "RU" },
    { "name": "Nord DNS", "url": "https://dns1.nordvpn.com/dns-query", "ips": ["103.86.96.100", "103.86.99.100"], "region": "Global" },
    { "name": "Windscribe DNS", "url": "https://windscribe.com/dns-query", "ips": ["10.255.255.3", "10.255.255.2"], "region": "Global" },
    { "name": "Wikimedia", "url": "https://wikimedia-dns.org/dns-query", "ips": [], "region": "Global" },
    { "name": "SurfShark", "url": "https://dns.surfsharkdns.com/dns-query", "ips": ["162.252.172.5", "146.112.41.2"], "region": "Global" },
    { "name": "Smart Guard", "url": "https://dns.smartguard.io/dns-query", "ips": [], "region": "Global" },
    { "name": "OpenNIC", "url": "https://doh.opennic.org/dns-query", "ips": [], "region": "Global" },
    { "name": "G-Core DNS", "url": "https://dns.gcore.com/dns-query", "ips": ["95.85.95.85", "2.56.220.2"], "region": "Global" },
    { "name": "Yandex DNS", "url": "https://dns.yandex.ru/dns-query", "ips": ["77.88.8.8", "77.88.8.1"], "region": "RU" },
    { "name": "Verisign Public DNS", "url": null, "ips": ["64.6.64.6", "64.6.65.6"], "region": "Global" },
    { "name": "Quad101 (TWNIC)", "url": null, "ips": ["101.101.101.101", "101.102.103.104"], "region": "TW" },
    { "name": "114DNS", "url": null, "ips": ["114.114.114.114", "114.114.115.115"], "region": "CN" },
    { "name": "Level3 DNS", "url": null, "ips": ["4.2.2.1", "4.2.2.2", "4.2.2.3", "4.2.2.4"], "region": "Global" },
    { "name": "Hurricane Electric (HE.net)", "url": null, "ips": ["74.82.42.42"], "region": "US" },
    { "name": "NTT Public DNS", "url": null, "ips": ["129.250.35.250", "129.250.35.251"], "region": "JP" },
    { "name": "TREX DNS", "url": null, "ips": ["195.140.195.21", "195.140.195.22"], "region": "FI" },
    { "name": "Comodo Secure DNS", "url": "https://doh.comodo.com/dns-query", "type": "get", "allowCors": true, "ips": ["8.26.56.26", "8.20.247.20"], "region": "Global" },
    { "name": "SafeDNS", "url": "https://doh.safedns.com/dns-query", "type": "post", "allowCors": false, "ips": ["195.46.39.39", "195.46.39.40"], "region": "GB" },
    { "name": "DNS.Watch", "url": "https://resolver.dnswatch.info/dns-query", "type": "get", "allowCors": true, "ips": ["84.200.69.80", "84.200.70.40"], "region": "DE" },
    { "name": "CDNetworks Gaming DNS", "url": "https://dns.cdnetworks.com/dns-query", "type": "get", "allowCors": false, "ips": ["153.19.1.1", "153.19.1.2"], "region": "PL" },
    { "name": "Control D (Uncensored)", "url": "https://freedns.controld.com/uncensored", "type": "get", "allowCors": true, "ips": ["76.76.2.1", "76.76.10.1"], "region": "Global" },
    { "name": "CleanBrowsing (Gaming)", "url": "https://doh.cleanbrowsing.org/doh/gaming-filter/", "type": "post", "allowCors": false, "ips": ["185.228.168.168", "185.228.169.168"], "region": "Global" },
    { "name": "Surfshark DNS (Gaming)", "url": "https://dns.surfsharkdns.com/dns-query", "type": "get", "allowCors": false, "ips": ["162.252.172.57", "149.154.159.92"], "region": "Global" },
    { "name": "ExpressVPN DNS (Gaming)", "url": "https://dns.expressvpn.com/dns-query", "type": "get", "allowCors": true, "ips": ["208.67.222.222", "208.67.220.220"], "region": "Global" },
    { "name": "NordVPN DNS (Gaming)", "url": "https://dns.nordvpn.com/dns-query", "type": "get", "allowCors": false, "ips": ["103.86.96.100", "103.86.99.100"], "region": "Global" },
    { "name": "Mullvad DNS (Gaming)", "url": "https://dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.2", "194.242.2.4"], "region": "SE" },
    { "name": "NextDNS (Gaming Config)", "url": "https://dns.nextdns.io/gaming", "type": "get", "ips": ["45.90.28.190", "45.90.30.190"], "region": "Global" },
    { "name": "OpenNIC (Gaming)", "url": "https://doh.opennic.org/dns-query", "type": "get", "allowCors": true, "ips": ["208.111.2.4", "208.111.2.6"], "region": "Global" },
    { "name": "Shatel Users", "url": null, "ips": ["85.15.1.14", "85.15.1.15"], "region": "IR" },
    { "name": "Server.ir", "url": null, "ips": ["194.104.158.48", "194.104.158.78"], "region": "IR" },
    { "name": "Pars Online", "url": null, "ips": ["46.224.1.221", "46.224.1.220"], "region": "IR" },
    { "name": "Hamrah Aval (OpenDNS)", "url": "https://doh.opendns.com/dns-query", "type": "get", "allowCors": true, "ips": ["208.67.220.200"], "region": "IR" },
    { "name": "Irancell DNS", "url": null, "ips": ["109.69.8.51"], "region": "IR" },
    { "name": "MelliDNS", "url": null, "ips": ["185.51.200.2", "185.51.200.10"], "region": "IR" },
    { "name": "Shelter DNS", "url": null, "ips": ["91.92.255.160", "91.92.255.24"], "region": "IR" },
    { "name": "Level3 (Alternative)", "url": null, "ips": ["4.2.2.5", "4.2.2.6"], "region": "Global" },
    { "name": "Swiss DNS", "url": null, "ips": ["176.10.118.132", "176.10.118.133"], "region": "CH" },
    { "name": "Kuwait DNS", "url": null, "ips": ["94.187.170.2", "94.187.170.3"], "region": "KW" },
    { "name": "Spain DNS", "url": null, "ips": ["195.235.194.7", "195.235.194.8"], "region": "ES" },
    { "name": "Tajikistan DNS", "url": null, "ips": ["45.81.37.0", "45.81.37.1"], "region": "TJ" },
    { "name": "FutureDNS", "url": null, "ips": [], "region": "Global", "note": "QUIC: quic://dns.futuredns.me" },
    { "name": "DandelionSprout", "url": null, "ips": [], "region": "Global", "note": "QUIC: quic://dandelionsprout.asuscomm.com:48582" }
];

let dnsChart;
let chartData = [];
let resultFragment = null;
let testInProgress = false;

// === Utility Functions ===

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Sanitize and validate hostname
 * @param {string} input - Raw input
 * @returns {string|null} Valid hostname or null
 */
function validateAndExtractHost(input) {
    try {
        const u = new URL(input);
        return u.hostname.toLowerCase();
    } catch {
        // Simple hostname validation
        const hostname = input.toLowerCase().trim();
        if (/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(hostname)) {
            return hostname;
        }
        return null;
    }
}

/**
 * Normalize DoH URL with fallback handling
 * @param {string} base - Base DoH URL
 * @returns {string|null} Normalized URL or null
 */
function normalizeDoHUrl(base) {
    if (!base) return null;
    try {
        const u = new URL(base);
        // Ensure proper path
        if (!/^\/dns-query(\?|$)/.test(u.pathname)) {
            u.pathname = '/dns-query';
        }
        return u.toString();
    } catch {
        return null;
    }
}

/**
 * Enhanced speed formatting with better locale support
 * @param {number|string} val - Speed value
 * @returns {string} Formatted speed string
 */
function formatSpeed(val) {
    if (val === 'Unavailable' || val === null || val === undefined) {
        return 'ناموجود';
    }
    if (typeof val === 'number' && !isNaN(val)) {
        return `${val.toFixed(2)} میلی‌ثانیه`;
    }
    return 'ناموجود';
}

/**
 * Copy text to clipboard with enhanced UX
 * @param {string} text - Text to copy
 * @param {HTMLElement} element - UI element to update
 */
async function copyToClipboard(text, element) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalContent = element.innerHTML;
        element.classList.add('copied');
        element.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            کپی شد!
        `;
        
        setTimeout(() => {
            element.classList.remove('copied');
            element.innerHTML = originalContent;
        }, 2000);
        
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        element.innerHTML = 'کپی شد!';
        setTimeout(() => {
            element.innerHTML = originalContent;
        }, 2000);
    }
}

// === Enhanced DNS Testing Functions ===

/**
 * Enhanced DNS speed measurement with CORS fallback
 * @param {string} dohUrl - DoH server URL
 * @param {string} hostname - Hostname to resolve
 * @param {string} preferredMethod - Preferred HTTP method
 * @returns {Promise<number|null>} Response time in ms or null
 */
async function measureDNSSpeed(dohUrl, hostname, preferredMethod = 'post') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const startTime = performance.now();
    
    try {
        const packet = dnsPacket.encode({
            type: 'query',
            id: Math.floor(Math.random() * 65536),
            flags: 0,
            questions: [{ type: 'A', name: hostname }]
        });
        
        // Try preferred method first
        const tryMethod = async (method) => {
            try {
                const url = method === 'get' 
                    ? `${dohUrl}?dns=${btoa(String.fromCharCode(...packet))}`
                    : dohUrl;
                
                const headers = method === 'post' 
                    ? { 'Content-Type': 'application/dns-message' }
                    : { 'Accept': 'application/dns-message' };
                
                const res = await fetch(url, {
                    method: method === 'get' ? 'GET' : 'POST',
                    headers,
                    body: method === 'post' ? packet : undefined,
                    signal: controller.signal,
                    cache: 'no-store',
                    mode: 'cors'
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                
                // We don't need to parse the response, just measure time
                return performance.now() - startTime;
                
            } catch (error) {
                throw error;
            }
        };
        
        // Try preferred method first, fallback to other method
        try {
            return await tryMethod(preferredMethod);
        } catch (error) {
            // If preferred method fails, try the other method
            const fallbackMethod = preferredMethod === 'post' ? 'get' : 'post';
            console.warn(`Failed with ${preferredMethod}, trying ${fallbackMethod}:`, error);
            return await tryMethod(fallbackMethod);
        }
        
    } catch (error) {
        console.warn(`DNS test failed for ${hostname}:`, error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Test single server with enhanced error handling
 * @param {Object} server - DNS server configuration
 */
async function testServer(server) {
    const dohUrl = normalizeDoHUrl(server.url);
    if (!dohUrl) {
        server.speed = { 
            min: 'Unavailable', 
            median: 'Unavailable', 
            avg: 'Unavailable', 
            max: 'Unavailable' 
        };
        server.individualResults = topWebsites.map(w => ({ 
            website: w, 
            speed: 'Unavailable' 
        }));
        appendResultRow(server);
        return;
    }
    
    // Determine preferred method based on server config
    const preferredMethod = server.type || 'post';
    
    const results = await Promise.allSettled(
        topWebsites.map(host => measureDNSSpeed(dohUrl, host, preferredMethod))
    );
    
    server.individualResults = topWebsites.map((host, i) => ({
        website: host,
        speed: results[i].status === 'fulfilled' && typeof results[i].value === 'number' 
            ? results[i].value 
            : 'Unavailable'
    }));
    
    // Calculate statistics
    const valid = results
        .filter(r => r.status === 'fulfilled' && typeof r.value === 'number' && !isNaN(r.value))
        .map(r => r.value)
        .sort((a, b) => a - b);
    
    if (valid.length > 0) {
        const min = valid[0];
        const max = valid[valid.length - 1];
        const mid = Math.floor(valid.length / 2);
        const median = valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
        
        server.speed = { min, median, max, avg };
        
        // Add to chart data only if we have valid numerical results
        chartData.push({ 
            name: server.name, 
            avg: avg, 
            min: min, 
            max: max,
            region: server.region || 'Unknown'
        });
        
    } else {
        server.speed = { 
            min: 'Unavailable', 
            median: 'Unavailable', 
            avg: 'Unavailable', 
            max: 'Unavailable' 
        };
    }
    
    appendResultRow(server);
}

// === Enhanced UI Functions ===

/**
 * Enhanced result row appending with better accessibility
 * @param {Object} server - Server data
 */
function appendResultRow(server) {
    const row = document.createElement('tr');
    row.dataset.serverName = server.name;
    row.className = 'border-b border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700';
    row.setAttribute('role', 'row');
    
    const ips = server.ips?.join(', ') || 'بدون IP';
    const url = server.url || 'N/A';
    const region = server.region ? ` (${server.region})` : '';
    
    const copyData = `نام: ${server.name}${region}\nآدرس DoH: ${url}\nآدرس‌های IP: ${ips}`;
    
    row.innerHTML = `
        <td class="text-left py-2 px-4 dark:text-gray-300" role="cell">
            ${escapeHtml(server.name)}
            <span class="copy-btn cursor-pointer ml-2 px-2 py-1 text-xs rounded inline-flex items-center gap-1" 
                  data-copy="${escapeHtml(copyData)}"
                  aria-label="کپی اطلاعات ${escapeHtml(server.name)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                کپی
            </span>
        </td>
        <td class="text-center py-2 px-4 dark:text-gray-300" role="cell">${formatSpeed(server.speed.min)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300" role="cell">${formatSpeed(server.speed.median)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300" role="cell">${formatSpeed(server.speed.avg)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300" role="cell">${formatSpeed(server.speed.max)}</td>
    `;
    
    // Create details row with better accessibility
    const details = document.createElement('tr');
    details.className = 'details-row hidden border-b border-gray-300 dark:border-gray-600';
    details.setAttribute('role', 'row');
    
    const resultsList = server.individualResults.map(r => {
        const speedText = typeof r.speed === 'number' ? `${r.speed.toFixed(2)} ms` : 'ناموجود';
        return `<li><strong>${escapeHtml(r.website)}:</strong> ${speedText}</li>`;
    }).join('');
    
    details.innerHTML = `
        <td colspan="5" class="py-2 px-4 dark:bg-gray-800" role="cell">
            <div class="mb-2">
                <strong>زمان‌بندی hostnameها:</strong>
                <span class="text-sm text-gray-400">(${server.individualResults.filter(r => typeof r.speed === 'number').length}/${topWebsites.length} موفق)</span>
            </div>
            <ul role="list">${resultsList}</ul>
        </td>
    `;
    
    resultFragment.appendChild(row);
    resultFragment.appendChild(details);
    
    // Add event listeners
    row.querySelector('[data-copy]').addEventListener('click', function () {
        copyToClipboard(this.dataset.copy, this);
    });
    
    // Add row click handler for details toggle
    row.addEventListener('click', function (e) {
        // Don't toggle if clicking on copy button
        if (e.target.closest('.copy-btn')) return;
        
        const details = this.nextElementSibling;
        if (details && details.classList.contains('details-row')) {
            details.classList.toggle('hidden');
            
            // Update aria-expanded for accessibility
            const isExpanded = !details.classList.contains('hidden');
            this.setAttribute('aria-expanded', isExpanded.toString());
        }
    });
    
    // Make row focusable and keyboard accessible
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `نمایش جزئیات ${server.name}`);
    
    row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });
}

/**
 * Enhanced chart update with better error handling
 */
function updateChart() {
    // Filter chart data to only include numerical values
    const validData = chartData.filter(d => 
        typeof d.avg === 'number' && !isNaN(d.avg) && d.avg > 0
    ).sort((a, b) => a.avg - b.avg);
    
    if (validData.length === 0) {
        console.warn('No valid chart data available');
        return;
    }
    
    const ctx = document.getElementById('dnsChart').getContext('2d');
    const height = Math.max(300, Math.min(800, validData.length * 35 + 100));
    
    // Update container height
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.style.height = `${height}px`;
    document.getElementById('chartContainer').classList.remove('hidden');
    
    // Destroy existing chart
    if (dnsChart) {
        dnsChart.destroy();
    }
    
    // Color coding by region
    const colors = {
        'IR': '#ef4444',      // Red for Iran
        'Global': '#22c55e',  // Green for Global
        'US': '#3b82f6',      // Blue for US
        'EU': '#8b5cf6',      // Purple for EU
        'CN': '#f59e0b',      // Orange for China
        'JP': '#ec4899',      // Pink for Japan
        'DE': '#06b6d4',      // Cyan for Germany
        'RU': '#f97316',      // Orange-red for Russia
        'GB': '#84cc16',      // Lime for UK
        'SE': '#a855f7',      // Violet for Sweden
        'Default': '#64748b'  // Slate for others
    };
    
    const backgroundColors = validData.map(d => colors[d.region] || colors.Default);
    
    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(d => d.name),
            datasets: [{
                label: 'زمان پاسخ میانگین (ms)',
                data: validData.map(d => d.avg),
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color + '80'),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            return `${validData[index].name} (${validData[index].region})`;
                        },
                        label: function(context) {
                            return `زمان میانگین: ${context.parsed.x.toFixed(2)} ms`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    min: 0,
                    title: {
                        display: true,
                        text: 'زمان پاسخ (میلی‌ثانیه)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: { 
                    title: { 
                        display: window.innerWidth >= 768, 
                        text: 'سرورهای DNS' 
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

/**
 * Enhanced best DNS display with better UX
 */
function showBestDNS() {
    const validServers = dnsServers.filter(s => s.speed && typeof s.speed.avg === 'number' && !isNaN(s.speed.avg));
    const container = document.getElementById('bestDNSContainer');
    
    if (validServers.length === 0) {
        // Find server with most successful tests
        const bestBySuccess = [...dnsServers].sort((a, b) => {
            const aSuccess = a.individualResults?.filter(r => typeof r.speed === 'number').length || 0;
            const bSuccess = b.individualResults?.filter(r => typeof r.speed === 'number').length || 0;
            return bSuccess - aSuccess;
        })[0];
        
        container.innerHTML = `
            <div class="glass-card mt-8">
                <div class="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                    <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-3">⚠️ هیچ DNS قابل اعتمادی یافت نشد!</h3>
                    <p class="font-mono text-lg mb-3"><strong>${escapeHtml(bestBySuccess?.name || 'ناموجود')}</strong></p>
                    <p class="text-gray-700 dark:text-gray-300 mb-4 break-all">
                        ${escapeHtml(bestBySuccess?.ips?.join(', ') || 'بدون IP')}
                    </p>
                    <button class="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors" 
                            data-copy="${escapeHtml(bestBySuccess?.ips?.join(', ') || '')}"
                            aria-label="کپی آدرس IP ${escapeHtml(bestBySuccess?.name || '')}">
                        کپی آدرس‌های IP
                    </button>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        ممکن است به دلیل محدودیت‌های CORS یا مشکلات شبکه باشد. دوباره تلاش کنید.
                    </p>
                </div>
            </div>
        `;
    } else {
        validServers.sort((a, b) => a.speed.avg - b.speed.avg);
        const best = validServers[0];
        const ips = best.ips?.length ? best.ips.join(', ') : 'بدون IP';
        
        // Determine recommendation level
        let recommendationLevel = 'عالی';
        let recommendationColor = 'green';
        let recommendationIcon = '🚀';
        
        if (best.speed.avg > 100) {
            recommendationLevel = 'متوسط';
            recommendationColor = 'yellow';
            recommendationIcon = '⚡';
        } else if (best.speed.avg > 200) {
            recommendationLevel = 'کند';
            recommendationColor = 'red';
            recommendationIcon = '🐌';
        }
        
        container.innerHTML = `
            <div class="glass-card mt-8">
                <div class="p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                    <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">
                        ${recommendationIcon} بهترین DNS برای شما:
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="font-mono text-lg mb-2">
                                <strong>${escapeHtml(best.name)}</strong> 
                                <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">${escapeHtml(best.region || 'Global')}</span>
                            </p>
                            <p class="font-mono text-gray-700 dark:text-gray-300 mb-2">${escapeHtml(ips)}</p>
                        </div>
                        <div class="text-center">
                            <div class="text-3xl font-bold text-green-600 mb-1">${best.speed.avg.toFixed(1)} ms</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">زمان میانگین پاسخ</div>
                            <div class="text-xs mt-1 bg-${recommendationColor}-100 text-${recommendationColor}-800 px-2 py-1 rounded inline-block">
                                عملکرد ${recommendationLevel}
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button class="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" 
                                data-copy="${escapeHtml(ips)}"
                                aria-label="کپی آدرس IP ${escapeHtml(best.name)}">
                            کپی آدرس‌های IP
                        </button>
                        <button class="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
                                data-copy="DoH URL: ${escapeHtml(best.url || 'N/A')}"
                                aria-label="کپی آدرس DoH ${escapeHtml(best.name)}">
                            کپی آدرس DoH
                        </button>
                    </div>
                    
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>راهنما:</strong> این آدرس‌ها را در تنظیمات روتر، سیستم‌عامل یا اپلیکیشن‌های خود استفاده کنید تا از سرعت بالاتر برخوردار شوید.
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Scroll to best DNS result
    container.scrollIntoView({ behavior: 'smooth' });
    
    // Add copy event listeners
    container.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyBestDNS(btn.dataset.copy, btn));
    });
}

/**
 * Copy best DNS with enhanced feedback
 * @param {string} data - Data to copy
 * @param {HTMLElement} button - Button element
 */
function copyBestDNS(data, button) {
    copyToClipboard(data, button);
    
    // Show additional feedback for DNS data
    if (data.includes('.')) {
        const oldText = button.innerHTML;
        button.innerHTML = 'آدرس DNS کپی شد!';
        setTimeout(() => {
            button.innerHTML = oldText;
        }, 2000);
    }
}

// === Enhanced Main Functions ===

/**
 * Enhanced sorting with better accessibility
 * @param {number} col - Column index
 */
function sortTable(col) {
    const tbody = document.querySelector('#resultsTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.details-row)'));
    const pairs = rows.map(r => [r, r.nextElementSibling?.classList.contains('details-row') ? r.nextElementSibling : null]);
    
    pairs.sort((a, b) => {
        const A = a[0].cells[col].textContent.trim();
        const B = b[0].cells[col].textContent.trim();
        
        const valA = A === 'ناموجود' ? Infinity : parseFloat(A.replace(/[^\d.-]/g, ''));
        const valB = B === 'ناموجود' ? Infinity : parseFloat(B.replace(/[^\d.-]/g, ''));
        
        return valA - valB;
    });
    
    // Update aria-sort attributes
    const headers = document.querySelectorAll('#resultsTable th');
    headers.forEach((header, index) => {
        header.setAttribute('aria-sort', index === col ? 'ascending' : 'none');
    });
    
    pairs.forEach(([row, details]) => {
        tbody.appendChild(row);
        if (details) tbody.appendChild(details);
    });
}

/**
 * Enhanced main test function with better UX
 */
async function performDNSTests() {
    const CONCURRENT = 5; // Adjust based on server capacity
    const totalServers = dnsServers.length;
    let completedServers = 0;
    
    document.getElementById('loadingText').textContent = 'آماده‌سازی تست...';
    
    for (let i = 0; i < dnsServers.length; i += CONCURRENT) {
        const batch = dnsServers.slice(i, i + CONCURRENT);
        await Promise.all(batch.map(async (server) => {
            try {
                await testServer(server);
                completedServers++;
                document.getElementById('loadingText').textContent = 
                    `در حال تست... (${completedServers}/${totalServers})`;
            } catch (error) {
                console.error(`Failed to test server ${server.name}:`, error);
                // Still add a row to show the failure
                server.speed = {
                    min: 'خطا',
                    median: 'خطا',
                    avg: 'خطا',
                    max: 'خطا'
                };
                server.individualResults = topWebsites.map(w => ({
                    website: w,
                    speed: 'خطا'
                }));
                appendResultRow(server);
                completedServers++;
            }
        }));
    }
}

/**
 * Enhanced main test button handler
 */
checkButton.addEventListener('click', async () => {
    if (testInProgress) return;
    
    testInProgress = true;
    [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = true);
    
    // Reset state
    chartData = [];
    resultFragment = document.createDocumentFragment();
    document.getElementById('chartContainer').classList.add('hidden');
    document.getElementById('dnsResults').classList.remove('hidden');
    document.querySelector('#resultsTable tbody').innerHTML = '';
    document.getElementById('bestDNSContainer').innerHTML = '';
    
    // Show loading
    document.getElementById('loadingMessage').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'شروع تست...';
    
    try {
        await performDNSTests();
        
        // Update UI
        document.querySelector('#resultsTable tbody').appendChild(resultFragment);
        
        // Update chart and best DNS if we have valid data
        if (chartData.length > 0) {
            updateChart();
            showBestDNS();
        } else {
            showBestDNS(); // This will show the "no reliable DNS found" message
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        document.getElementById('loadingText').textContent = 'خطا در انجام تست';
    } finally {
        // Hide loading and re-enable buttons
        document.getElementById('loadingMessage').classList.add('hidden');
        [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = false);
        testInProgress = false;
    }
});

// === Enhanced Modal Functions ===

/**
 * Enhanced website list rendering with XSS protection
 */
function renderList() {
    const list = document.getElementById('websiteList');
    list.innerHTML = '';
    
    topWebsites.forEach((site, i) => {
        const li = document.createElement('li');
        li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700';
        
        const siteSpan = document.createElement('span');
        siteSpan.textContent = site; // Safe textContent usage
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition-colors';
        deleteBtn.textContent = 'حذف';
        deleteBtn.setAttribute('aria-label', `حذف ${site} از لیست`);
        
        deleteBtn.onclick = () => {
            topWebsites.splice(i, 1);
            renderList();
        };
        
        li.appendChild(siteSpan);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

/**
 * Enhanced hostname addition with validation
 */
function addHostname() {
    const input = document.getElementById('newWebsite');
    const host = validateAndExtractHost(input.value);
    
    if (!host) {
        alert('نام میزبان نامعتبر! لطفاً یک نام میزبان معتبر وارد کنید.');
        return;
    }
    
    if (topWebsites.includes(host)) {
        alert('این وب‌سایت قبلاً اضافه شده است!');
        return;
    }
    
    topWebsites.push(host);
    input.value = '';
    renderList();
    
    // Show success feedback
    const feedback = document.createElement('div');
    feedback.className = 'text-green-500 text-sm mt-2';
    feedback.textContent = `${host} با موفقیت اضافه شد!`;
    input.parentNode.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 3000);
}

/**
 * Enhanced DoH suggestion with GitHub integration
 */
function suggestDoHServer() {
    const name = document.getElementById('newDoHName').value.trim();
    const url = document.getElementById('newDoHUrl').value.trim();
    const ips = document.getElementById('newDoHIPs').value.trim();
    
    if (!name || !url) {
        alert('لطفاً نام و آدرس DoH را وارد کنید!');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch {
        alert('آدرس DoH نامعتبر است!');
        return;
    }
    
    const issuesUrl = `https://github.com/Argh94/DoHSpeedTest/issues/new?title=${encodeURIComponent(`[DNS Suggestion] Add ${name}`)}&body=${encodeURIComponent(
        `**Name:** ${name}\n**DoH URL:** ${url}\n**IPs:** ${ips || 'Not provided'}\n**Additional Info:** Add any additional information here.`
    )}`;
    
    window.open(issuesUrl, '_blank', 'noopener,noreferrer');
    
    // Close modal and reset form
    document.getElementById('dohModal').style.display = 'none';
    document.getElementById('newDoHName').value = '';
    document.getElementById('newDoHUrl').value = '';
    document.getElementById('newDoHIPs').value = '';
    
    // Show success message
    alert('فرم پیشنهاد شما در GitHub باز خواهد شد. لطفاً Issue را ارسال کنید.');
}

// === Enhanced Event Listeners and Initialization ===

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("websiteModal");
    const dohModal = document.getElementById("dohModal");
    
    // Modal event handlers
    document.getElementById("editButton").onclick = () => { 
        modal.style.display = "block"; 
        renderList(); 
    };
    
    document.getElementById("editDoHButton").onclick = () => { 
        dohModal.style.display = "block"; 
    };
    
    modal.querySelector(".close").onclick = () => { 
        modal.style.display = "none"; 
    };
    
    dohModal.querySelector(".close").onclick = () => { 
        dohModal.style.display = "none"; 
    };
    
    // Website management
    document.getElementById("addHostname").onclick = addHostname;
    
    // Enhanced hostname input with Enter key support
    const newWebsiteInput = document.getElementById("newWebsite");
    newWebsiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHostname();
        }
    });
    
    // DoH suggestion
    document.getElementById("suggestDoHServer").onclick = suggestDoHServer;
    
    // Table interaction enhancement
    document.getElementById('resultsTable').addEventListener('click', e => {
        const row = e.target.closest('tr');
        if (row && !row.classList.contains('details-row')) {
            const details = row.nextElementSibling;
            if (details && details.classList.contains('details-row')) {
                details.classList.toggle('hidden');
                const isExpanded = !details.classList.contains('hidden');
                row.setAttribute('aria-expanded', isExpanded.toString());
            }
        }
    });
    
    // Enhanced share functionality
    document.getElementById('cta').onclick = async () => {
        const shareData = {
            title: 'DoHSpeedTest - تست سرعت DNS',
            text: 'با این ابزار سرعت سرورهای DNS-over-HTTPS را بسنجید!',
            url: location.href
        };
        
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    await navigator.clipboard.writeText(location.href);
                    alert('لینک کپی شد!');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(location.href);
                alert('لینک کپی شد!');
            } catch (err) {
                console.error('Copy failed:', err);
                alert('لطفاً لینک را به صورت دستی کپی کنید.');
            }
        }
    };
    
    // Enhanced modal close handlers
    window.onclick = e => { 
        if (e.target === modal || e.target === dohModal) {
            e.target.style.display = "none"; 
        }
    };
    
    // Handle escape key for modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.style.display === 'block') modal.style.display = 'none';
            if (dohModal.style.display === 'block') dohModal.style.display = 'none';
        }
    });
    
    // Enhanced chart resize handling
    window.addEventListener('resize', () => {
        if (dnsChart) {
            dnsChart.resize();
        }
    });
    
    // Performance optimization for particles
    let particleAnimationId;
    const optimizeParticleAnimation = () => {
        if (document.hidden) {
            if (particleAnimationId) {
                cancelAnimationFrame(particleAnimationId);
                particleAnimationId = null;
            }
        } else if (!particleAnimationId && canvas) {
            startParticleAnimation();
        }
    };
    
    document.addEventListener('visibilitychange', optimizeParticleAnimation);
});

// === Enhanced Particle Animation ===
const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;
    
    function resize() { 
        canvas.width = innerWidth; 
        canvas.height = innerHeight; 
    }
    resize(); 
    window.addEventListener('resize', resize);
    
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.radius = Math.random() * 2 + 1;
            this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
            this.life = 0; 
            this.maxLife = Math.random() * 100 + 100;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        update() {
            this.x += this.vx; 
            this.y += this.vy; 
            this.life++;
            
            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
            
            // Fade out near end of life
            if (this.life > this.maxLife * 0.8) {
                this.opacity *= 0.98;
            }
        }
        draw() {
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.shadowBlur = 10; 
            ctx.shadowColor = this.color; 
            ctx.fill(); 
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
    }
    
    function initParticles(n) { 
        for (let i = 0; i < n; i++) particles.push(new Particle()); 
    }
    
    function startParticleAnimation() {
        function animate() {
            if (document.hidden) {
                animationId = requestAnimationFrame(animate);
                return;
            }
            
            ctx.fillStyle = 'rgba(15,15,30,0.05)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => { 
                p.update(); 
                p.draw(); 
            });
            
            // Clean up dead particles and add new ones
            particles = particles.filter(p => p.life < p.maxLife && p.opacity > 0.1);
            if (particles.length < 80) {
                particles.push(new Particle());
            }
            
            animationId = requestAnimationFrame(animate);
        }
        
        if (!animationId) {
            animate();
        }
    }
    
    // Initialize with reduced particles on mobile
    const particleCount = window.innerWidth < 768 ? 40 : 80;
    initParticles(particleCount);
    startParticleAnimation();
}

// === Export functions for global access ===
window.sortTable = sortTable;
window.escapeHtml = escapeHtml;
