// === dns-packet is loaded globally from CDN ===
// <script src="https://cdn.jsdelivr.net/npm/dns-packet@5.4.0/index.js"></script>

const checkButton = document.getElementById('checkButton');
const editButton = document.getElementById('editButton');
const topWebsites = ['google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'chatgpt.com', 'x.com', 'whatsapp.com', 'reddit.com', 'wikipedia.org', 'amazon.com', 'tiktok.com', 'pinterest.com'];


const dnsServers = [
  { "name": "Shecan (شکن)", "url": "https://free.shecan.ir/dns-query", "ips": ["178.22.122.100", "185.51.200.2"] },
  { "name": "Begzar (بگذر)", "url": "https://dns.begzar.ir/dns-query", "type": "post", "allowCors": false, "ips": ["185.55.226.26", "185.55.225.25"] },
  { "name": "403.online", "url": "https://dns.403.online/dns-query", "type": "post", "allowCors": false, "ips": ["10.202.10.202", "10.202.10.102"] },
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

let dnsChart;
let chartData = [];
let resultFragment = null;

// === Normalize DoH URL ===
function normalizeDoHUrl(base) {
    if (!base) return null;
    try {
        const u = new URL(base);
        if (!/^\/dns-query(\?|$)/.test(u.pathname)) u.pathname = '/dns-query';
        return u.toString();
    } catch { return null; }
}

// === Show Best DNS ===
function showBestDNS() {
    const validServers = dnsServers.filter(s => s.speed && typeof s.speed.avg === 'number');
    const container = document.getElementById('bestDNSContainer');

    if (validServers.length === 0) {
        const bestBySuccess = [...dnsServers].sort((a, b) => {
            const aSuccess = a.individualResults?.filter(r => typeof r.speed === 'number').length || 0;
            const bSuccess = b.individualResults?.filter(r => typeof r.speed === 'number').length || 0;
            return bSuccess - aSuccess;
        })[0];

        container.innerHTML = `<div class="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-3">No reliable DNS found!</h3>
            <p class="font-mono text-lg mb-3"><strong>${bestBySuccess?.name || 'N/A'}</strong></p>
            <p class="text-gray-700 dark:text-gray-300 mb-4 break-all">${bestBySuccess?.ips?.join(', ') || 'No IP'}</p>
            <button class="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700" data-copy="${bestBySuccess?.ips?.join(', ') || ''}">Copy IPs</button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Try again later.</p>
        </div>`;
    } else {
        validServers.sort((a, b) => a.speed.avg - b.speed.avg);
        const best = validServers[0];
        const ips = best.ips?.length ? best.ips.join(', ') : 'No IP';
        container.innerHTML = `<div class="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">Best DNS for you:</h3>
            <p class="font-mono text-lg mb-3"><strong>${best.name}</strong></p>
            <p class="font-mono text-gray-700 dark:text-gray-300 mb-4 break-all">${ips}</p>
            <button class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700" data-copy="${ips}">Copy IPs</button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Use in router or game settings.</p>
        </div>`;
    }
    container.scrollIntoView({ behavior: 'smooth' });
    container.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyBestDNS(btn.dataset.copy, btn));
    });
}

function copyBestDNS(ips, btn) {
    navigator.clipboard.writeText(ips).then(() => {
        const old = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        btn.classList.replace('bg-green-600', 'bg-green-800');
        setTimeout(() => { btn.innerHTML = old; btn.classList.replace('bg-green-800', 'bg-green-600'); }, 2000);
    });
}

// === Update Chart (Once at End) ===
function updateChart() {
    const validData = chartData.filter(d => d.avg !== null).sort((a, b) => a.avg - b.avg);
    if (validData.length === 0) return;

    const ctx = document.getElementById('dnsChart').getContext('2d');
    const height = Math.max(300, Math.min(800, validData.length * 35 + 100));
    document.querySelector('.chart-container').style.height = `${height}px`;
    document.getElementById('chartContainer').classList.remove('hidden');

    if (dnsChart) dnsChart.destroy();

    dnsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: validData.map(d => d.name),
            datasets: [{
                label: 'Avg (ms)',
                data: validData.map(d => d.avg),
                backgroundColor: validData.map(d => getPerformanceColor(d.avg, validData))
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { min: 0 },
                y: { title: { display: window.innerWidth >= 768, text: 'DNS Servers' } }
            }
        }
    });
}

