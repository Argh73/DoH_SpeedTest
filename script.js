// === DNS Speed Test Script - Fixed Version ===
// Simplified and more reliable implementation

// Global Variables
const checkButton = document.getElementById('checkButton');
const editButton = document.getElementById('editButton');
const topWebsites = [
    'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 
    'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 
    'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'
];

// Enhanced DNS Servers
const dnsServers = [
    { "name": "Cloudflare", "url": "https://cloudflare-dns.com/dns-query", "type": "get", "allowCors": true, "ips": ["1.1.1.1", "1.0.0.1"], "region": "Global" },
    { "name": "Google", "url": "https://dns.google/resolve", "type": "get", "allowCors": true, "ips": ["8.8.8.8", "8.8.4.4"], "region": "Global" },
    { "name": "Quad9", "url": "https://dns.quad9.net/dns-query", "ips": ["9.9.9.9", "149.112.112.112"], "region": "Global" },
    { "name": "OpenDNS", "url": "https://doh.opendns.com/dns-query", "ips": ["208.67.222.222", "208.67.220.220"], "region": "Global" },
    { "name": "AdGuard", "url": "https://dns.adguard-dns.com/dns-query", "ips": ["94.140.14.14", "94.140.15.15"], "region": "Global" },
    { "name": "CleanBrowsing", "url": "https://doh.cleanbrowsing.org/doh/family-filter/", "ips": ["185.228.168.9", "185.228.169.9"], "region": "Global" },
    { "name": "Shecan (شکن)", "url": "https://free.shecan.ir/dns-query", "ips": ["178.22.122.100", "185.51.200.2"], "region": "IR" },
    { "name": "Begzar (بگذر)", "url": "https://dns.begzar.ir/dns-query", "type": "post", "allowCors": false, "ips": ["185.55.226.26", "185.55.225.25"], "region": "IR" },
    { "name": "Radar Game", "url": "https://dns.radar.game/dns-query", "ips": ["10.202.10.10", "10.202.10.11"], "region": "IR" },
    { "name": "Control D", "url": "https://freedns.controld.com/p0", "ips": ["76.76.2.0", "76.223.122.150"], "region": "Global" },
    { "name": "DNS.SB", "url": "https://doh.dns.sb/dns-query", "type": "get", "allowCors": true, "ips": ["185.222.222.222", "45.11.45.11"], "region": "Global" },
    { "name": "Mullvad", "url": "https://dns.mullvad.net/dns-query", "type": "get", "allowCors": false, "ips": ["194.242.2.2"], "region": "SE" },
    { "name": "NextDNS", "url": "https://dns.nextdns.io", "type": "get", "ips": ["45.90.28.0", "45.90.30.0"], "region": "Global" },
    { "name": "AliDNS", "url": "https://dns.alidns.com/dns-query", "ips": ["223.5.5.5", "223.6.6.6"], "region": "CN" },
    { "name": "DNSPod", "url": "https://dns.pub/dns-query", "type": "post", "allowCors": false, "ips": ["119.29.29.29", "182.254.116.116"], "region": "CN" },
    { "name": "360", "url": "https://doh.360.cn/dns-query", "ips": ["101.226.4.6", "180.163.224.54"], "region": "CN" },
    { "name": "Yandex", "url": "https://dns.yandex.ru/dns-query", "ips": ["77.88.8.8", "77.88.8.1"], "region": "RU" },
    { "name": "Comodo", "url": "https://doh.comodo.com/dns-query", "type": "get", "allowCors": true, "ips": ["8.26.56.26", "8.20.247.20"], "region": "Global" },
    { "name": "DNS.Watch", "url": "https://resolver.dnswatch.info/dns-query", "type": "get", "allowCors": true, "ips": ["84.200.69.80", "84.200.70.40"], "region": "DE" },
    { "name": "Canadian Shield", "url": "https://private.canadianshield.cira.ca/dns-query", "ips": ["149.112.121.10", "149.112.122.10"], "region": "CA" }
];

let dnsChart;
let chartData = [];
let resultFragment = null;
let testInProgress = false;

