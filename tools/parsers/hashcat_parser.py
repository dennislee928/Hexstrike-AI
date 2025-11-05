"""
Hashcat 輸出解析器
解析 Hashcat 密碼破解工具的輸出
"""

import re
import os
from typing import Dict, List, Any
from .base_parser import BaseParser


class HashcatParser(BaseParser):
    """Hashcat 輸出解析器"""
    
    def __init__(self, outfile: str = "/tmp/hashcat.out"):
        super().__init__()
        self.outfile = outfile
    
    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:
        """
        解析 Hashcat 輸出
        
        Returns:
            標準化的結果字典
        """
        # 清理 ANSI 碼
        stdout = self.clean_ansi_codes(stdout)
        
        # 從輸出文件讀取已破解的密碼
        cracked = self._read_outfile()
        
        # 解析統計資訊
        stats = self._parse_statistics(stdout)
        
        # 解析會話資訊
        session_info = self._parse_session_info(stdout)
        
        # 解析警告
        self._parse_warnings(stdout, stderr)
        
        # 生成發現
        if cracked:
            for cred in cracked:
                severity = self._determine_crack_severity(cred)
                self.add_finding(
                    finding_type="cracked_hash",
                    severity=severity,
                    description=f"密碼雜湊已破解",
                    evidence=cred,
                    recommendation="立即更改此密碼並使用更強的雜湊算法",
                    hash=cred.get("hash"),
                    password=cred.get("password"),
                    hash_type=session_info.get("hash_type")
                )
        
        # 生成建議
        self._generate_recommendations(cracked, stats, session_info)
        
        # 構建詳細資訊
        details = {
            "cracked_count": len(cracked),
            "cracked_hashes": cracked,
            "statistics": stats,
            "session_info": session_info
        }
        
        return {
            "findings": self.findings,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
            "test_summary": self.generate_summary(self.findings),
            "details": details
        }
    
    def _read_outfile(self) -> List[Dict[str, str]]:
        """從輸出文件讀取已破解的密碼"""
        cracked = []
        
        if not os.path.exists(self.outfile):
            self.add_warning(f"輸出文件不存在: {self.outfile}")
            return cracked
        
        try:
            with open(self.outfile, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Hashcat 輸出格式（取決於 --outfile-format）
                    # 格式 1 (plain): password
                    # 格式 2 (hash:plain): hash:password
                    # 格式 3 (hash): hash
                    
                    if ':' in line:
                        # hash:password 格式
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            cracked.append({
                                "hash": parts[0],
                                "password": parts[1]
                            })
                    else:
                        # 僅密碼格式
                        cracked.append({
                            "password": line
                        })
        except Exception as e:
            self.add_warning(f"無法讀取輸出文件: {str(e)}")
        
        return cracked
    
    def _parse_statistics(self, stdout: str) -> Dict[str, Any]:
        """解析統計資訊"""
        stats = {
            "recovered": 0,
            "total": 0,
            "progress": 0.0,
            "speed": None,
            "rejected": 0,
            "time_started": None,
            "time_estimated": None,
            "temperature": None
        }
        
        # 解析恢復/總數
        # Recovered........: 5/100 (5.00%) Digests
        recovered_match = re.search(
            r'Recovered[.\s]*:\s*(\d+)/(\d+)\s*\(([0-9.]+)%\)',
            stdout,
            re.IGNORECASE
        )
        if recovered_match:
            stats["recovered"] = int(recovered_match.group(1))
            stats["total"] = int(recovered_match.group(2))
            stats["progress"] = float(recovered_match.group(3))
        
        # 解析速度
        # Speed.#1.........:  1234.5 kH/s (10.23ms) @ Accel:64 Loops:128 Thr:256 Vec:1
        speed_match = re.search(
            r'Speed[.\s#\d]*:\s*([0-9.]+\s*[kMGT]?H/s)',
            stdout,
            re.IGNORECASE
        )
        if speed_match:
            stats["speed"] = speed_match.group(1)
        
        # 解析進度
        # Progress.........: 12345678/123456789 (10.00%)
        progress_match = re.search(
            r'Progress[.\s]*:\s*(\d+)/(\d+)\s*\(([0-9.]+)%\)',
            stdout,
            re.IGNORECASE
        )
        if progress_match:
            stats["progress"] = float(progress_match.group(3))
        
        # 解析拒絕數量
        # Rejected.........: 123
        rejected_match = re.search(
            r'Rejected[.\s]*:\s*(\d+)',
            stdout,
            re.IGNORECASE
        )
        if rejected_match:
            stats["rejected"] = int(rejected_match.group(1))
        
        # 解析開始時間
        # Time.Started.....: Mon Nov  5 10:30:45 2025
        time_start_match = re.search(
            r'Time\.Started[.\s]*:\s*(.+)',
            stdout
        )
        if time_start_match:
            stats["time_started"] = time_start_match.group(1).strip()
        
        # 解析預估時間
        # Time.Estimated...: Mon Nov  5 11:30:45 2025
        time_est_match = re.search(
            r'Time\.Estimated[.\s]*:\s*(.+)',
            stdout
        )
        if time_est_match:
            stats["time_estimated"] = time_est_match.group(1).strip()
        
        return stats
    
    def _parse_session_info(self, stdout: str) -> Dict[str, Any]:
        """解析會話資訊"""
        info = {
            "hash_type": None,
            "hash_mode": None,
            "attack_mode": None,
            "session": None,
            "status": None
        }
        
        # 解析 hash 類型
        # Hash.Type........: MD5
        # Hash.Mode........: 0 (MD5)
        hash_type_match = re.search(
            r'Hash\.(?:Type|Mode)[.\s]*:\s*(\d+\s*)?\(?([^)]+)\)?',
            stdout,
            re.IGNORECASE
        )
        if hash_type_match:
            if hash_type_match.group(1):
                info["hash_mode"] = hash_type_match.group(1).strip()
            info["hash_type"] = hash_type_match.group(2).strip()
        
        # 解析攻擊模式
        # Attack.Mode......: 0 (Straight)
        attack_match = re.search(
            r'Attack\.Mode[.\s]*:\s*(\d+)\s*\(([^)]+)\)',
            stdout,
            re.IGNORECASE
        )
        if attack_match:
            info["attack_mode"] = f"{attack_match.group(1)} ({attack_match.group(2)})"
        
        # 解析會話名稱
        # Session..........: hashcat
        session_match = re.search(
            r'Session[.\s]*:\s*(.+)',
            stdout,
            re.IGNORECASE
        )
        if session_match:
            info["session"] = session_match.group(1).strip()
        
        # 解析狀態
        # Status...........: Cracked
        status_match = re.search(
            r'Status[.\s]*:\s*(.+)',
            stdout,
            re.IGNORECASE
        )
        if status_match:
            info["status"] = status_match.group(1).strip()
        
        return info
    
    def _parse_warnings(self, stdout: str, stderr: str):
        """解析警告訊息"""
        warning_keywords = [
            "warning",
            "error",
            "failed",
            "no hashes loaded",
            "invalid",
            "unable to",
            "exhausted",
            "device"
        ]
        
        combined_output = stdout + "\n" + stderr
        
        for line in combined_output.split('\n'):
            line_lower = line.lower()
            
            for keyword in warning_keywords:
                if keyword in line_lower:
                    # 過濾掉進度信息
                    if 'progress' not in line_lower and 'status' not in line_lower:
                        self.add_warning(line.strip())
                    break
    
    def _determine_crack_severity(self, cred: Dict) -> str:
        """根據密碼特徵判斷嚴重程度"""
        password = cred.get("password", "")
        
        # 極短密碼
        if len(password) < 6:
            return "critical"
        
        # 常見密碼模式
        common_patterns = [
            "password", "123456", "admin", "letmein",
            "welcome", "monkey", "dragon", "master"
        ]
        
        if password.lower() in common_patterns:
            return "critical"
        
        # 中等長度但簡單
        if len(password) < 10:
            return "high"
        
        # 較長但可能不夠複雜
        return "medium"
    
    def _generate_recommendations(
        self,
        cracked: List[Dict],
        stats: Dict,
        session_info: Dict
    ):
        """生成建議"""
        if cracked:
            self.add_recommendation(
                "🔴 緊急：立即更改所有被破解的密碼"
            )
            
            # 根據 hash 類型給出建議
            hash_type = session_info.get("hash_type", "").lower()
            
            if "md5" in hash_type or "sha1" in hash_type:
                self.add_recommendation(
                    "⚠️ 檢測到弱雜湊算法（MD5/SHA1），建議升級到：\n"
                    "  - Argon2id（推薦）\n"
                    "  - bcrypt\n"
                    "  - scrypt"
                )
            
            if "ntlm" in hash_type:
                self.add_recommendation(
                    "🔒 NTLM 雜湊已過時，建議：\n"
                    "  - 升級到 Kerberos 認證\n"
                    "  - 禁用 LM/NTLM v1\n"
                    "  - 使用更長的密碼"
                )
            
            self.add_recommendation(
                "🛡️ 實施強密碼策略：\n"
                "  - 最小長度 14+ 字符\n"
                "  - 混合字符類型\n"
                "  - 避免字典單詞\n"
                "  - 使用密碼管理器"
            )
            
            # 根據破解速度給出建議
            if stats.get("speed"):
                self.add_recommendation(
                    f"⚡ 破解速度: {stats['speed']} - "
                    "考慮增加密碼複雜度以對抗暴力破解"
                )
        else:
            recovered = stats.get("recovered", 0)
            total = stats.get("total", 0)
            
            if total > 0:
                self.add_recommendation(
                    f"✅ 未破解任何雜湊（{recovered}/{total}），密碼強度較好"
                )
                self.add_recommendation(
                    "💡 建議：繼續保持強密碼策略，並定期審查"
                )
            else:
                self.add_recommendation(
                    "⚠️ 未載入任何雜湊進行測試"
                )


def parse_hashcat_output(
    stdout: str,
    stderr: str = "",
    return_code: int = 0,
    outfile: str = "/tmp/hashcat.out"
) -> Dict[str, Any]:
    """
    便捷函數：解析 Hashcat 輸出
    
    Args:
        stdout: 標準輸出
        stderr: 標準錯誤輸出
        return_code: 返回碼
        outfile: 輸出文件路徑
    
    Returns:
        解析後的結構化結果
    """
    parser = HashcatParser(outfile=outfile)
    return parser.parse(stdout, stderr, return_code)

