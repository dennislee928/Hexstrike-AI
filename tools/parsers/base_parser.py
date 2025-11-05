"""
基礎解析器
所有安全工具解析器的抽象基類
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional


class BaseParser(ABC):
    """所有解析器的抽象基類"""
    
    def __init__(self):
        self.findings = []
        self.warnings = []
        self.recommendations = []
    
    @abstractmethod
    def parse(self, stdout: str, stderr: str, return_code: int) -> Dict[str, Any]:
        """
        解析工具輸出的抽象方法
        
        Args:
            stdout: 標準輸出
            stderr: 標準錯誤輸出
            return_code: 返回碼
        
        Returns:
            標準化的結果字典
        """
        raise NotImplementedError("Subclasses must implement parse()")
    
    def generate_summary(self, findings: List[Dict], status: str = None) -> Dict[str, Any]:
        """
        生成標準化摘要
        
        Args:
            findings: 發現列表
            status: 狀態（如果未提供則自動判斷）
        
        Returns:
            摘要字典
        """
        if status is None:
            status = self._determine_status(findings)
        
        return {
            "status": status,
            "severity": self._determine_severity(findings),
            "findings_count": len(findings),
            "brief": self._generate_brief(findings, status)
        }
    
    def _determine_status(self, findings: List[Dict]) -> str:
        """
        根據發現確定狀態
        
        Returns:
            "vulnerable", "clean", "partial", "error" 之一
        """
        if not findings:
            return "clean"
        
        # 檢查是否有高危或嚴重漏洞
        critical_count = sum(
            1 for f in findings 
            if f.get("severity") in ["critical", "high"]
        )
        
        if critical_count > 0:
            return "vulnerable"
        elif len(findings) > 0:
            return "vulnerable"
        else:
            return "clean"
    
    def _determine_severity(self, findings: List[Dict]) -> str:
        """
        根據發現確定最高嚴重程度
        
        Returns:
            "critical", "high", "medium", "low", "info" 之一
        """
        if not findings:
            return "info"
        
        severity_order = {
            "critical": 0,
            "high": 1,
            "medium": 2,
            "low": 3,
            "info": 4
        }
        
        severities = [
            f.get("severity", "info") 
            for f in findings
        ]
        
        # 返回最高嚴重程度
        min_severity = min(
            severities,
            key=lambda s: severity_order.get(s, 99)
        )
        
        return min_severity
    
    def _generate_brief(self, findings: List[Dict], status: str) -> str:
        """
        生成簡短摘要
        
        Args:
            findings: 發現列表
            status: 狀態
        
        Returns:
            一句話摘要
        """
        if status == "clean":
            return "未發現安全問題"
        elif status == "vulnerable":
            count = len(findings)
            if count == 1:
                return f"發現 1 個安全問題"
            else:
                return f"發現 {count} 個安全問題"
        elif status == "partial":
            return "掃描受限，結果可能不完整"
        else:
            return "掃描出現錯誤"
    
    def add_finding(
        self,
        finding_type: str,
        severity: str,
        description: str,
        evidence: Optional[str] = None,
        recommendation: Optional[str] = None,
        **kwargs
    ):
        """
        添加發現
        
        Args:
            finding_type: 發現類型
            severity: 嚴重程度
            description: 描述
            evidence: 證據
            recommendation: 建議
            **kwargs: 其他屬性
        """
        finding = {
            "type": finding_type,
            "severity": severity,
            "description": description
        }
        
        if evidence:
            finding["evidence"] = evidence
        
        if recommendation:
            finding["recommendation"] = recommendation
        
        # 添加其他屬性
        finding.update(kwargs)
        
        self.findings.append(finding)
    
    def add_warning(self, warning: str):
        """添加警告"""
        if warning not in self.warnings:
            self.warnings.append(warning)
    
    def add_recommendation(self, recommendation: str):
        """添加建議"""
        if recommendation not in self.recommendations:
            self.recommendations.append(recommendation)
    
    def build_standard_response(
        self,
        tool_name: str,
        target: str,
        execution_time: float,
        timestamp: str,
        success: bool = True,
        additional_details: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        構建標準化響應
        
        Args:
            tool_name: 工具名稱
            target: 目標
            execution_time: 執行時間
            timestamp: 時間戳
            success: 是否成功
            additional_details: 額外的詳細資訊
        
        Returns:
            標準化響應字典
        """
        response = {
            "success": success,
            "tool": tool_name,
            "target": target,
            "timestamp": timestamp,
            "execution_time": execution_time,
            
            "summary": self.generate_summary(self.findings),
            "findings": self.findings,
            
            "metadata": {
                "warnings": self.warnings,
                "recommendations": self.recommendations
            }
        }
        
        if additional_details:
            response["details"] = additional_details
        
        return response
    
    def clean_ansi_codes(self, text: str) -> str:
        """
        移除 ANSI 轉義碼（顏色、格式化等）
        
        Args:
            text: 包含 ANSI 碼的文本
        
        Returns:
            清理後的文本
        """
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        return ansi_escape.sub('', text)
    
    def parse_key_value_output(self, text: str, separator: str = ":") -> Dict[str, str]:
        """
        解析鍵值對輸出
        
        Args:
            text: 文本
            separator: 分隔符
        
        Returns:
            鍵值對字典
        """
        result = {}
        
        for line in text.split('\n'):
            line = line.strip()
            if separator in line:
                parts = line.split(separator, 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    result[key] = value
        
        return result
    
    def extract_ips(self, text: str) -> List[str]:
        """
        從文本中提取 IP 地址
        
        Args:
            text: 文本
        
        Returns:
            IP 地址列表
        """
        import re
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        return re.findall(ip_pattern, text)
    
    def extract_urls(self, text: str) -> List[str]:
        """
        從文本中提取 URL
        
        Args:
            text: 文本
        
        Returns:
            URL 列表
        """
        import re
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        return re.findall(url_pattern, text)
    
    def extract_domains(self, text: str) -> List[str]:
        """
        從文本中提取域名
        
        Args:
            text: 文本
        
        Returns:
            域名列表
        """
        import re
        domain_pattern = r'(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]'
        return re.findall(domain_pattern, text.lower())