// Utility Functions
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function formatSpeed(val) {
    if (val === 'Unavailable' || val === null || val === undefined) {
        return 'ناموجود';
    }
    if (typeof val === 'number' && !isNaN(val)) {
        return `${val.toFixed(2)}`;
    }
    return 'ناموجود';
}

async function copyToClipboard(text, element) {
    try {
        await navigator.clipboard.writeText(text);
        element.classList.add('copied');
        const originalContent = element.innerHTML;
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
    }
}

// DNS Testing Functions
function buildGoogleQuery(domain) {
    const params = new URLSearchParams({
        name: domain,
        type: 'A'
    });
    return params.toString();
}

function buildGenericQuery(domain) {
    // Simplified DNS packet construction
    const header = new Uint8Array(12);
    header[0] = Math.floor(Math.random() * 256);
    header[1] = Math.floor(Math.random() * 256);
    header[2] = 0x01; // Standard query
    header[3] = 0x00; // No flags
    header[4] = 0x00; // Questions count
    header[5] = 0x01;
    header[6] = 0x00; // Answer count
    header[7] = 0x00;
    header[8] = 0x00; // Authority count
    header[9] = 0x00;
    header[10] = 0x00; // Additional count
    header[11] = 0x00;

    const parts = domain.split('.');
    const question = [];
    question.push(...parts.map(part => {
        const arr = new Uint8Array(part.length + 1);
        arr[0] = part.length;
        for (let i = 0; i < part.length; i++) {
            arr[i + 1] = part.charCodeAt(i);
        }
        return arr;
    }));
    question.push(new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x01])); // Type A, Class IN

    const fullPacket = new Uint8Array(header.length + question.reduce((acc, part) => acc + part.length, 0));
    let offset = 0;
    fullPacket.set(header, offset);
    offset += header.length;
    question.forEach(part => {
        fullPacket.set(part, offset);
        offset += part.length;
    });

    return btoa(String.fromCharCode(...fullPacket));
}

async function measureDNSSpeed(dohUrl, hostname, method = 'post') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // Increased timeout
    const startTime = performance.now();
    
    try {
        let url, headers, body;
        
        if (method === 'get') {
            if (dohUrl.includes('dns.google')) {
                url = `${dohUrl}?${buildGoogleQuery(hostname)}`;
            } else {
                url = `${dohUrl}?dns=${buildGenericQuery(hostname)}`;
            }
            headers = { 'Accept': 'application/dns-message' };
        } else {
            url = dohUrl;
            headers = { 'Content-Type': 'application/dns-message' };
            body = new Uint8Array(buildGenericQuery(hostname).split('').map(char => char.charCodeAt(0)));
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers,
            body,
            signal: controller.signal,
            cache: 'no-store',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return performance.now() - startTime;
        
    } catch (error) {
        console.warn(`DNS test failed for ${hostname} with ${method}:`, error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

async function testServer(server) {
    const dohUrl = server.url;
    if (!dohUrl) {
        server.speed = { min: 'Unavailable', median: 'Unavailable', avg: 'Unavailable', max: 'Unavailable' };
        server.individualResults = topWebsites.map(w => ({ website: w, speed: 'Unavailable' }));
        appendResultRow(server);
        return;
    }
    
    const preferredMethod = server.type || 'post';
    const results = [];
    
    // Test each hostname
    for (const hostname of topWebsites) {
        try {
            let result;
            if (preferredMethod === 'get') {
                result = await measureDNSSpeed(dohUrl, hostname, 'get');
                // If GET fails, try POST
                if (!result) {
                    result = await measureDNSSpeed(dohUrl, hostname, 'post');
                }
            } else {
                result = await measureDNSSpeed(dohUrl, hostname, 'post');
                // If POST fails, try GET
                if (!result) {
                    result = await measureDNSSpeed(dohUrl, hostname, 'get');
                }
            }
            
            results.push(result);
            
        } catch (error) {
            console.warn(`Failed to test ${hostname} on ${server.name}:`, error);
            results.push(null);
        }
    }
    
    server.individualResults = topWebsites.map((host, i) => ({
        website: host,
        speed: results[i]
    }));
    
    const valid = results.filter(r => r !== null && !isNaN(r)).sort((a, b) => a - b);
    
    if (valid.length > 0) {
        const min = valid[0];
        const max = valid[valid.length - 1];
        const mid = Math.floor(valid.length / 2);
        const median = valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
        
        server.speed = { min, median, max, avg };
        
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

// UI Functions
function appendResultRow(server) {
    const row = document.createElement('tr');
    row.dataset.serverName = server.name;
    row.className = 'border-b border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700';
    
    const ips = server.ips?.join(', ') || 'بدون IP';
    const url = server.url || 'N/A';
    const region = server.region ? ` (${server.region})` : '';
    
    const copyData = `نام: ${server.name}${region}\nآدرس DoH: ${url}\nآدرس‌های IP: ${ips}`;
    
    row.innerHTML = `
        <td class="text-left py-2 px-4 dark:text-gray-300">
            ${escapeHtml(server.name)}
            <span class="copy-btn cursor-pointer ml-2 px-2 py-1 text-xs rounded inline-flex items-center gap-1" 
                  data-copy="${escapeHtml(copyData)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                کپی
            </span>
        </td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.min)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.median)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.avg)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.max)}</td>
    `;
    
    resultFragment.appendChild(row);
    
    // Add event listener
    row.querySelector('[data-copy]').addEventListener('click', function () {
        copyToClipboard(this.dataset.copy, this);
    });
}

function updateChart() {
    const validData = chartData.filter(d => 
        typeof d.avg === 'number' && !isNaN(d.avg) && d.avg > 0
    ).sort((a, b) => a.avg - b.avg);
    
    if (validData.length === 0) {
        console.warn('No valid chart data available');
        return;
    }
    
    const ctx = document.getElementById('dnsChart').getContext('2d');
    const height = Math.max(300, Math.min(800, validData.length * 35 + 100));
    
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.style.height = `${height}px`;
    document.getElementById('chartContainer').classList.remove('hidden');
    
    if (dnsChart) {
        dnsChart.destroy();
    }
    
    const colors = {
        'IR': '#ef4444',      // Red for Iran
        'Global': '#22c55e',  // Green for Global
        'CN': '#f59e0b',      // Orange for China
        'RU': '#f97316',      // Orange-red for Russia
        'DE': '#06b6d4',      // Cyan for Germany
        'CA': '#84cc16',      // Lime for Canada
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
                legend: { display: false },
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
                    }
                },
                y: { 
                    title: { display: true, text: 'سرورهای DNS' }
                }
            }
        }
    });
}

