#!/usr/bin/env python3
"""
分析所有安全工具的輸出特性
識別需要標準化的工具
"""

import re
from typing import Dict, List, Tuple

# 工具輸出特性分析
TOOL_ANALYSIS = {
    "sqlmap": {
        "issues": [
            "互動式提示 (do you want to...)",
            "CSV 文件輸出引用",
            "冗長的 ASCII art"
        ],
        "severity": "high",
        "status": "✅ 已修復",
        "fix_applied": True
    },
    
    "hydra": {
        "issues": [
            "互動式認證確認",
            "進度輸出混亂"
        ],
        "severity": "high",
        "status": "🔴 待修復",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-f", "-V", "-o /tmp/hydra.txt"],
            "parser_needed": True
        }
    },
    
    "nmap": {
        "issues": [
            "XML 輸出需解析",
            "多種輸出格式混合"
        ],
        "severity": "medium",
        "status": "🟡 部分支持（XML 解析）",
        "fix_applied": True,
        "notes": "已有 XML 解析，但可以改進"
    },
    
    "nikto": {
        "issues": [
            "HTML/CSV/TXT 多種格式",
            "輸出冗長"
        ],
        "severity": "medium",
        "status": "🟡 可改進",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-Format json"],
            "parser_needed": True
        }
    },
    
    "wpscan": {
        "issues": [
            "JSON 和文本混合輸出",
            "進度百分比"
        ],
        "severity": "medium",
        "status": "🟡 部分支持",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["--format json", "--no-banner"],
            "parser_needed": True
        }
    },
    
    "nuclei": {
        "issues": [
            "JSONL 流式輸出（每行一個 JSON）",
            "需要合併結果"
        ],
        "severity": "low",
        "status": "🟢 較好（已有 JSON）",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-json", "-silent"],
            "parser_needed": True,
            "notes": "需要將 JSONL 合併為單個 JSON 陣列"
        }
    },
    
    "john": {
        "issues": [
            "進度輸出覆蓋",
            "無結構化輸出",
            "pot 文件需讀取"
        ],
        "severity": "high",
        "status": "🔴 待修復",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["--pot=/tmp/john.pot", "--session=/tmp/john_session"],
            "parser_needed": True,
            "notes": "需要讀取 pot 文件並解析"
        }
    },
    
    "hashcat": {
        "issues": [
            "進度條（ANSI 轉義碼）",
            "狀態文件",
            "無直接結構化輸出"
        ],
        "severity": "high",
        "status": "🔴 待修復",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["--quiet", "--potfile-disable", "--outfile=/tmp/hashcat.out"],
            "parser_needed": True,
            "notes": "需要讀取 outfile"
        }
    },
    
    "gobuster": {
        "issues": [
            "進度輸出",
            "結果分散在輸出中"
        ],
        "severity": "medium",
        "status": "🟡 可改進",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-q", "-o /tmp/gobuster.txt"],
            "parser_needed": True
        }
    },
    
    "ffuf": {
        "issues": [
            "進度輸出",
            "彩色輸出（ANSI 碼）"
        ],
        "severity": "low",
        "status": "🟢 較好（有 JSON 模式）",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-json", "-o /tmp/ffuf.json", "-s"],
            "parser_needed": False,
            "notes": "直接使用 JSON 輸出即可"
        }
    },
    
    "masscan": {
        "issues": [
            "輸出格式需指定",
            "結果需整理"
        ],
        "severity": "low",
        "status": "🟡 可改進",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-oJ /tmp/masscan.json"],
            "parser_needed": False,
            "notes": "使用 JSON 輸出"
        }
    },
    
    "rustscan": {
        "issues": [
            "彩色輸出",
            "進度動畫"
        ],
        "severity": "low",
        "status": "🟢 較好",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["--no-color"],
            "parser_needed": True
        }
    },
    
    "subfinder": {
        "issues": [
            "簡單文本輸出（每行一個子域）"
        ],
        "severity": "low",
        "status": "🟢 較好（簡單格式）",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-json", "-silent"],
            "parser_needed": False
        }
    },
    
    "amass": {
        "issues": [
            "進度輸出",
            "多種輸出格式"
        ],
        "severity": "medium",
        "status": "🟡 可改進",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-json /tmp/amass.json", "-silent"],
            "parser_needed": False
        }
    },
    
    "metasploit": {
        "issues": [
            "互動式 console",
            "需要 resource 腳本",
            "輸出難以解析"
        ],
        "severity": "critical",
        "status": "🔴 待修復",
        "fix_applied": False,
        "suggested_fix": {
            "params": ["-q", "-x"],
            "parser_needed": True,
            "notes": "需要使用 RPC API 或解析 resource 腳本輸出"
        }
    }
}


