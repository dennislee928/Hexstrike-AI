#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
簡單的 LLM 整合測試
"""
import os
import sys

# 確保專案根目錄在路徑中
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from core.llm_engine import LLMEnhancedDecisionEngine
    from core.decision_engine import TargetType
    print("成功導入 LLM 引擎")
    
    # 測試 LLM 引擎初始化
    engine = LLMEnhancedDecisionEngine()
    print(f"LLM 啟用狀態: {engine.llm_enabled}")
    
    if not engine.llm_enabled:
        print("WARNING: LLM 未啟用，請檢查 OPENAI_API_KEY")
    else:
        print("SUCCESS: LLM 引擎初始化成功")
    
    # 測試目標分析（即使沒有 API key 也能測試）
    profile = engine.analyze_target("http://testphp.vulnweb.com")
    print(f"目標分析結果: {profile.target_type}")
    
    # 測試攻擊鏈創建
    attack_chain = engine.create_intelligent_attack_chain(profile, "comprehensive")
    print(f"攻擊鏈步驟數: {len(attack_chain.steps)}")
    print(f"第一個步驟: {attack_chain.steps[0].tool if attack_chain.steps else 'None'}")
    
    print("基本 LLM 整合測試完成")
    
except ImportError as e:
    print(f"導入錯誤: {e}")
    sys.exit(1)
except Exception as e:
    print(f"測試錯誤: {e}")
    sys.exit(1)
