# Standard library imports
import asyncio
import datetime
import os
import time
import uuid

# Third-party imports
from dotenv import load_dotenv
from google.adk.agents import LoopAgent
from google.adk.agents import Agent, LlmAgent, SequentialAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search

load_dotenv() # Moved load_dotenv() to be earlier








# 2. Defina os sub-agentes usando as variáveis de schema para conectá-los

enrichment_agent = LlmAgent(
    name="enrichment_agent",
    model="gemini-2.5-flash",
    output_key="enrichment_output",  # A saída deste agente será rotulada como 'enrichment_output'
    instruction="""You are a helpful assistant using the ReACT framework.
    For each user request:
    1. REASON: Think step-by-step about what information you need
    2. ACT: Use available tools to gather information
    3. OBSERVE: Review the results from tools
    4. Repeat until you can provide a complete response""",
    description="An assistant that uses reasoning and acting cycles to solve problems"
)

search_agent = LlmAgent(
    name="search_agent",
    model="gemini-2.5-flash",
    output_key="search_output",  # A saída deste agente será rotulada como 'search_output'
    # A instrução agora injeta diretamente o valor da saída do agente anterior.
    instruction="""Use the value from the enrichment step below to search for information on Google.
    Enriched Query: {enrichment_output}""",
    tools=[google_search]
)

main_agent = LlmAgent(
    name="content_creator",
    model="gemini-2.5-flash",
    output_key="creator_output",  # A saída deste agente será rotulada como 'creator_output'
    # Injeta o resultado da busca diretamente na instrução.
    instruction="""You are a content creator. You will receive search results below.
    Generate a clear, informative text based on them.
    Search Results: {search_output}""",
    description="Creates initial content based on user requests"
)

critique_agent = LlmAgent(
    name="content_evaluator",
    model="gemini-2.5-flash",
    output_key="critique_output",  # A saída deste agente será rotulada como 'critique_output'
    # Injeta o conteúdo criado para ser analisado.
    instruction="""You are a critical evaluator. Analyze the content below based on clarity, accuracy, and completeness.
    Your output must be a JSON object containing two keys: 'original_content' (the content you received) and 'critique' (your feedback).
    
    Content to Evaluate: {creator_output}""",
    description="Evaluates content and provides constructive feedback"
)

generator_agent = LlmAgent(
    name="content_refiner",
    model="gemini-2.5-flash",
    # O último agente não precisa de um output_key, a menos que seja parte de uma sequência maior.
    # Injeta o objeto de crítica para refinar o conteúdo.
    instruction="""You are a content refiner. You will receive a JSON object with the original content and a critique.
    Generate a new version of the content that addresses all points from the critique.
    
    Critique Object: {critique_output}""",
    description="Refines content based on feedback"
)

# 3. Crie o agente coordenador com a sequência definida
root_agent = SequentialAgent(
    name="self_reflection_system",
    sub_agents=[enrichment_agent, search_agent, main_agent, critique_agent, generator_agent],
    description="Execute the enrichment, search, main, critique and generator agent."
)
