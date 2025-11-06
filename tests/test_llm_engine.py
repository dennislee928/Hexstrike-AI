"""LLM 引擎單元測試"""

import unittest
from unittest.mock import patch, MagicMock
from core.llm_engine import LLMEnhancedDecisionEngine
from core.decision_engine import TargetProfile, TargetType


class TestLLMEngine(unittest.TestCase):
    
    @patch('core.llm_engine.ChatOpenAI')
    def test_llm_tool_selection(self, mock_llm):
        """測試 LLM 工具選擇"""
        # Mock LLM 回應
        mock_response = MagicMock()
        mock_response.content = '{"tools": [{"name": "nmap", "reason": "test", "priority": 1}]}'
        mock_llm.return_value.invoke.return_value = mock_response
        
        engine = LLMEnhancedDecisionEngine(openai_api_key="test-key")
        
        profile = TargetProfile(
            target="example.com",
            target_type=TargetType.WEB_APPLICATION
        )
        
        tools = engine.llm_select_tools(profile)
        self.assertIn("nmap", tools)
    
    def test_fallback_to_rules(self):
        """測試無 API key 時 fallback 到規則型引擎"""
        engine = LLMEnhancedDecisionEngine(openai_api_key=None)
        
        profile = TargetProfile(
            target="example.com",
            target_type=TargetType.WEB_APPLICATION
        )
        
        tools = engine.llm_select_tools(profile)
        self.assertIsInstance(tools, list)
        self.assertGreater(len(tools), 0)


if __name__ == '__main__':
    unittest.main()
