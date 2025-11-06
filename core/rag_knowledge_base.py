"""
RAG (Retrieval-Augmented Generation) 知識庫
儲存 CVE、漏洞、Exploit 等安全知識
"""

import os
from typing import List, Dict, Any
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document
import logging


class SecurityKnowledgeBase:
    """安全知識庫 - 使用 Chroma 向量資料庫"""
    
    def __init__(self, persist_directory: str = "./data/chroma_db"):
        self.persist_directory = persist_directory
        self.embeddings = OpenAIEmbeddings()
        
        # 初始化或載入向量資料庫
        if os.path.exists(persist_directory):
            self.vector_store = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings
            )
            logging.info(f"載入現有知識庫：{persist_directory}")
        else:
            self.vector_store = None
            logging.info("知識庫尚未初始化")
    
    def add_cve_data(self, cve_id: str, description: str, metadata: Dict[str, Any]):
        """新增 CVE 資料到知識庫"""
        doc = Document(
            page_content=f"CVE: {cve_id}\n{description}",
            metadata={
                "cve_id": cve_id,
                "type": "cve",
                **metadata
            }
        )
        
        if self.vector_store is None:
            self.vector_store = Chroma.from_documents(
                [doc],
                self.embeddings,
                persist_directory=self.persist_directory
            )
        else:
            self.vector_store.add_documents([doc])
    
    def search_similar_vulnerabilities(
        self, 
        query: str, 
        k: int = 5
    ) -> List[Document]:
        """搜尋相似的漏洞資訊"""
        if self.vector_store is None:
            return []
        
        results = self.vector_store.similarity_search(query, k=k)
        return results
    
    def get_exploit_suggestions(self, vulnerability_description: str) -> List[str]:
        """根據漏洞描述獲取 exploit 建議"""
        similar_vulns = self.search_similar_vulnerabilities(
            vulnerability_description, 
            k=3
        )
        
        suggestions = []
        for doc in similar_vulns:
            if "exploit_technique" in doc.metadata:
                suggestions.append(doc.metadata["exploit_technique"])
        
        return suggestions
