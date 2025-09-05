# Standard library imports
import asyncio
import datetime
import os
import time
import uuid

# Third-party imports
from dotenv import load_dotenv
from google.adk.agents import LoopAgent
from google.adk.agents import Agent, LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search
use_opik_tracer = False
opik_tracer = None
try:
    from opik.integrations.adk import OpikTracer
    # Habilita OPIK somente se explicitamente configurado
    use_opik_tracer = os.getenv("OPIK_ENABLED", "0").lower() in ("1", "true", "yes")
    if use_opik_tracer:
        opik_tracer = OpikTracer()
except Exception:
    # Opik não disponível; segue sem tracer
    opik_tracer = None
    use_opik_tracer = False

# Local imports
#from utils.generate_diagram import generate_diagram_from_code
#from utils.generate_outputs import save_output_keys_to_markdown
#from utils.generate_tech_spec import generate_technical_spec_from_code
ts = time.time()
 
os.environ["OPIK_API_KEY"] = "EKCpqukuxgumDPQGxJCINTyIW" 
os.environ["OPIK_WORKSPACE"] = "geanderson-lenz"

load_dotenv() # Moved load_dotenv() to be earlier


if opik_tracer is None:
    # no-op callbacks
    class _Noop:
        def before_agent_callback(self, *args, **kwargs):
            return None
        def after_agent_callback(self, *args, **kwargs):
            return None
        def before_model_callback(self, *args, **kwargs):
            return None
        def after_model_callback(self, *args, **kwargs):
            return None
        def before_tool_callback(self, *args, **kwargs):
            return None
        def after_tool_callback(self, *args, **kwargs):
            return None
    opik_tracer = _Noop()


def load_instruction_from_file(file_name: str) -> str:
    """
    Lê o conteúdo de um arquivo de instrução (.txt) localizado na pasta 'instructions'.

    Args:
        file_name (str): O nome do arquivo de instrução (ex: 'my_instruction.txt').

    Returns:
        str: O conteúdo do arquivo como uma string.

    Raises:
        FileNotFoundError: Se o arquivo de instrução não for encontrado.
        IOError: Se houver um erro ao ler o arquivo.
    """
    # Obtém o diretório do arquivo atual (utils.py), que está em 'planner'
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Constrói o caminho para a pasta 'instructions' que está no mesmo diretório
    instructions_dir = os.path.join(current_dir, 'instructions')
    file_path = os.path.join(instructions_dir, file_name)

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Arquivo de instrução não encontrado: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise IOError(f"Erro ao ler o arquivo de instrução {file_path}: {e}")






# 2. Defina os sub-agentes usando as variáveis de schema para conectá-los

enrichment_agent = LlmAgent(
    name="enrichment_agent",
    model="gemini-2.5-flash",
    output_key="enrichment_output",  # Parâmetro do agente
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
    output_key="search_output",  # Parâmetro do agente
    instruction="""Você receberá uma entrada com a chave enrichment_output.
    Use o valor dessa chave para buscar as informações no Google.""",
    tools=[google_search]
)

main_agent = LlmAgent(
    name="content_creator",
    model="gemini-2.5-flash",
    output_key="creator_output",  # Parâmetro do agente
    instruction="""You are a content creator. You will receive input with the key search_output.
    Generate a clear, informative text based on the value of that key.""",
    description="Creates initial content based on user requests"
)

critique_agent = LlmAgent(
    name="content_evaluator",
    model="gemini-2.5-flash",
    output_key="critique_output",  # Parâmetro do agente
    instruction="""You are a critical evaluator. You will receive input with the key creator_output.
    Analyze the received content based on clarity, accuracy, and completeness.
    Your output's value should be an object containing the original content and your critique.""",
    description="Evaluates content and provides constructive feedback"
)

generator_agent = LlmAgent(
    name="content_refiner",
    model="gemini-2.5-flash",
    instruction="""You are a content refiner. You will receive a complex object under the key critique_output.
    Generate a new version of the content that addresses all points from the critique.""",
    description="Refines content based on feedback"
)

# 3. Crie o agente coordenador com a sequência definida
root_agent = SequentialAgent(
    name="self_reflection_system",
    sub_agents=[enrichment_agent, search_agent, main_agent, critique_agent, generator_agent],
    description="Execute the enrichment, search, main, critique and generator agent."
)

session_service = InMemorySessionService()

APP_NAME = "hello_app"
USER_ID = "demo-user"
