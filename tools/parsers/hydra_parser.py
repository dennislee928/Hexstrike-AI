"""
Hydra 輸出解析器
解析 Hydra 暴力破解工具的輸出
"""

import re
from typing import Dict, List, Any
from .base_parser import BaseParser


class HydraParser(BaseParser):
    """Hydra 輸出解析器"""
    
    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:
        """
        解析 Hydra 輸出
        
        Returns:
            標準化的結果字典
        """
        # 清理 ANSI 碼
        stdout = self.clean_ansi_codes(stdout)
        
        # 解析成功的憑證
        credentials = self._parse_credentials(stdout)
        
        # 解析統計資訊
        stats = self._parse_statistics(stdout)
        
        # 解析錯誤和警告
        self._parse_warnings(stdout, stderr)
        
        # 生成發現
        if credentials:
            for cred in credentials:
                self.add_finding(
                    finding_type="valid_credentials",
                    severity="critical",
                    description=f"發現有效憑證: {cred['login']}:{cred['password']}",
                    evidence=cred,
                    recommendation="立即更改密碼並啟用雙因素認證",
                    host=cred.get("host"),
                    port=cred.get("port"),
                    service=cred.get("service"),
                    login=cred["login"],
                    password=cred["password"]
                )
        
        # 生成建議
        self._generate_recommendations(credentials, stats)
        
        # 構建詳細資訊
        details = {
            "credentials_found": len(credentials),
            "credentials": credentials,
            "statistics": stats
        }
        
        return {
            "findings": self.findings,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
            "test_summary": self.generate_summary(self.findings),
            "details": details
        }
    
    def _parse_credentials(self, stdout: str) -> List[Dict[str, str]]:
        """解析找到的憑證"""
        credentials = []
        
        # Hydra 成功格式示例:
        # [22][ssh] host: 192.168.1.1   login: admin   password: admin123
        # [80][http-post-form] host: example.com   login: user   password: pass
        
        patterns = [
            # 標準格式
            r'\[(\d+)\]\[([^\]]+)\]\s+host:\s+([^\s]+)\s+login:\s+([^\s]+)\s+password:\s+(.+)',
            # 簡化格式
            r'host:\s+([^\s]+)\s+login:\s+([^\s]+)\s+password:\s+(.+)',
        ]
        
        for line in stdout.split('\n'):
            line = line.strip()
            
            # 跳過非結果行
            if 'valid password found' not in line.lower() and '[' not in line:
                continue
            
            for pattern in patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 5:  # 完整格式
                        port, service, host, login, password = match.groups()
                        credentials.append({
                            "host": host,
                            "port": port,
                            "service": service,
                            "login": login,
                            "password": password.strip()
                        })
                    elif len(match.groups()) == 3:  # 簡化格式
                        host, login, password = match.groups()
                        credentials.append({
                            "host": host,
                            "login": login,
                            "password": password.strip()
                        })
                    break
        
        return credentials
    
    def _parse_statistics(self, stdout: str) -> Dict[str, Any]:
        """解析統計資訊"""
        stats = {
            "total_attempts": 0,
            "success_count": 0,
            "duration": None,
            "speed": None
        }
        
        # 解析嘗試次數
        # [ATTEMPT] target example.com - login "admin" - pass "password123" - 1 of 100
        attempt_matches = re.findall(r'(\d+)\s+of\s+(\d+)', stdout)
        if attempt_matches:
            last_attempt = attempt_matches[-1]
            stats["total_attempts"] = int(last_attempt[1])
        
        # 解析成功次數（從憑證中計算）
        success_count = len(re.findall(r'valid password found', stdout, re.IGNORECASE))
        stats["success_count"] = success_count
        
        # 解析執行時間
        # [STATUS] attack finished for example.com (valid pair found)
        # [STATUS] 16 tries/min, 100 tries in 00:06m
        time_match = re.search(r'(\d+)\s+tries\s+in\s+([\d:]+[msh])', stdout)
        if time_match:
            stats["duration"] = time_match.group(2)
        
        # 解析速度
        speed_match = re.search(r'(\d+(?:\.\d+)?)\s+tries/min', stdout)
        if speed_match:
            stats["speed"] = f"{speed_match.group(1)} tries/min"
        
        return stats
    
    def _parse_warnings(self, stdout: str, stderr: str):
        """解析警告訊息"""
        warning_keywords = [
            "error",
            "warning",
            "failed",
            "timeout",
            "connection refused",
            "authentication failed",
            "too many connections"
        ]
        
        combined_output = stdout + "\n" + stderr
        
        for line in combined_output.split('\n'):
            line_lower = line.lower()
            
            for keyword in warning_keywords:
                if keyword in line_lower:
                    self.add_warning(line.strip())
                    break
    
    def _generate_recommendations(self, credentials: List[Dict], stats: Dict):
        """生成建議"""
        if credentials:
            self.add_recommendation(
                "🔴 緊急：立即更改所有被破解的密碼"
            )
            self.add_recommendation(
                "🔒 啟用雙因素認證（2FA）以增強安全性"
            )
            self.add_recommendation(
                "🚫 實施帳戶鎖定策略（如：5 次失敗後鎖定 30 分鐘）"
            )
            self.add_recommendation(
                "📊 監控並記錄所有登入嘗試"
            )
        else:
            self.add_recommendation(
                "✅ 未發現弱密碼，但建議定期審查密碼強度"
            )
            self.add_recommendation(
                "🔒 考慮實施更嚴格的密碼策略（最小長度、複雜度要求）"
            )
        
        # 基於嘗試次數的建議
        if stats.get("total_attempts", 0) > 1000:
            self.add_recommendation(
                "⚠️ 測試了大量密碼，考慮使用更有針對性的密碼列表"
            )


def parse_hydra_output(stdout: str, stderr: str = "", return_code: int = 0) -> Dict[str, Any]:
    """
    便捷函數：解析 Hydra 輸出
    
    Args:
        stdout: 標準輸出
        stderr: 標準錯誤輸出
        return_code: 返回碼
    
    Returns:
        解析後的結構化結果
    """
    parser = HydraParser()
    return parser.parse(stdout, stderr, return_code)

