"""
LLM-Enhanced Decision Engine
整合 OpenAI GPT-4 和 LangChain 以提供真正的 AI 決策能力
"""

import os
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from tenacity import retry, stop_after_attempt, wait_exponential
import logging

from core.decision_engine import (
    IntelligentDecisionEngine, 
    TargetProfile, 
    AttackChain
)


class LLMEnhancedDecisionEngine(IntelligentDecisionEngine):
    """
    LLM 增強版決策引擎
    結合規則型引擎的速度與 GPT-4 的智能
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        super().__init__()
        
        # 初始化 OpenAI
        self.api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logging.warning("未設定 OPENAI_API_KEY，將使用規則型引擎")
            self.llm_enabled = False
        else:
            self.llm_enabled = True
            self.llm = ChatOpenAI(
                model="gpt-4-turbo-preview",
                temperature=0.1,  # 低溫度以獲得更一致的結果
                api_key=self.api_key
            )
            
        # 初始化向量資料庫（用於 RAG）
        self.embeddings = OpenAIEmbeddings(api_key=self.api_key) if self.llm_enabled else None
        self.vector_store = None  # 延遲初始化
        
        # LLM Chains
        self._init_llm_chains()
    
    def _init_llm_chains(self):
        """初始化 LangChain chains"""
        if not self.llm_enabled:
            return
            
        # 工具選擇 Chain
        self.tool_selection_prompt = ChatPromptTemplate.from_messages([
            ("system", """你是一位資深滲透測試專家。根據目標特徵，選擇最有效的安全測試工具。

可用工具類別：
- 網路掃描：nmap, rustscan, masscan
- Web 測試：nuclei, gobuster, sqlmap, dalfox
- 二進制分析：ghidra, radare2, gdb
- 雲端安全：prowler, trivy, kube-hunter

請根據以下目標資訊，推薦 3-5 個最適合的工具，並說明理由。
回傳 JSON 格式：{{"tools": [{{"name": "工具名", "reason": "原因", "priority": 1-5}}]}}"""),
            ("human", "目標類型：{target_type}\n目標：{target}\n技術棧：{technologies}\nCMS：{cms}\n目標：{objective}")
        ])
        
        self.tool_selection_chain = self.tool_selection_prompt | self.llm
        
        # 參數優化 Chain
        self.param_optimization_prompt = ChatPromptTemplate.from_messages([
            ("system", """你是滲透測試工具專家。根據目標特徵，優化工具參數以達到最佳效果。

考慮因素：
- 目標防護程度（WAF、IDS/IPS）
- 測試目標（隱密性 vs 全面性）
- 技術棧特性（PHP/Java/.NET）
- 時間限制

回傳 JSON 格式的參數建議。"""),
            ("human", "工具：{tool}\n目標：{target}\n技術棧：{technologies}\n要求：{requirements}")
        ])
        
        self.param_optimization_chain = self.param_optimization_prompt | self.llm
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def llm_select_tools(
        self, 
        profile: TargetProfile, 
        objective: str = "comprehensive"
    ) -> List[str]:
        """
        使用 LLM 選擇最佳工具
        包含重試邏輯以處理 API 錯誤
        """
        if not self.llm_enabled:
            # Fallback 到規則型引擎
            return self.select_optimal_tools(profile, objective)
        
        try:
            response = self.tool_selection_chain.invoke({
                "target_type": profile.target_type.value,
                "target": profile.target,
                "technologies": ", ".join([t.value for t in profile.technologies]),
                "cms": profile.cms_type or "無",
                "objective": objective
            })
            
            # 解析 LLM 回應
            import json
            tools_data = json.loads(response.content)
            selected_tools = [t["name"] for t in tools_data["tools"]]
            
            logging.info(f"LLM 推薦工具：{selected_tools}")
            return selected_tools
            
        except Exception as e:
            logging.error(f"LLM 工具選擇失敗：{e}，使用規則型 fallback")
            return self.select_optimal_tools(profile, objective)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    def llm_optimize_parameters(
        self,
        tool: str,
        profile: TargetProfile,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        使用 LLM 優化工具參數
        """
        if not self.llm_enabled:
            return self.optimize_parameters(tool, profile, context)
        
        context = context or {}
        
        try:
            response = self.param_optimization_chain.invoke({
                "tool": tool,
                "target": profile.target,
                "technologies": ", ".join([t.value for t in profile.technologies]),
                "requirements": str(context)
            })
            
            import json
            optimized_params = json.loads(response.content)
            
            logging.info(f"LLM 優化 {tool} 參數：{optimized_params}")
            return optimized_params
            
        except Exception as e:
            logging.error(f"LLM 參數優化失敗：{e}，使用規則型 fallback")
            return self.optimize_parameters(tool, profile, context)
    
    def create_intelligent_attack_chain(
        self,
        profile: TargetProfile,
        objective: str = "comprehensive"
    ) -> AttackChain:
        """
        創建 LLM 增強的攻擊鏈
        結合規則型引擎的結構與 LLM 的智能
        """
        # 使用 LLM 選擇工具
        selected_tools = self.llm_select_tools(profile, objective)
        
        # 建立攻擊鏈
        chain = AttackChain(profile)
        
        for tool in selected_tools:
            # 使用 LLM 優化參數
            params = self.llm_optimize_parameters(tool, profile)
            
            # 建立攻擊步驟
            from core.decision_engine import AttackStep
            step = AttackStep(
                tool=tool,
                parameters=params,
                expected_outcome=f"LLM-enhanced scan with {tool}",
                success_probability=0.85,  # LLM 決策通常較高
                execution_time_estimate=180
            )
            chain.add_step(step)
        
        chain.calculate_success_probability()
        return chain