function showBestDNS() {
    const validServers = dnsServers.filter(s => s.speed && typeof s.speed.avg === 'number' && !isNaN(s.speed.avg));
    const container = document.getElementById('bestDNSContainer');
    
    if (validServers.length === 0) {
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
                            data-copy="${escapeHtml(bestBySuccess?.ips?.join(', ') || '')}">
                        کپی آدرس‌های IP
                    </button>
                </div>
            </div>
        `;
    } else {
        validServers.sort((a, b) => a.speed.avg - b.speed.avg);
        const best = validServers[0];
        const ips = best.ips?.length ? best.ips.join(', ') : 'بدون IP';
        
        container.innerHTML = `
            <div class="glass-card mt-8">
                <div class="p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                    <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">🚀 بهترین DNS برای شما:</h3>
                    <div class="grid sm:grid-cols-2 gap-4 mb-4">
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
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button class="flex-1 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" 
                                data-copy="${escapeHtml(ips)}">
                            کپی آدرس‌های IP
                        </button>
                        <button class="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
                                data-copy="DoH URL: ${escapeHtml(best.url || 'N/A')}">
                            کپی آدرس DoH
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn));
    });
}

function sortTable(col) {
    const tbody = document.querySelector('#resultsTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const A = a.cells[col].textContent.trim();
        const B = b.cells[col].textContent.trim();
        
        const valA = A === 'ناموجود' ? Infinity : parseFloat(A);
        const valB = B === 'ناموجود' ? Infinity : parseFloat(B);
        
        return valA - valB;
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Main Functions
async function performDNSTests() {
    const CONCURRENT = 3; // Reduced for better reliability
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

checkButton.addEventListener('click', async () => {
    if (testInProgress) return;
    
    testInProgress = true;
    [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = true);
    
    chartData = [];
    resultFragment = document.createDocumentFragment();
    document.getElementById('chartContainer').classList.add('hidden');
    document.getElementById('dnsResults').classList.remove('hidden');
    document.querySelector('#resultsTable tbody').innerHTML = '';
    document.getElementById('bestDNSContainer').innerHTML = '';
    
    document.getElementById('loadingMessage').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'شروع تست...';
    
    try {
        await performDNSTests();
        
        document.querySelector('#resultsTable tbody').appendChild(resultFragment);
        
        if (chartData.length > 0) {
            updateChart();
            showBestDNS();
        } else {
            showBestDNS();
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        document.getElementById('loadingText').textContent = 'خطا در انجام تست';
    } finally {
        document.getElementById('loadingMessage').classList.add('hidden');
        [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = false);
        testInProgress = false;
    }
});

// Modal Functions
function renderList() {
    const list = document.getElementById('websiteList');
    list.innerHTML = '';
    
    topWebsites.forEach((site, i) => {
        const li = document.createElement('li');
        li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700';
        
        const siteSpan = document.createElement('span');
        siteSpan.textContent = site;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 transition-colors';
        deleteBtn.textContent = 'حذف';
        
        deleteBtn.onclick = () => {
            topWebsites.splice(i, 1);
            renderList();
        };
        
        li.appendChild(siteSpan);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

function addHostname() {
    const input = document.getElementById('newWebsite');
    const host = input.value.trim().toLowerCase();
    
    if (!host) {
        alert('لطفاً نام میزبان را وارد کنید!');
        return;
    }
    
    if (topWebsites.includes(host)) {
        alert('این وب‌سایت قبلاً اضافه شده است!');
        return;
    }
    
    // Simple hostname validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(host)) {
        alert('نام میزبان نامعتبر است!');
        return;
    }
    
    topWebsites.push(host);
    input.value = '';
    renderList();
}

function suggestDoHServer() {
    const name = document.getElementById('newDoHName').value.trim();
    const url = document.getElementById('newDoHUrl').value.trim();
    const ips = document.getElementById('newDoHIPs').value.trim();
    
    if (!name || !url) {
        alert('لطفاً نام و آدرس DoH را وارد کنید!');
        return;
    }
    
    const issuesUrl = `https://github.com/Argh94/DoHSpeedTest/issues/new?title=${encodeURIComponent(`[DNS Suggestion] Add ${name}`)}&body=${encodeURIComponent(
        `**Name:** ${name}\n**DoH URL:** ${url}\n**IPs:** ${ips || 'Not provided'}\n**Additional Info:** Add any additional information here.`
    )}`;
    
    window.open(issuesUrl, '_blank');
    
    document.getElementById('dohModal').style.display = 'none';
    document.getElementById('newDoHName').value = '';
    document.getElementById('newDoHUrl').value = '';
    document.getElementById('newDoHIPs').value = '';
    
    alert('فرم پیشنهاد شما در GitHub باز خواهد شد. لطفاً Issue را ارسال کنید.');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("websiteModal");
    const dohModal = document.getElementById("dohModal");
    
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
    
    document.getElementById("addHostname").onclick = addHostname;
    
    const newWebsiteInput = document.getElementById("newWebsite");
    newWebsiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHostname();
        }
    });
    
    document.getElementById("suggestDoHServer").onclick = suggestDoHServer;
    
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
                    await navigator.clipboard.writeText(location.href);
                    alert('لینک کپی شد!');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(location.href);
                alert('لینک کپی شد!');
            } catch (err) {
                alert('لطفاً لینک را به صورت دستی کپی کنید.');
            }
        }
    };
    
    window.onclick = e => { 
        if (e.target === modal || e.target === dohModal) {
            e.target.style.display = "none"; 
        }
    };
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal.style.display === 'block') modal.style.display = 'none';
            if (dohModal.style.display === 'block') dohModal.style.display = 'none';
        }
    });
});

// Particle Animation
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
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
            
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
        
        particles = particles.filter(p => p.life < p.maxLife && p.opacity > 0.1);
        if (particles.length < 50) {
            particles.push(new Particle());
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    const particleCount = window.innerWidth < 768 ? 30 : 60;
    initParticles(particleCount);
    animate();
}

// Export functions
window.sortTable = sortTable;
