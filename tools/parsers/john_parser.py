"""
John the Ripper 輸出解析器
解析 John the Ripper 密碼破解工具的輸出
"""

import re
import os
from typing import Dict, List, Any, Optional
from .base_parser import BaseParser


class JohnParser(BaseParser):
    """John the Ripper 輸出解析器"""
    
    def __init__(self, pot_file: str = "/tmp/john.pot"):
        super().__init__()
        self.pot_file = pot_file
    
    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:
        """
        解析 John the Ripper 輸出
        
        Returns:
            標準化的結果字典
        """
        # 清理 ANSI 碼
        stdout = self.clean_ansi_codes(stdout)
        
        # 從 stdout 解析已破解的密碼
        cracked_from_stdout = self._parse_cracked_passwords(stdout)
        
        # 從 pot 文件讀取已破解的密碼
        cracked_from_pot = self._read_pot_file()
        
        # 合併結果
        all_cracked = self._merge_cracked(cracked_from_stdout, cracked_from_pot)
        
        # 解析統計資訊
        stats = self._parse_statistics(stdout)
        
        # 解析警告
        self._parse_warnings(stdout, stderr)
        
        # 生成發現
        if all_cracked:
            for cred in all_cracked:
                self.add_finding(
                    finding_type="cracked_password",
                    severity="high",
                    description=f"密碼已破解: {cred.get('username', 'N/A')}",
                    evidence=cred,
                    recommendation="立即更改此密碼並使用更強的密碼策略",
                    username=cred.get("username"),
                    password=cred.get("password"),
                    hash=cred.get("hash"),
                    hash_type=cred.get("hash_type")
                )
        
        # 生成建議
        self._generate_recommendations(all_cracked, stats)
        
        # 構建詳細資訊
        details = {
            "cracked_count": len(all_cracked),
            "cracked_passwords": all_cracked,
            "statistics": stats
        }
        
        return {
            "findings": self.findings,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
            "test_summary": self.generate_summary(self.findings),
            "details": details
        }
    
    def _parse_cracked_passwords(self, stdout: str) -> List[Dict[str, str]]:
        """從 stdout 解析已破解的密碼"""
        cracked = []
        
        # John 輸出格式示例:
        # admin:password123 (user)
        # root:$1$salt$hash
        # user1            (password1)
        
        for line in stdout.split('\n'):
            line = line.strip()
            
            # 跳過空行和非結果行
            if not line or line.startswith('[') or line.startswith('Loaded'):
                continue
            
            # 格式 1: username:password
            if ':' in line and not line.startswith('#'):
                parts = line.split(':', 1)
                if len(parts) == 2:
                    username = parts[0].strip()
                    # 密碼可能包含 (hash_type) 後綴
                    password_part = parts[1].strip()
                    
                    # 提取密碼和可選的 hash 類型
                    password = password_part
                    hash_type = None
                    
                    # 檢查是否有括號中的信息
                    paren_match = re.search(r'\(([^)]+)\)$', password_part)
                    if paren_match:
                        hash_type = paren_match.group(1)
                        password = password_part[:paren_match.start()].strip()
                    
                    cracked.append({
                        "username": username,
                        "password": password,
                        "hash_type": hash_type
                    })
            
            # 格式 2: username            (password)
            paren_match = re.search(r'^(\S+)\s+\(([^)]+)\)$', line)
            if paren_match:
                username = paren_match.group(1)
                password = paren_match.group(2)
                cracked.append({
                    "username": username,
                    "password": password
                })
        
        return cracked
    
    def _read_pot_file(self) -> List[Dict[str, str]]:
        """從 pot 文件讀取已破解的密碼"""
        cracked = []
        
        if not os.path.exists(self.pot_file):
            return cracked
        
        try:
            with open(self.pot_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    
                    # Pot 文件格式: hash:password
                    if ':' in line:
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            hash_value = parts[0]
                            password = parts[1]
                            
                            cracked.append({
                                "hash": hash_value,
                                "password": password
                            })
        except Exception as e:
            self.add_warning(f"無法讀取 pot 文件: {str(e)}")
        
        return cracked
    
    def _merge_cracked(
        self,
        from_stdout: List[Dict],
        from_pot: List[Dict]
    ) -> List[Dict]:
        """合併兩個來源的破解結果"""
        merged = {}
        
        # 首先添加 stdout 的結果（包含用戶名）
        for cred in from_stdout:
            key = cred.get("username") or cred.get("hash") or cred.get("password")
            if key:
                merged[key] = cred
        
        # 然後添加 pot 文件的結果
        for cred in from_pot:
            password = cred.get("password")
            if password and password not in [c.get("password") for c in merged.values()]:
                # 如果密碼不存在，添加新條目
                merged[cred.get("hash", password)] = cred
        
        return list(merged.values())
    
    def _parse_statistics(self, stdout: str) -> Dict[str, Any]:
        """解析統計資訊"""
        stats = {
            "loaded_hashes": 0,
            "cracked_count": 0,
            "progress": None,
            "speed": None,
            "remaining_time": None
        }
        
        # 解析載入的 hash 數量
        # Loaded 10 password hashes with 10 different salts
        loaded_match = re.search(r'Loaded\s+(\d+)\s+password\s+hash', stdout, re.IGNORECASE)
        if loaded_match:
            stats["loaded_hashes"] = int(loaded_match.group(1))
        
        # 解析進度
        # 0g 0:00:01:23 3/3 0.02g/s 1234p/s 1234c/s 1234C/s
        progress_match = re.search(
            r'(\d+)g\s+([\d:]+)\s+.*?\s+(\d+(?:\.\d+)?[gp]/s)',
            stdout
        )
        if progress_match:
            cracked = int(progress_match.group(1))
            time = progress_match.group(2)
            speed = progress_match.group(3)
            
            stats["cracked_count"] = cracked
            stats["progress"] = time
            stats["speed"] = speed
        
        # 解析速度
        # 1234p/s (passwords per second)
        speed_match = re.search(r'(\d+(?:\.\d+)?[gp]/s)', stdout)
        if speed_match:
            stats["speed"] = speed_match.group(1)
        
        # 解析剩餘時間
        # ETA: 0:00:12:34
        eta_match = re.search(r'ETA:\s+([\d:]+)', stdout)
        if eta_match:
            stats["remaining_time"] = eta_match.group(1)
        
        return stats
    
    def _parse_warnings(self, stdout: str, stderr: str):
        """解析警告訊息"""
        warning_keywords = [
            "warning",
            "error",
            "failed",
            "no password hashes loaded",
            "no hashes loaded",
            "invalid",
            "unable to"
        ]
        
        combined_output = stdout + "\n" + stderr
        
        for line in combined_output.split('\n'):
            line_lower = line.lower()
            
            for keyword in warning_keywords:
                if keyword in line_lower:
                    self.add_warning(line.strip())
                    break
    
    def _generate_recommendations(self, cracked: List[Dict], stats: Dict):
        """生成建議"""
        if cracked:
            self.add_recommendation(
                "🔴 緊急：立即更改所有被破解的密碼"
            )
            self.add_recommendation(
                "🔒 實施強密碼策略：\n"
                "  - 最小長度 12 字符\n"
                "  - 包含大小寫字母、數字和特殊字符\n"
                "  - 避免常見單詞和模式"
            )
            self.add_recommendation(
                "🛡️ 使用現代化的密碼雜湊算法（如 Argon2、bcrypt）"
            )
            self.add_recommendation(
                "📊 定期審計密碼強度並強制更換弱密碼"
            )
        else:
            loaded = stats.get("loaded_hashes", 0)
            if loaded > 0:
                self.add_recommendation(
                    f"✅ 未能破解 {loaded} 個密碼雜湊，密碼強度較好"
                )
                self.add_recommendation(
                    "💡 建議：繼續保持強密碼策略，並定期審查"
                )
            else:
                self.add_recommendation(
                    "⚠️ 未載入任何密碼雜湊進行測試"
                )


def parse_john_output(
    stdout: str,
    stderr: str = "",
    return_code: int = 0,
    pot_file: str = "/tmp/john.pot"
) -> Dict[str, Any]:
    """
    便捷函數：解析 John the Ripper 輸出
    
    Args:
        stdout: 標準輸出
        stderr: 標準錯誤輸出
        return_code: 返回碼
        pot_file: pot 文件路徑
    
    Returns:
        解析後的結構化結果
    """
    parser = JohnParser(pot_file=pot_file)
    return parser.parse(stdout, stderr, return_code)

