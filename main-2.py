import os

import uvicorn

import json

from fastapi import FastAPI, HTTPException, Request

from fastapi.responses import StreamingResponse

from pydantic import BaseModel

from dotenv import load_dotenv
 
from agent import root_agent

from google.adk.runners import Runner

from google.adk.sessions import InMemorySessionService

from google.genai.types import Content, Part
 
# Carregar variáveis de ambiente

load_dotenv()
 
# Inicializar o app FastAPI

app = FastAPI(

    title="Google ADK FastAPI Agent",

    description="Exemplo de agente ADK com endpoints padrão e de streaming (SSE).",

)
 
# Usar serviço de sessão em memória para simplicidade

session_service = InMemorySessionService()
 
# Inicializar o Runner do ADK

runner = Runner(

    agent=root_agent,

    session_service=session_service,

    app_name="adk_fastapi_example",

)
 
class InteractionRequest(BaseModel):

    session_id: str

    user_input: str
 
class StandardResponse(BaseModel):

    session_id: str

    agent_response: str
 
# Função auxiliar para obter ou criar sessão

def get_or_create_session(session_id: str):

    try:

        return session_service.get_session(session_id=session_id)

    except Exception:

        return session_service.create_session(

            session_id=session_id,

            user_id="default_user",

            app_name="adk_fastapi_example",

        )
 
# --- Endpoint 1: Resposta Padrão e Completa ---

@app.post("/run", response_model=StandardResponse)

async def run_agent_standard(request: InteractionRequest):

    """

    Endpoint para interação padrão: envia a pergunta e recebe a resposta completa.

    """

    try:

        session = get_or_create_session(request.session_id)

        user_message = Content(role="user", parts=[Part.from_text(request.user_input)])
 
        final_response = ""

        # Executa o runner e espera a resposta final

        async for event in runner.run_async(

            session_id=session.session_id,

            user_id=session.user_id,

            new_message=user_message,

        ):

            if event.is_final_response():

                final_response = "".join(part.text for part in event.message.parts)
 
        return StandardResponse(

            session_id=session.session_id,

            agent_response=final_response,

        )

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
 
 
# --- Endpoint 2: Resposta com Streaming (Server-Sent Events) ---

@app.post("/run_sse")

async def run_agent_streaming(request_body: InteractionRequest):

    """

    Endpoint para interação com streaming: recebe pedaços da resposta em tempo real.

    """

    session = get_or_create_session(request_body.session_id)

    user_message = Content(role="user", parts=[Part.from_text(request_body.user_input)])
 
    async def stream_generator():

        try:

            # Itera sobre os eventos do runner de forma assíncrona

            async for event in runner.run_async(

                session_id=session.session_id,

                user_id=session.user_id,

                new_message=user_message,

            ):

                if event.is_response_chunk():

                    # Formata o chunk de texto para o padrão SSE

                    chunk_text = "".join(part.text for part in event.message.parts)

                    sse_data = {"chunk": chunk_text}

                    yield f"data: {json.dumps(sse_data)}\n\n"

            # Sinaliza o fim do stream

            yield f"data: {json.dumps({'status': 'done'})}\n\n"
 
        except Exception as e:

            error_message = {"error": str(e)}

            yield f"data: {json.dumps(error_message)}\n\n"
 
    # Retorna uma StreamingResponse que consome o gerador assíncrono

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
 
if __name__ == "__main__":

    uvicorn.run(app, host="0.0.0.0", port=8000)
 