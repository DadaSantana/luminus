"""
Módulo de configuração que gerencia as variáveis de ambiente e configurações dos agentes.

Este módulo centraliza todas as configurações do sistema, incluindo:
- Configurações de modelos de LLM para cada agente
- Configurações de monitoramento (Opik)
- Parâmetros de execução (número máximo de iterações do loop)
- Gerenciamento de valores padrão e fallbacks

Uso:
    from config import get_model_for_agent, get_max_iterations, get_opik_config
"""

import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Carregar variáveis de ambiente no início
load_dotenv()

# Definições de modelos padrão caso não estejam no .env
DEFAULT_MODELS = {
    'enrichment_agent': 'gemini-2.0-flash',
    'structure_agent': 'gemini-2.0-flash',
    'search_agent': 'gemini-2.0-flash',
    'tech_lead_agent': 'gemini-2.5-pro-preview-06-05',
    'coder_agent': 'gemini-2.5-pro-preview-06-05',
    'coder_reviewer_agent': 'gemini-2.5-pro-preview-06-05',
}

# Mapeamento entre nomes de agentes e variáveis de ambiente
ENV_MODEL_MAPPING = {
    'enrichment_agent': 'ENRICHMENT_MODEL',
    'structure_agent': 'STRUCTURE_MODEL',
    'search_agent': 'SEARCH_MODEL',
    'tech_lead_agent': 'TECH_LEAD_MODEL',
    'coder_agent': 'CODER_MODEL',
    'coder_reviewer_agent': 'CODER_REVIEWER_MODEL',
}

# Mapeamento de modelos de fallback
FALLBACK_MAPPING = {
    'gemini-2.5-pro-preview-06-05': os.getenv('FALLBACK_ADVANCED_MODEL', 'gemini-2.0-pro'),
    'gemini-2.0-pro': os.getenv('FALLBACK_BASIC_MODEL', 'gemini-2.0-flash'),
}


def get_model_for_agent(agent_name: str) -> str:
    """
    Retorna o nome do modelo a ser utilizado pelo agente especificado.
    
    Args:
        agent_name: Nome do agente para o qual deseja-se obter o modelo
        
    Returns:
        Nome do modelo a ser usado pelo agente
    """
    env_var = ENV_MODEL_MAPPING.get(agent_name)
    
    if not env_var:
        return DEFAULT_MODELS.get(agent_name, 'gemini-2.0-flash')
        
    return os.getenv(env_var, DEFAULT_MODELS.get(agent_name, 'gemini-2.0-flash'))


def get_fallback_model(model_name: str) -> str:
    """
    Retorna um modelo de fallback caso o modelo solicitado não esteja disponível.
    
    Args:
        model_name: Nome do modelo original que pode não estar disponível
        
    Returns:
        Nome do modelo de fallback
    """
    return FALLBACK_MAPPING.get(model_name, 'gemini-2.0-flash')


def get_max_iterations() -> int:
    """
    Retorna o número máximo de iterações para o LoopAgent.
    
    Returns:
        Número máximo de iterações do loop
    """
    return int(os.getenv('MAX_LOOP_ITERATIONS', 1))


def get_opik_config() -> Dict[str, str]:
    """
    Retorna as configurações do Opik.
    
    Returns:
        Dicionário com as configurações do Opik
    """
    return {
        'api_key': os.getenv('OPIK_API_KEY', ''),
        'workspace': os.getenv('OPIK_WORKSPACE', ''),
    }


def get_model_parameters(model_name: str) -> Dict[str, Any]:
    """
    Retorna parâmetros específicos para um modelo.
    
    Args:
        model_name: Nome do modelo para o qual deseja-se obter parâmetros
        
    Returns:
        Dicionário com parâmetros de configuração do modelo
    """
    # Parâmetros padrão para diferentes classes de modelos
    if 'gemini-2.5-pro' in model_name:
        return {
            'temperature': 0.2,
            'top_p': 0.95,
            'top_k': 40,
        }
    elif 'gemini-2.0-pro' in model_name:
        return {
            'temperature': 0.4,
            'top_p': 0.9,
            'top_k': 30,
        }
    else:  # Para modelos 'flash' e outros
        return {
            'temperature': 0.7,
            'top_p': 0.8,
            'top_k': 20,
        }


def is_valid_model(model_name: str) -> bool:
    """
    Verifica se o modelo especificado é válido e disponível.
    
    Args:
        model_name: Nome do modelo a ser verificado
        
    Returns:
        True se o modelo for válido, False caso contrário
    """
    valid_models = [
        'gemini-2.0-flash',
        'gemini-2.0-pro',
        'gemini-2.5-pro-preview-06-05'
    ]
    
    return model_name in valid_models
