FROM kalilinux/kali-rolling:latest
#FROM kalilinux/kali-rolling:2024.3

# 設定環境變數
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    HEXSTRIKE_PORT=8888 \
    HEXSTRIKE_HOST=0.0.0.0

# 更新系統並安裝核心安全工具包
RUN apt-get update && apt-get upgrade -y

# 安裝基礎工具
RUN apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    git \
    curl \
    wget \
    unzip \
    sudo \
    build-essential \
    libssl-dev \
    libffi-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝核心安全工具（分批安裝以避免失敗）
RUN apt-get update && apt-get install -y \
    nmap \
    gobuster \
    nikto \
    sqlmap \
    hydra \
    john \
    hashcat \
    || echo "Some core tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝額外工具
RUN apt-get update && apt-get install -y \
    masscan \
    amass \
    subfinder \
    fierce \
    dnsenum \
    theharvester \
    enum4linux-ng \
    || echo "Some network tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Web 應用程式安全測試工具
RUN apt-get update && apt-get install -y \
    ffuf \
    dirb \
    dirsearch \
    nuclei \
    wpscan \
    httpx-toolkit \
    wafw00f \
    || echo "Some web tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝密碼破解與認證工具
RUN apt-get update && apt-get install -y \
    medusa \
    evil-winrm \
    || echo "Some auth tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝二進制分析與逆向工程工具
RUN apt-get update && apt-get install -y \
    radare2 \
    binwalk \
    gdb \
    checksec \
    binutils \
    || echo "Some binary analysis tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝取證與 CTF 工具
RUN apt-get update && apt-get install -y \
    foremost \
    steghide \
    exiftool \
    autopsy \
    sleuthkit \
    || echo "Some forensics tools failed to install, continuing..." \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝額外的 Go 基礎工具（部分工具需要）
RUN apt-get update && apt-get install -y golang-go && apt-get clean

# 設定 Go 環境變數（在安裝 Go 工具前）
ENV GOPATH=/root/go
ENV PATH="${GOPATH}/bin:/usr/local/go/bin:${PATH}"

# 安裝 Rust 和 Cargo（用於 Rustscan）
RUN apt-get update && apt-get install -y \
    cargo \
    rustc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝 Rustscan（超快速端口掃描器）
RUN cargo install rustscan || echo "⚠️ Rustscan installation failed, continuing..."

# 安裝 Dalfox（XSS 掃描工具）
RUN GO111MODULE=on go install github.com/hahwul/dalfox/v2@latest || echo "⚠️ Dalfox installation failed, continuing..."

# 安裝 Feroxbuster（目錄爆破工具）
RUN curl -sL https://github.com/epi052/feroxbuster/releases/download/v2.10.1/x86_64-linux-feroxbuster.tar.gz | tar -xzC /usr/local/bin || \
    echo "⚠️ Feroxbuster installation failed, continuing..."

# 安裝 pwntools 相關工具
RUN apt-get update && apt-get install -y \
    python3-pwntools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安裝 AutoRecon（Python 自動化偵察工具）
# 注意：先在虛擬環境中安裝，稍後會在虛擬環境中再次安裝
RUN apt-get update && apt-get install -y \
    python3-setuptools \
    seclists \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製 Python 依賴檔案
COPY requirements.txt .

# 安裝 Python 依賴（使用虛擬環境）
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 安裝 AutoRecon 在虛擬環境中
RUN pip install --no-cache-dir git+https://github.com/Tib3rius/AutoRecon.git || \
    echo "⚠️ AutoRecon installation failed, continuing..."

# 確保 Cargo bin 在 PATH 中（用於 Rustscan）
ENV PATH="/root/.cargo/bin:${PATH}"

# 複製專案檔案
COPY hexstrike_server.py hexstrike_mcp.py ./
COPY assets/ ./assets/
COPY templates/ ./templates/
COPY static/ ./static/

# 建立日誌目錄
RUN mkdir -p /app/logs

# 複製並設定啟動腳本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 暴露 API 端口
EXPOSE 8888

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8888/health || exit 1

# 使用非 root 用戶運行（安全考量）
RUN useradd -m -u 1000 hexstrike && \
    chown -R hexstrike:hexstrike /app
USER hexstrike

# 啟動服務
ENTRYPOINT ["/docker-entrypoint.sh"]



