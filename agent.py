# Standard library imports
import asyncio
import datetime
import os
import time
import uuid

# Third-party imports
from dotenv import load_dotenv
from google.adk.agents import LlmAgent, LoopAgent
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







# Define sub-agents
enrichment_agent = LlmAgent(
    name="enrichment_agent",
    model="gemini-2.0-flash",
    instruction=load_instruction_from_file("enrichment_agent_instruction.txt"),
    output_key='enrichment_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

structure_agent = LlmAgent(
    name="structure_agent",
    model="gemini-2.0-flash",
    instruction=load_instruction_from_file("structure_agent_instruction.txt"),
    output_key='structure_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

search_agent = LlmAgent(
    name="search_agent",
    model="gemini-2.0-flash",
    instruction=load_instruction_from_file("search_agent_instruction.txt"),
    tools=[google_search],
    output_key='search_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

tech_lead_agent = LlmAgent(
    name="tech_lead_agent",
    model="gemini-2.5-pro-preview-06-05", # Using a more powerful model for aggregation and planning
    instruction=load_instruction_from_file("tech_lead_agent_instruction.txt"),
    output_key='tech_lead_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

coder_agent = LlmAgent(
    name="coder_agent",
    model="gemini-2.5-pro-preview-06-05", # Using a more powerful model for coding
    instruction=load_instruction_from_file("coder_agent_instruction.txt"),
    output_key='coder_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

coder_reviewer_agent = LlmAgent(
    name="coder_reviewer_agent",
    model="gemini-2.5-pro-preview-06-05", # Can be a less powerful model if only reviewing
    instruction=load_instruction_from_file("coder_reviewer_instruction.txt"),
    output_key='coder_reviewer_output',
    before_agent_callback=opik_tracer.before_agent_callback,
    after_agent_callback=opik_tracer.after_agent_callback,
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

# Create parent agent and assign children via sub_agents
root_agent = LoopAgent(
    name="root_agent",
    sub_agents=[
        enrichment_agent,
        structure_agent,
        search_agent,
        tech_lead_agent,
        coder_agent,
        coder_reviewer_agent
    ],
    max_iterations=1,
)

session_service = InMemorySessionService()

APP_NAME = "hello_app"
USER_ID = "demo-user"