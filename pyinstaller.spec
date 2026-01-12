# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller 配置文件用於打包 HexStrike AI 後端
"""

import sys
import os
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# 收集所有需要包含的數據文件
datas = [
    ('config', 'config'),
    ('core', 'core'),
    ('api', 'api'),
    ('agents', 'agents'),
    ('integrations', 'integrations'),
    ('monitoring', 'monitoring'),
    ('services', 'services'),
]

# 收集隱藏導入
hiddenimports = [
    'flask',
    'flask_cors',
    'fastmcp',
    'requests',
    'psutil',
    'selenium',
    'beautifulsoup4',
    'aiohttp',
    'prometheus_client',
    'grafana_api',
    'openai',
    'langchain',
    'langchain_openai',
    'langchain_community',
    'chromadb',
    'tiktoken',
    'tenacity',
]

# 添加核心模組的隱藏導入
hiddenimports += collect_submodules('core')
hiddenimports += collect_submodules('api')
hiddenimports += collect_submodules('agents')
hiddenimports += collect_submodules('integrations')

a = Analysis(
    ['hexstrike_server.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'matplotlib',
        'tkinter',
        'PyQt5',
        'PyQt6',
        'pytest',
        'IPython',
        'jupyter',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='hexstrike-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # 保留控制台以查看日誌
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # 可以在這裡添加圖標路徑
)
