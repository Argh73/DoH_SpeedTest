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

// Helper function to normalize DoH URLs
function normalizeDoHUrl(base) {
  if (!base) return null;
  try {
    const u = new URL(base);
    if (!/^\/dns-query(\?|$)/.test(u.pathname)) {
      u.pathname = '/dns-query';
    }
    return u.toString();
  } catch {
    return null;
  }
}

function showBestDNS() {
    const validServers = dnsServers.filter(s => s.speed && typeof s.speed.avg === 'number');
    
    if (validServers.length === 0) {
        // Show the server with the fewest failures
        const bestBySuccess = [...dnsServers].sort((a, b) => {
            const aSuccess = a.individualResults.filter(r => typeof r.speed === 'number').length;
            const bSuccess = b.individualResults.filter(r => typeof r.speed === 'number').length;
            return bSuccess - aSuccess;
        })[0];

        document.getElementById('bestDNSContainer').innerHTML = `
            <div class="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <h3 class="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-3">No reliable DNS found!</h3>
                <p class="font-mono text-lg mb-3"><strong>${bestBySuccess ? bestBySuccess.name : 'No server available'}</strong></p>
                <p class="text-gray-700 dark:text-gray-300 mb-4 break-all">${bestBySuccess && bestBySuccess.ips ? bestBySuccess.ips.join(', ') : 'No IP available'}</p>
                <button onclick="copyBestDNS('${bestBySuccess && bestBySuccess.ips ? bestBySuccess.ips.join(', ') : 'No IP available'}', this)" class="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">
                    Copy IPs
                </button>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">All DNS servers failed to respond reliably. Try running the test again.</p>
            </div>
        `;
        document.getElementById('bestDNSContainer').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    
    validServers.sort((a, b) => a.speed.avg - b.speed.avg);
    const best = validServers[0];
    const ips = best.ips && best.ips.length > 0 ? best.ips.join(', ') : 'No IP available';
    document.getElementById('bestDNSContainer').innerHTML = `
        <div class="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
            <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-3">Best DNS for you:</h3>
            <p class="font-mono text-lg mb-3"><strong>${best.name}</strong></p>
            <p class="font-mono text-gray-700 dark:text-gray-300 mb-4 break-all">${ips}</p>
            <button onclick="copyBestDNS('${ips.replace(/'/g, "\\'")}', this)" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Copy IPs
            </button>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">Use these IPs in your network, router, or game settings.</p>
        </div>
    `;
    document.getElementById('bestDNSContainer').scrollIntoView({ behavior: 'smooth' });
}

function copyBestDNS(ips, btn) {
    navigator.clipboard.writeText(ips).then(() => {
        const old = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        btn.classList.replace('bg-green-600', 'bg-green-800');
        setTimeout(() => {
            btn.innerHTML = old;
            btn.classList.replace('bg-green-800', 'bg-green-600');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        btn.innerHTML = 'Error!';
        btn.classList.replace('bg-green-600', 'bg-red-600');
        setTimeout(() => {
            btn.innerHTML = old;
            btn.classList.replace('bg-red-600', 'bg-green-600');
        }, 2000);
    });
}

function updateChartWithData(server) {
    const existingIndex = chartData.findIndex(item => item.name === server.name);
    const serverInfo = {
        name: server.name,
        avg: server.speed && typeof server.speed.avg === 'number' ? server.speed.avg : null,
        min: server.speed && typeof server.speed.min === 'number' ? server.speed.min : null,
        max: server.speed && typeof server.speed.max === 'number' ? server.speed.max : null
    };

    if (existingIndex === -1) {
        chartData.push(serverInfo);
    } else {
        chartData[existingIndex] = serverInfo;
    }

    updateChart();
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

checkButton.addEventListener('click', async function () {
    this.disabled = true;
    editButton.disabled = true;
    document.getElementById('editDoHButton').disabled = true;
    document.getElementById('loadingMessage').classList.remove('hidden');
    document.getElementById('loadingText').textContent = 'Starting DNS tests...';
    
    chartData = [];
    document.getElementById('chartContainer').classList.add('hidden');

    await performDNSTests();

    document.getElementById('loadingMessage').classList.add('hidden');
    this.disabled = false;
    editButton.disabled = false;
    document.getElementById('editDoHButton').disabled = false;
});

async function performDNSTests() {
    // Process DNS servers in parallel but limit concurrent connections to avoid overwhelming the browser
    const CONCURRENT_LIMIT = 5;
    
    for (let i = 0; i < dnsServers.length; i += CONCURRENT_LIMIT) {
        const batch = dnsServers.slice(i, i + CONCURRENT_LIMIT);
        await Promise.all(batch.map(async server => {
            const dohUrl = normalizeDoHUrl(server.url);
            if (!dohUrl) {
                server.speed = {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable'};
                server.individualResults = topWebsites.map(website => ({website, speed: 'Unavailable'}));
                return;
            }
            
            const speedResults = await Promise.allSettled(
                topWebsites.map(website => measureDNSSpeed(dohUrl, website, server.type, server.allowCors))
            );
            
            server.individualResults = topWebsites.map((website, index) => {
                const result = speedResults[index];
                const speed = result.status === 'fulfilled' && typeof result.value === 'number' 
                    ? result.value 
                    : 'Unavailable';
                return {website, speed};
            });
            
            const validResults = speedResults
                .filter(r => r.status === 'fulfilled' && typeof r.value === 'number')
                .map(r => r.value)
                .sort((a, b) => a - b);
            
            if (validResults.length > 0) {
                const min = validResults[0];
                const max = validResults[validResults.length - 1];
                
                // Fix median calculation
                const mid = Math.floor(validResults.length / 2);
                const median = validResults.length % 2 
                    ? validResults[mid]
                    : (validResults[mid - 1] + validResults[mid]) / 2;
                
                const avg = validResults.reduce((sum, val) => sum + val, 0) / validResults.length;
                
                server.speed = {min, median, max, avg};
            } else {
                server.speed = {min: 'Unavailable', median: 'Unavailable', max: 'Unavailable', avg: 'Unavailable'};
            }
            
            updateResult(server);
        }));
        
        // Update loading message for each batch
        document.getElementById('loadingText').textContent = `Testing DNS servers... (${Math.min(i + CONCURRENT_LIMIT, dnsServers.length)}/${dnsServers.length})`;
    }
    
    showBestDNS();
}

async function measureDNSSpeed(dohUrl, hostname, serverType = 'post', allowCors = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const startTime = performance.now();

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

            const response = await fetch(urlWithParam, fetchOptions);
            
            // Only check response.ok if we're in CORS mode
            if (allowCors && !response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } else {
            const dnsQuery = buildDNSQuery(hostname);
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

            const response = await fetch(dohUrl, fetchOptions);
            
            // Only check response.ok if we're in CORS mode
            if (allowCors && !response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }

        clearTimeout(timeoutId);
        const endTime = performance.now();
        return endTime - startTime;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name !== 'AbortError') {
            console.debug('DNS speed measure failed:', error);
        }
        return null;
    }
}

function buildDNSQuery(hostname) {
    const header = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const labels = hostname.split('.');
    const question = labels.flatMap(label => {
        const length = label.length;
        return [length, ...Array.from(label).map(c => c.charCodeAt(0))];
    });
    const typeAndClass = new Uint8Array([0x00, 0x01, 0x00, 0x01]);
    const query = new Uint8Array(header.length + question.length + 2 + typeAndClass.length);
    query.set(header);
    query.set(question, header.length);
    query.set([0x00], header.length + question.length);
    query.set(typeAndClass, header.length + question.length + 1);
    return query;
}

function updateResult(server) {
    const table = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    let row = document.querySelector(`tr[data-server-name="${server.name}"]`);
    let detailsRow;

    if (!row) {
        row = document.createElement('tr');
        row.setAttribute('data-server-name', server.name);
        row.classList.add('border-b', 'border-gray-300', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700');
        table.appendChild(row);

        detailsRow = document.createElement('tr');
        detailsRow.classList.add('details-row', 'hidden', 'border-b', 'border-gray-300', 'hover:bg-gray-200', 'dark:border-gray-600', 'dark:hover:bg-gray-700');
        table.appendChild(detailsRow);
    } else {
        detailsRow = row.nextElementSibling;
    }

    row.innerHTML = `
        <td class="text-left py-2 px-4 dark:text-gray-300">${server.name} 
        <span class="copy-btn cursor-pointer ml-2 px-2 py-1 text-xs rounded flex items-center gap-1 transition-all duration-200 hover:-translate-y-0.5 select-none inline-flex" onclick="copyToClipboard('DoH Server URL: ${server.url}' + '\\n' + 'IP Addresses: ${server.ips.join(', ')}', this)" title="Copy server details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
        </span></td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.min !== 'Unavailable' ? server.speed.min.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.median !== 'Unavailable' ? server.speed.median.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300"> ${server.speed.avg !== 'Unavailable' ? server.speed.avg.toFixed(2) : 'Unavailable'}</td>
        <td class="text-center py-2 px-4 dark:text-gray-300">${server.speed.max !== 'Unavailable' ? server.speed.max.toFixed(2) : 'Unavailable'}</td>
    `;

    detailsRow.innerHTML = `
    <td colspan="4" class="py-2 px-4 dark:bg-gray-800 dark:text-gray-300">
        <div>Timings for each hostname:</div>
        <ul>
            ${server.individualResults.map(result => {
        if (typeof result.speed === 'number') {
            return `<li>${result.website}: ${result.speed.toFixed(2)} ms</li>`;
        } else {
            return `<li>${result.website}: Unavailable</li>`;
        }
    }).join('')}
        </ul>
    </td>
`;

    updateChartWithData(server);
}

function sortTable(columnIndex) {
    const table = document.getElementById('resultsTable');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.details-row)'));
    
    const rowPairs = rows.map(row => {
        const detailsRow = row.nextElementSibling && row.nextElementSibling.classList.contains('details-row') 
            ? row.nextElementSibling 
            : null;
        return [row, detailsRow];
    });

    rowPairs.sort((a, b) => {
        const cellA = a[0].cells[columnIndex]?.textContent.trim();
        const cellB = b[0].cells[columnIndex]?.textContent.trim();

        if (!cellA || !cellB) {
            console.error("Undefined cell encountered", {
                cellA, cellB, rowIndexA: a[0].rowIndex, rowIndexB: b[0].rowIndex
            });
            return 0;
        }

        const valA = cellA === 'Unavailable' ? Number.POSITIVE_INFINITY : parseFloat(cellA) || 0;
        const valB = cellB === 'Unavailable' ? Number.POSITIVE_INFINITY : parseFloat(cellB) || 0;

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    // Re-append rows in sorted order
    rowPairs.forEach(pair => {
        tbody.appendChild(pair[0]);
        if (pair[1]) tbody.appendChild(pair[1]);
    });
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        buttonElement.classList.add('copied');
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            buttonElement.classList.remove('copied');
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy
            `;
        }, 2000);
    }).catch(err => {
        console.error('Error in copying text: ', err);
        buttonElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Error
        `;
        setTimeout(() => {
            buttonElement.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                Copy
            `;
        }, 2000);
    });
}

document.getElementById('cta').addEventListener('click', function () {
    if (navigator.share) {
        navigator.share({
            title: 'Find the Fastest DNS Server for You',
            text: 'Check out this tool to find the fastest DNS server for your location!',
            url: window.location.href
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(console.error);
    } else {
        // Fallback to copy URL
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('URL copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy URL: ', err);
        });
    }
});

window.addEventListener('resize', function () {
    if (dnsChart) {
        dnsChart.resize();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById("websiteModal");
    const btn = document.getElementById("editButton");
    const span = document.getElementsByClassName("close")[0];
    const addBtn = document.getElementById("addHostname");
    const input = document.getElementById("newWebsite");
    const list = document.getElementById("websiteList");

    function renderList() {
        list.innerHTML = '';
        topWebsites.forEach((site, index) => {
            const li = document.createElement("li");
            li.className = 'px-2 py-1 mb-1 bg-gray-200 rounded flex justify-between items-center border-b border-gray-300 dark:bg-gray-700 dark:border-gray-600';

            const siteText = document.createElement("span");
            siteText.textContent = site;
            li.appendChild(siteText);

            const removeBtn = document.createElement("button");
            removeBtn.className = 'bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800';
            removeBtn.textContent = 'Delete';
            removeBtn.onclick = function () {
                topWebsites.splice(index, 1);
                renderList();
            };

            li.appendChild(removeBtn);
            list.appendChild(li);
        });
        checkButton.disabled = topWebsites.length === 0;
    }

    btn.onclick = function () {
        modal.style.display = "block";
        renderList();
    }

    function validateAndExtractHost(input) {
        // Allow full URLs
        try {
            const url = new URL(input);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
            return url.hostname;
        } catch (e) {
            // Or just hostname
            const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z]{2,})+$/;
            if (hostnameRegex.test(input)) {
                return input;
            } else {
                return null;
            }
        }
    }

    span.onclick = function () {
        modal.style.display = "none";
    }

    addBtn.onclick = function () {
        const host = validateAndExtractHost(input.value);
        if (host) {
            if (!topWebsites.includes(host)) {
                topWebsites.push(host);
                renderList();
            } else {
                alert("This website is already in the list.");
            }
        } else {
            alert("Please enter a valid URL or hostname.");
        }
        input.value = '';
    }

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }

    const dohModal = document.getElementById("dohModal");
    const dohBtn = document.getElementById("editDoHButton");
    const closeDohBtn = dohModal.querySelector(".close");
    const addDoHBtn = document.getElementById("suggestDoHServer");
    const newDoHName = document.getElementById("newDoHName");
    const newDoHUrl = document.getElementById("newDoHUrl");
    const newDoHIPs = document.getElementById("newDoHIPs");

    dohBtn.onclick = function () {
        dohModal.style.display = "block";
    };

    closeDohBtn.onclick = function () {
        dohModal.style.display = "none";
    };

    addDoHBtn.onclick = function () {
        const name = newDoHName.value.trim();
        const url = newDoHUrl.value.trim();
        const ips = newDoHIPs.value.trim();

        if (!name || !url) {
            alert('Please fill in Name and URL.');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            alert('Please enter a valid URL.');
            return;
        }

        const title = encodeURIComponent(`[DNS Suggestion] Add ${name}`);
        const body = encodeURIComponent(
            `**Suggested DNS Server**\n\n` +
            `- **Name**: ${name}\n` +
            `- **DoH URL**: ${url}\n` +
            `- **IPs**: ${ips || 'Not provided'}\n\n` +
            `Submitted via DoHSpeedTest tool.`
        );

        const issuesUrl = `https://github.com/Argh94/DoHSpeedTest/issues/new?title=${title}&body=${body}`;
        window.open(issuesUrl, '_blank');
        dohModal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === dohModal) {
            dohModal.style.display = "none";
        }
    };
    
    // Table row toggle for details
    document.getElementById('resultsTable').addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row && !row.classList.contains('details-row')) {
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                detailsRow.classList.toggle('hidden');
            }
        }
    });
});
