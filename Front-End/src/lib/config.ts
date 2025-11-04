/**
 * HexStrike AI Frontend Configuration
 * 
 * 集中管理 API URL 和其他配置
 */

// API Base URL - 從環境變數讀取,或使用預設值
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_HEXSTRIKE_API_URL || 
  'https://hexstrike-ai.dennisleehappy.org'

// API Endpoints
export const API_ENDPOINTS = {
  health: '/health',
  telemetry: '/api/telemetry',
  
  // Tools endpoints
  tools: {
    nmap: '/api/tools/nmap',
    nmapAdvanced: '/api/tools/nmap-advanced',
    masscan: '/api/tools/masscan',
    rustscan: '/api/tools/rustscan',
    subfinder: '/api/tools/subfinder',
    amass: '/api/tools/amass',
    fierce: '/api/tools/fierce',
    dnsenum: '/api/tools/dnsenum',
    autorecon: '/api/tools/autorecon',
    arpScan: '/api/tools/arp-scan',
    nbtscan: '/api/tools/nbtscan',
    smbmap: '/api/tools/smbmap',
    enum4linux: '/api/tools/enum4linux',
    enum4linuxNg: '/api/tools/enum4linux-ng',
    rpcclient: '/api/tools/rpcclient',
    responder: '/api/tools/responder',
    
    // Web tools
    gobuster: '/api/tools/gobuster',
    dirb: '/api/tools/dirb',
    dirsearch: '/api/tools/dirsearch',
    ffuf: '/api/tools/ffuf',
    wfuzz: '/api/tools/wfuzz',
    nikto: '/api/tools/nikto',
    sqlmap: '/api/tools/sqlmap',
    xsser: '/api/tools/xsser',
    wpscan: '/api/tools/wpscan',
    zap: '/api/tools/zap',
    burpsuiteAlternative: '/api/tools/burpsuite-alternative',
    wafw00f: '/api/tools/wafw00f',
    httpx: '/api/tools/httpx',
    katana: '/api/tools/katana',
    hakrawler: '/api/tools/hakrawler',
    gau: '/api/tools/gau',
    waybackurls: '/api/tools/waybackurls',
    paramspider: '/api/tools/paramspider',
    arjun: '/api/tools/arjun',
    dalfox: '/api/tools/dalfox',
    jwtAnalyzer: '/api/tools/jwt-analyzer',
    apiFuzzer: '/api/tools/api-fuzzer',
    apiSchemaAnalyzer: '/api/tools/api-schema-analyzer',
    graphqlScanner: '/api/tools/graphql-scanner',
    dotdotpwn: '/api/tools/dotdotpwn',
    jaeles: '/api/tools/jaeles',
    browserAgent: '/api/tools/browser-agent',
    httpFramework: '/api/tools/http-framework',
    x8: '/api/tools/x8',
    anew: '/api/tools/anew',
    qsreplace: '/api/tools/qsreplace',
    uro: '/api/tools/uro',
    
    // Auth tools
    hydra: '/api/tools/hydra',
    medusa: '/api/tools/medusa',
    netexec: '/api/tools/netexec',
    hashcat: '/api/tools/hashcat',
    john: '/api/tools/john',
    
    // Binary tools
    gdb: '/api/tools/gdb',
    gdbPeda: '/api/tools/gdb-peda',
    ghidra: '/api/tools/ghidra',
    radare2: '/api/tools/radare2',
    angr: '/api/tools/angr',
    pwntools: '/api/tools/pwntools',
    ropgadget: '/api/tools/ropgadget',
    ropper: '/api/tools/ropper',
    oneGadget: '/api/tools/one-gadget',
    libcDatabase: '/api/tools/libc-database',
    checksec: '/api/tools/checksec',
    binwalk: '/api/tools/binwalk',
    strings: '/api/tools/strings',
    objdump: '/api/tools/objdump',
    xxd: '/api/tools/xxd',
    pwninit: '/api/tools/pwninit',
    
    // Forensics tools
    volatility: '/api/tools/volatility',
    volatility3: '/api/tools/volatility3',
    foremost: '/api/tools/foremost',
    exiftool: '/api/tools/exiftool',
    steghide: '/api/tools/steghide',
    hashpump: '/api/tools/hashpump',
    
    // Exploitation tools
    metasploit: '/api/tools/metasploit',
    msfvenom: '/api/tools/msfvenom',
    
    // Cloud tools
    prowler: '/api/tools/prowler',
    scoutSuite: '/api/tools/scout-suite',
    pacu: '/api/tools/pacu',
    cloudmapper: '/api/tools/cloudmapper',
    kubeBench: '/api/tools/kube-bench',
    kubehunter: '/api/tools/kubehunter',
    trivy: '/api/tools/trivy',
    clair: '/api/tools/clair',
    dockerBenchSecurity: '/api/tools/docker-bench-security',
    terrascan: '/api/tools/terrascan',
    checkov: '/api/tools/checkov',
    falco: '/api/tools/falco',
  }
}

/**
 * 建構完整的 API URL
 * @param endpoint - API 端點路徑
 * @returns 完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`
}

/**
 * 建構工具 API URL
 * @param toolName - 工具名稱
 * @returns 完整的工具 API URL
 */
export function getToolApiUrl(toolName: keyof typeof API_ENDPOINTS.tools): string {
  return `${API_BASE_URL}${API_ENDPOINTS.tools[toolName]}`
}