def generate_priority_list() -> List[Tuple[str, Dict]]:
    """生成優先級排序的工具列表"""
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    
    tools = [
        (name, info) 
        for name, info in TOOL_ANALYSIS.items() 
        if not info.get("fix_applied", False)
    ]
    
    tools.sort(key=lambda x: (
        severity_order.get(x[1]["severity"], 99),
        x[0]
    ))
    
    return tools


def generate_report():
    """生成分析報告"""
    print("=" * 80)
    print("🔍 安全工具輸出特性分析報告")
    print("=" * 80)
    print()
    
    # 統計
    total = len(TOOL_ANALYSIS)
    fixed = sum(1 for info in TOOL_ANALYSIS.values() if info.get("fix_applied", False))
    pending = total - fixed
    
    print(f"📊 總計: {total} 個工具")
    print(f"✅ 已修復: {fixed} 個")
    print(f"🔴 待修復: {pending} 個")
    print(f"📈 完成率: {fixed/total*100:.1f}%")
    print()
    
    # 按嚴重程度分組
    print("=" * 80)
    print("🎯 按嚴重程度分類")
    print("=" * 80)
    print()
    
    for severity in ["critical", "high", "medium", "low"]:
        tools = [
            (name, info) 
            for name, info in TOOL_ANALYSIS.items() 
            if info["severity"] == severity
        ]
        
        if tools:
            emoji = {"critical": "🔥", "high": "🔴", "medium": "🟡", "low": "🟢"}
            print(f"{emoji[severity]} {severity.upper()} ({len(tools)} 個)")
            print("-" * 80)
            
            for name, info in tools:
                print(f"  {info['status']} {name}")
                for issue in info["issues"]:
                    print(f"      - {issue}")
                print()
    
    # 優先修復清單
    print("=" * 80)
    print("🚀 建議修復順序（未修復工具）")
    print("=" * 80)
    print()
    
    priority_list = generate_priority_list()
    
    for idx, (name, info) in enumerate(priority_list, 1):
        print(f"{idx}. {name.upper()} ({info['severity']})")
        print(f"   問題:")
        for issue in info["issues"]:
            print(f"     - {issue}")
        
        if "suggested_fix" in info:
            fix = info["suggested_fix"]
            print(f"   建議修復:")
            print(f"     參數: {' '.join(fix['params'])}")
            print(f"     需要解析器: {'是' if fix.get('parser_needed') else '否'}")
            if "notes" in fix:
                print(f"     備註: {fix['notes']}")
        print()
    
    # 實施建議
    print("=" * 80)
    print("📝 實施建議")
    print("=" * 80)
    print()
    
    print("Phase 1 (本週) - 高優先級工具:")
    print("  1. ✅ SQLMap (已完成)")
    print("  2. 🔴 Hydra")
    print("  3. 🔴 John the Ripper")
    print("  4. 🔴 Hashcat")
    print()
    
    print("Phase 2 (下週) - 中優先級工具:")
    print("  1. 🟡 Nikto")
    print("  2. 🟡 WPScan")
    print("  3. 🟡 Gobuster")
    print("  4. 🟡 Amass")
    print()
    
    print("Phase 3 (未來) - 低優先級工具:")
    print("  1. 🟢 Nuclei (已有 JSON，需整合)")
    print("  2. 🟢 Ffuf (已有 JSON)")
    print("  3. 🟢 Subfinder (簡單格式)")
    print("  4. 🟢 Rustscan (移除彩色)")
    print()
    
    print("=" * 80)
    print("🎯 建議")
    print("=" * 80)
    print()
    print("1. 創建統一的 BaseParser 類別")
    print("2. 為每個工具實作專門的解析器")
    print("3. 建立解析器測試套件")
    print("4. 前端統一使用標準化響應格式")
    print("5. 文件化所有工具的參數和輸出格式")
    print()


