"""
SQLMap 輸出解析器
解析 SQLMap 的輸出並提取結構化資訊
"""

import re
from typing import Dict, List, Any


class SQLMapParser:
    """SQLMap 輸出解析器"""
    
    def __init__(self):
        self.vulnerability_keywords = [
            "is vulnerable",
            "injectable",
            "Parameter:",
            "Type:",
            "Title:"
        ]
        
        self.clean_keywords = [
            "all tested parameters do not appear to be injectable",
            "no parameter(s) found for testing",
            "skipping",
        ]
    
    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:
        """
        解析 SQLMap 輸出
        
        Returns:
            標準化的結果字典
        """
        result = {
            "vulnerable": False,
            "injection_points": [],
            "dbms": None,
            "injection_types": [],
            "parameters_tested": 0,
            "vulnerabilities_found": 0,
            "waf_detected": False,
            "test_summary": {},
            "warnings": [],
            "recommendations": [],
            "techniques_used": [],
            "findings": []
        }
        
        # 解析注入點
        self._parse_injection_points(stdout, result)
        
        # 解析資料庫類型
        self._parse_dbms(stdout, result)
        
        # 解析注入類型
        self._parse_injection_types(stdout, result)
        
        # 檢測 WAF/IPS
        self._detect_waf(stdout, result)
        
        # 解析警告
        self._parse_warnings(stdout, result)
        
        # 生成建議
        self._generate_recommendations(stdout, result)
        
        # 提取測試技術
        self._extract_techniques(stdout, result)
        
        # 生成摘要
        self._generate_summary(result)
        
        return result
    
    def _parse_injection_points(self, stdout: str, result: Dict):
        """解析注入點"""
        lines = stdout.split('\n')
        
        injection_data = {}
        current_param = None
        
        for line in lines:
            # 檢測參數注入
            if "Parameter:" in line:
                param_match = re.search(r"Parameter:\s+(.+?)(\s+\(|$)", line)
                if param_match:
                    current_param = param_match.group(1).strip()
                    injection_data[current_param] = {
                        "parameter": current_param,
                        "type": [],
                        "title": [],
                        "payload": []
                    }
            
            # 檢測注入類型
            if current_param and "Type:" in line:
                type_match = re.search(r"Type:\s+(.+)", line)
                if type_match:
                    injection_data[current_param]["type"].append(
                        type_match.group(1).strip()
                    )
            
            # 檢測注入標題
            if current_param and "Title:" in line:
                title_match = re.search(r"Title:\s+(.+)", line)
                if title_match:
                    injection_data[current_param]["title"].append(
                        title_match.group(1).strip()
                    )
            
            # 檢測 payload
            if current_param and "Payload:" in line:
                payload_match = re.search(r"Payload:\s+(.+)", line)
                if payload_match:
                    injection_data[current_param]["payload"].append(
                        payload_match.group(1).strip()
                    )
        
        # 轉換為結果格式
        if injection_data:
            result["vulnerable"] = True
            result["vulnerabilities_found"] = len(injection_data)
            
            for param, data in injection_data.items():
                result["injection_points"].append(data)
                
                # 添加到 findings
                for i, inj_type in enumerate(data["type"]):
                    finding = {
                        "type": "sql_injection",
                        "severity": self._determine_severity(inj_type),
                        "parameter": param,
                        "injection_type": inj_type,
                        "title": data["title"][i] if i < len(data["title"]) else "SQL Injection",
                        "payload": data["payload"][i] if i < len(data["payload"]) else "",
                        "description": f"參數 '{param}' 存在 {inj_type} SQL 注入漏洞",
                        "recommendation": "立即修復：使用參數化查詢或 ORM，永不直接拼接 SQL"
                    }
                    result["findings"].append(finding)
    
    def _parse_dbms(self, stdout: str, result: Dict):
        """解析資料庫類型"""
        dbms_pattern = r"back-end DBMS:\s+(.+?)(?:\n|$)"
        match = re.search(dbms_pattern, stdout)
        
        if match:
            result["dbms"] = match.group(1).strip()
    
    def _parse_injection_types(self, stdout: str, result: Dict):
        """解析注入類型"""
        types = []
        
        if "boolean-based blind" in stdout:
            types.append("boolean-based blind")
        if "time-based blind" in stdout:
            types.append("time-based blind")
        if "error-based" in stdout:
            types.append("error-based")
        if "UNION query" in stdout:
            types.append("UNION query")
        if "stacked queries" in stdout:
            types.append("stacked queries")
        
        result["injection_types"] = types
    
    def _detect_waf(self, stdout: str, result: Dict):
        """檢測 WAF/IPS"""
        waf_keywords = [
            "protected by some kind of WAF/IPS",
            "WAF/IPS detected",
            "heuristic (basic) test shows that",
        ]
        
        for keyword in waf_keywords:
            if keyword.lower() in stdout.lower():
                result["waf_detected"] = True
                result["warnings"].append("檢測到 WAF/IPS 保護")
                break
    
    def _parse_warnings(self, stdout: str, result: Dict):
        """解析警告訊息"""
        warning_patterns = [
            r"\[WARNING\]\s+(.+)",
            r"target URL content is not stable",
            r"reflective value\(s\) found",
        ]
        
        for pattern in warning_patterns:
            matches = re.finditer(pattern, stdout, re.IGNORECASE)
            for match in matches:
                warning = match.group(1) if match.lastindex else match.group(0)
                if warning not in result["warnings"]:
                    result["warnings"].append(warning.strip())
    
    def _generate_recommendations(self, stdout: str, result: Dict):
        """生成建議"""
        recommendations = []
        
        if "Try to increase values for '--level'/'--risk'" in stdout:
            recommendations.append(
                "建議提高測試深度：使用 --level 3-5 和 --risk 2-3"
            )
        
        if "maybe you could try to use option '--tamper'" in stdout:
            recommendations.append(
                "檢測到可能的 WAF 保護，建議使用 --tamper 參數繞過"
            )
        
        if result["waf_detected"]:
            recommendations.append(
                "嘗試這些 tamper 腳本：space2comment, charencode, randomcase"
            )
        
        if "target URL content is not stable" in stdout:
            recommendations.append(
                "目標內容不穩定，考慮使用 --string 或 --regexp 參數指定匹配模式"
            )
        
        if not result["vulnerable"] and not result["warnings"]:
            recommendations.append(
                "未發現注入但測試可能不夠深入，考慮：1) 增加 level/risk 2) 測試更多參數 3) 使用認證"
            )
        
        result["recommendations"] = recommendations
    
    def _extract_techniques(self, stdout: str, result: Dict):
        """提取使用的測試技術"""
        techniques = []
        
        technique_keywords = {
            "boolean-based": "布林盲注",
            "time-based": "時間盲注",
            "error-based": "錯誤注入",
            "UNION": "聯合查詢",
            "stacked": "堆疊查詢"
        }
        
        for keyword, chinese in technique_keywords.items():
            if keyword.lower() in stdout.lower():
                techniques.append(chinese)
        
        result["techniques_used"] = techniques
    
    def _determine_severity(self, injection_type: str) -> str:
        """根據注入類型判斷嚴重程度"""
        if "UNION" in injection_type or "stacked" in injection_type:
            return "critical"
        elif "error-based" in injection_type:
            return "high"
        elif "boolean-based" in injection_type or "time-based" in injection_type:
            return "high"
        else:
            return "medium"
    
    def _generate_summary(self, result: Dict):
        """生成測試摘要"""
        if result["vulnerable"]:
            status = "vulnerable"
            severity = "critical" if result["vulnerabilities_found"] > 0 else "high"
            brief = f"發現 {result['vulnerabilities_found']} 個 SQL 注入漏洞"
            
            if result["dbms"]:
                brief += f"（資料庫：{result['dbms']}）"
        else:
            status = "clean"
            severity = "info"
            
            if result["warnings"]:
                status = "partial"
                brief = "未發現明確注入，但測試受限（" + result["warnings"][0][:50] + "）"
            else:
                brief = "未發現 SQL 注入漏洞"
        
        result["test_summary"] = {
            "status": status,
            "severity": severity,
            "brief": brief,
            "findings_count": result["vulnerabilities_found"]
        }


def parse_sqlmap_output(stdout: str, stderr: str = "", return_code: int = 0) -> Dict[str, Any]:
    """
    便捷函數：解析 SQLMap 輸出
    
    Args:
        stdout: 標準輸出
        stderr: 標準錯誤輸出
        return_code: 返回碼
    
    Returns:
        解析後的結構化結果
    """
    parser = SQLMapParser()
    return parser.parse(stdout, stderr, return_code)