function getPerformanceColor(time, data) {
    const times = data.map(d => d.avg);
    const min = Math.min(...times), max = Math.max(...times);
    if (min === max) return '#22c55e80';
    const norm = (time - min) / (max - min);
    let r = norm <= 0.5 ? Math.round(255 * norm * 2) : 255;
    let g = norm <= 0.5 ? 255 : Math.round(255 * (2 - norm * 2));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}0080`;
}

// === Main Test Button ===
checkButton.addEventListener('click', async () => {
    [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = true);
    document.getElementById('loadingMessage').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'Starting...';

    chartData = [];
    resultFragment = document.createDocumentFragment();
    document.getElementById('chartContainer').classList.add('hidden');
    document.querySelector('#resultsTable tbody').innerHTML = '';

    await performDNSTests();

    document.querySelector('#resultsTable tbody').appendChild(resultFragment);
    updateChart();
    showBestDNS();

    document.getElementById('loadingMessage').classList.add('hidden');
    [checkButton, editButton, document.getElementById('editDoHButton')].forEach(b => b.disabled = false);
});

// === Perform Tests in Batches ===
async function performDNSTests() {
    const CONCURRENT = 5;
    for (let i = 0; i < dnsServers.length; i += CONCURRENT) {
        await Promise.all(dnsServers.slice(i, i + CONCURRENT).map(testServer));
        document.getElementById('loadingText').textContent = `Testing... (${Math.min(i + CONCURRENT, dnsServers.length)}/${dnsServers.length})`;
    }
}

// === Test Single Server ===
async function testServer(server) {
    const dohUrl = normalizeDoHUrl(server.url);
    if (!dohUrl) {
        server.speed = { min: 'Unavailable', median: 'Unavailable', avg: 'Unavailable', max: 'Unavailable' };
        server.individualResults = topWebsites.map(w => ({ website: w, speed: 'Unavailable' }));
        appendResultRow(server);
        return;
    }

    const results = await Promise.allSettled(topWebsites.map(host => measureDNSSpeed(dohUrl, host, server.type || 'post')));
    server.individualResults = topWebsites.map((host, i) => ({
        website: host,
        speed: results[i].status === 'fulfilled' && typeof results[i].value === 'number' ? results[i].value : 'Unavailable'
    }));

    const valid = results.filter(r => r.status === 'fulfilled' && typeof r.value === 'number').map(r => r.value).sort((a, b) => a - b);
    if (valid.length > 0) {
        const min = valid[0], max = valid[valid.length - 1];
        const mid = Math.floor(valid.length / 2);
        const median = valid.length % 2 === 1 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
        server.speed = { min, median, max, avg };
    } else {
        server.speed = { min: 'Unavailable', median: 'Unavailable', avg: 'Unavailable', max: 'Unavailable' };
    }

    appendResultRow(server);
    chartData.push({ name: server.name, avg: server.speed.avg, min: server.speed.min, max: server.speed.max });
}

// === Measure Speed with dns-packet ===
async function measureDNSSpeed(dohUrl, hostname, method = 'post') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = performance.now();

    try {
        const packet = dnsPacket.encode({
            type: 'query',
            id: Math.floor(Math.random() * 65536),
            flags: 0,
            questions: [{ type: 'A', name: hostname }]
        });

        const url = method === 'get' ? `${dohUrl}?dns=${btoa(String.fromCharCode(...packet))}` : dohUrl;
        const res = await fetch(url, {
            method: method === 'get' ? 'GET' : 'POST',
            headers: method === 'post' ? { 'Content-Type': 'application/dns-message' } : { 'Accept': 'application/dns-message' },
            body: method === 'post' ? packet : undefined,
            signal: controller.signal,
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        clearTimeout(timeout);
        return performance.now() - start;
    } catch {
        clearTimeout(timeout);
        return null;
    }
}

// === Append Row Efficiently ===
function appendResultRow(server) {
    const row = document.createElement('tr');
    row.dataset.serverName = server.name;
    row.className = 'border-b border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700';

    const ips = server.ips?.join(', ') || 'No IP';
    const url = server.url || 'N/A';

    row.innerHTML = `
        <td class="text-left py-2 px-4 dark:text-gray-300">${server.name}
            <span class="copy-btn cursor-pointer ml-2 px-2 py-1 text-xs rounded inline-flex items-center gap-1" data-copy="DoH: ${url}\\nIPs: ${ips}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy
            </span>
        </td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.min)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.median)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.avg)}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${formatSpeed(server.speed.max)}</td>
    `;

    const details = document.createElement('tr');
    details.className = 'details-row hidden border-b border-gray-300 dark:border-gray-600';
    details.innerHTML = `<td colspan="5" class="py-2 px-4 dark:bg-gray-800">
        <div>Hostname timings:</div>
        <ul>${server.individualResults.map(r => `<li>${r.website}: ${typeof r.speed === 'number' ? r.speed.toFixed(2) + ' ms' : 'Unavailable'}</li>`).join('')}</ul>
    </td>`;

    resultFragment.appendChild(row);
    resultFragment.appendChild(details);

    row.querySelector('[data-copy]').addEventListener('click', function () {
        copyToClipboard(this.dataset.copy, this);
    });
}

function formatSpeed(val) { return val !== 'Unavailable' ? val.toFixed(2) : 'Unavailable'; }

// === Sort Table with Details ===
function sortTable(col) {
    const tbody = document.querySelector('#resultsTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.details-row)'));
    const pairs = rows.map(r => [r, r.nextElementSibling?.classList.contains('details-row') ? r.nextElementSibling : null]);

    pairs.sort((a, b) => {
        const A = a[0].cells[col].textContent.trim();
        const B = b[0].cells[col].textContent.trim();
        const valA = A === 'Unavailable' ? Infinity : parseFloat(A);
        const valB = B === 'Unavailable' ? Infinity : parseFloat(B);
        return valA - valB;
    });

    pairs.forEach(([row, details]) => {
        tbody.appendChild(row);
        if (details) tbody.appendChild(details);
    });
}

// === Copy to Clipboard ===
function copyToClipboard(text, el) {
    navigator.clipboard.writeText(text).then(() => {
        el.classList.add('copied');
        el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!`;
        setTimeout(() => {
            el.classList.remove('copied');
            el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy`;
        }, 2000);
    });
}

// === Modals, Share, Resize ===
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("websiteModal");
    const dohModal = document.getElementById("dohModal");

    document.getElementById("editButton").onclick = () => { modal.style.display = "block"; renderList(); };
    document.getElementById("editDoHButton").onclick = () => dohModal.style.display = "block";

    modal.querySelector(".close").onclick = () => modal.style.display = "none";
    dohModal.querySelector(".close").onclick = () => dohModal.style.display = "none";

    document.getElementById("addHostname").onclick = () => {
        const host = validateAndExtractHost(document.getElementById("newWebsite").value);
        if (host && !topWebsites.includes(host)) topWebsites.push(host);
        else if (!host) alert("Invalid hostname!");
        document.getElementById("newWebsite").value = '';
        renderList();
    };

    document.getElementById("suggestDoHServer").onclick = () => {
        const name = document.getElementById("newDoHName").value.trim();
        const url = document.getElementById("newDoHUrl").value.trim();
        if (name && url) {
            const issuesUrl = `https://github.com/Argh94/DoHSpeedTest/issues/new?title=[DNS Suggestion] Add ${encodeURIComponent(name)}&body=${encodeURIComponent(`Name: ${name}\nDoH URL: ${url}\nIPs: ${document.getElementById("newDoHIPs").value}`)}`;
            window.open(issuesUrl, '_blank');
            dohModal.style.display = "none";
        }
    };

    function renderList() {
        const list = document.getElementById("websiteList");
        list.innerHTML = '';
        topWebsites.forEach((site, i) => {
            const li = document.createElement("li");
            li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700';
            li.innerHTML = `<span>${site}</span><button class="bg-red-500 text-white rounded px-2 py-1">Delete</button>`;
            li.querySelector("button").onclick = () => { topWebsites.splice(i, 1); renderList(); };
            list.appendChild(li);
        });
    }

    function validateAndExtractHost(input) {
        try { const u = new URL(input); return u.hostname; }
        catch { return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(input) ? input : null; }
    }

    document.getElementById('resultsTable').addEventListener('click', e => {
        const row = e.target.closest('tr');
        if (row && !row.classList.contains('details-row')) {
            const details = row.nextElementSibling;
            if (details && details.classList.contains('details-row')) details.classList.toggle('hidden');
        }
    });

    document.getElementById('cta').onclick = () => {
        if (navigator.share) navigator.share({ title: 'DoHSpeedTest', url: location.href });
        else navigator.clipboard.writeText(location.href).then(() => alert('URL copied!'));
    };

    window.onclick = e => { if (e.target === modal || e.target === dohModal) e.target.style.display = "none"; };
    window.addEventListener('resize', () => dnsChart?.resize());
});

// === Particles Animation (Optional) ===
const canvas = document.getElementById('particles-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize(); window.addEventListener('resize', resize);

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = (Math.random() - 0.5) * 1.5;
            this.radius = Math.random() * 2 + 1;
            this.color = `hsl(${Math.random() * 60 + 180}, 100%, 70%)`;
            this.life = 0; this.maxLife = Math.random() * 100 + 100;
        }
        update() {
            this.x += this.vx; this.y += this.vy; this.life++;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.shadowBlur = 10; ctx.shadowColor = this.color; ctx.fill(); ctx.shadowBlur = 0;
        }
    }

    function initParticles(n) { for (let i = 0; i < n; i++) particles.push(new Particle()); }
    function animate() {
        ctx.fillStyle = 'rgba(15,15,30,0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        particles = particles.filter(p => p.life < p.maxLife);
        if (particles.length < 80) particles.push(new Particle());
        requestAnimationFrame(animate);
    }

    initParticles(80); animate();
}