def generate_implementation_template(tool_name: str):
    """生成工具修復模板"""
    if tool_name not in TOOL_ANALYSIS:
        print(f"❌ 工具 '{tool_name}' 不在分析清單中")
        return
    
    info = TOOL_ANALYSIS[tool_name]
    
    print(f"# {tool_name.upper()} 修復模板")
    print()
    print("## 1. 解析器 (`tools/parsers/{}_parser.py`)".format(tool_name))
    print()
    print("```python")
    print(f'"""')
    print(f"{tool_name.upper()} 輸出解析器")
    print(f'"""')
    print()
    print("from typing import Dict, Any")
    print()
    print()
    print(f"class {tool_name.title()}Parser:")
    print(f'    """解析 {tool_name.upper()} 輸出"""')
    print()
    print("    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:")
    print("        result = {")
    print('            "findings": [],')
    print('            "summary": {},')
    print('            "warnings": [],')
    print('            "recommendations": []')
    print("        }")
    print("        ")
    print("        # TODO: 實作解析邏輯")
    print("        ")
    print("        return result")
    print()
    print()
    print(f"def parse_{tool_name}_output(stdout: str, stderr: str = '', return_code: int = 0):")
    print(f"    parser = {tool_name.title()}Parser()")
    print("    return parser.parse(stdout, stderr, return_code)")
    print("```")
    print()
    
    print("## 2. 端點修改 (`hexstrike_server.py`)")
    print()
    print("```python")
    print(f'@app.route("/api/tools/{tool_name}", methods=["POST"])')
    print(f"def {tool_name}():")
    print(f'    """Execute {tool_name} with intelligent parsing"""')
    print("    try:")
    print("        params = request.json")
    print("        ")
    print("        # 建構命令")
    print(f"        command = '{tool_name}'")
    
    if "suggested_fix" in info and "params" in info["suggested_fix"]:
        for param in info["suggested_fix"]["params"]:
            print(f"        command += ' {param}'")
    
    print("        ")
    print("        # 執行")
    print("        result = execute_command(command)")
    print("        ")
    print("        # 解析")
    print("        if result.get('success'):")
    print("            import sys")
    print("            sys.path.insert(0, '/app/tools/parsers')")
    print(f"            from {tool_name}_parser import parse_{tool_name}_output")
    print("            ")
    print(f"            parsed = parse_{tool_name}_output(")
    print("                result.get('stdout', ''),")
    print("                result.get('stderr', ''),")
    print("                result.get('return_code', 0)")
    print("            )")
    print("            ")
    print("            # 返回標準化響應")
    print("            return jsonify({")
    print("                'success': True,")
    print(f"                'tool': '{tool_name}',")
    print("                'summary': parsed['summary'],")
    print("                'findings': parsed['findings'],")
    print("                'metadata': {")
    print("                    'warnings': parsed['warnings'],")
    print("                    'recommendations': parsed['recommendations']")
    print("                },")
    print("                'raw_output': result")
    print("            })")
    print("        ")
    print("        return jsonify(result)")
    print("    except Exception as e:")
    print("        return jsonify({'error': str(e)}), 500")
    print("```")
    print()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # 生成特定工具的模板
        tool = sys.argv[1].lower()
        generate_implementation_template(tool)
    else:
        # 生成完整報告
        generate_report()

