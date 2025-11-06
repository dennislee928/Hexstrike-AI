"""LLM 整合測試腳本"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from core.llm_engine import LLMEnhancedDecisionEngine
from core.decision_engine import TargetType


def test_llm_integration():
    print("=== LLM 整合測試 ===\n")
    
    # 檢查 API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️ 未設定 OPENAI_API_KEY，將測試 fallback 模式")
    else:
        print(f"✅ API Key 已設定：{api_key[:10]}...")
    
    # 初始化引擎
    engine = LLMEnhancedDecisionEngine()
    print(f"LLM 啟用狀態：{engine.llm_enabled}\n")
    
    # 測試目標分析
    target = "https://example.com"
    print(f"分析目標：{target}")
    profile = engine.analyze_target(target)
    print(f"目標類型：{profile.target_type.value}")
    print(f"信心分數：{profile.confidence_score}\n")
    
    # 測試工具選擇
    print("使用 LLM 選擇工具...")
    tools = engine.llm_select_tools(profile, objective="comprehensive")
    print(f"推薦工具：{tools}\n")
    
    # 測試攻擊鏈建立
    print("建立智能攻擊鏈...")
    chain = engine.create_intelligent_attack_chain(profile)
    print(f"攻擊步驟數：{len(chain.steps)}")
    print(f"成功概率：{chain.success_probability:.2%}")
    print(f"預估時間：{chain.estimated_time} 秒")
    
    print("\n✅ LLM 整合測試完成！")


if __name__ == "__main__":
    test_llm_integration()
