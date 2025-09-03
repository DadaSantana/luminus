#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import uuid
import time
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from google.adk.artifacts import InMemoryArtifactService
from models import RunSSERequest, RunSSEResponse, Content, ContentPart, UsageMetadata, TokensDetails, Actions
import logging
from firebase_config import initialize_firebase, get_firestore_client

# Carregar variáveis de ambiente
load_dotenv()

# Logger básico
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger("practia.server")

# API Key Configuration
API_KEY = os.getenv("PRACTIA_API_KEY")
if not API_KEY:
    logger.warning("PRACTIA_API_KEY não encontrada no ambiente. API funcionará sem autenticação.")

async def verify_api_key(request: Request):
    """Middleware para verificar API key no header"""
    # Pular verificação para rotas de health check
    if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
        return
    
    # Se API_KEY não estiver configurada, pular verificação
    if not API_KEY:
        return
    
    # Verificar header X-API-Key
    api_key = request.headers.get("X-API-Key")
    if not api_key or api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida ou ausente. Use o header 'X-API-Key'."
        )

# Initialize Firebase
try:
    db = initialize_firebase()
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    db = None
    print("Using in-memory storage as fallback")

app = FastAPI(title="Practia", version="1.0.0")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique as origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de verificação de API Key
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    try:
        await verify_api_key(request)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
    response = await call_next(request)
    return response

# Armazenamento em memória para sessões e mensagens (fallback)
sessions_db = {}
messages_db = {}  # {session_id: [messages]}

# Message management functions (Firestore with in-memory fallback)
async def save_message_to_firestore(session_id: str, message: Dict) -> bool:
    """Salva uma mensagem individual no Firestore com fallback para memória"""
    if db:
        try:
            from google.cloud import firestore
            # Salvar na subcoleção messages da sessão
            message_ref = db.collection('sessions').document(session_id).collection('messages').document()
            message_data = {
                **message,
                'messageId': message_ref.id,
                'sessionId': session_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            message_ref.set(message_data)
            logger.info(f"Message saved to Firestore for session {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving message to Firestore: {e}")
            # Fallback para armazenamento em memória
            if session_id not in messages_db:
                messages_db[session_id] = []
            message_data = {
                **message,
                'messageId': str(uuid.uuid4()),
                'sessionId': session_id,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'createdAt': datetime.now(timezone.utc).isoformat()
            }
            messages_db[session_id].append(message_data)
            logger.info(f"Message saved to memory for session {session_id}")
            return True
    else:
        # Usar armazenamento em memória diretamente
        if session_id not in messages_db:
            messages_db[session_id] = []
        message_data = {
            **message,
            'messageId': str(uuid.uuid4()),
            'sessionId': session_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'createdAt': datetime.now(timezone.utc).isoformat()
        }
        messages_db[session_id].append(message_data)
        logger.info(f"Message saved to memory for session {session_id}")
        return True

async def get_messages_from_firestore(session_id: str) -> List[Dict]:
    """Recupera mensagens de uma sessão do Firestore com fallback para memória"""
    if db:
        try:
            messages_ref = db.collection('sessions').document(session_id).collection('messages')
            docs = messages_ref.order_by('createdAt').stream()
            messages = []
            for doc in docs:
                message_data = doc.to_dict()
                messages.append({
                    'role': message_data.get('role'),
                    'content': message_data.get('content'),
                    'timestamp': message_data.get('timestamp', message_data.get('createdAt'))
                })
            return messages
        except Exception as e:
            logger.error(f"Error getting messages from Firestore: {e}")
            # Fallback para armazenamento em memória
            if session_id in messages_db:
                messages = []
                for message_data in messages_db[session_id]:
                    messages.append({
                        'role': message_data.get('role'),
                        'content': message_data.get('content'),
                        'timestamp': message_data.get('timestamp', message_data.get('createdAt'))
                    })
                return messages
            return []
    else:
        # Usar armazenamento em memória diretamente
        if session_id in messages_db:
            messages = []
            for message_data in messages_db[session_id]:
                messages.append({
                    'role': message_data.get('role'),
                    'content': message_data.get('content'),
                    'timestamp': message_data.get('timestamp', message_data.get('createdAt'))
                })
            return messages
        return []
    return []

# Session management functions (Firestore with in-memory fallback)
async def get_session(session_id: str) -> Optional[Dict]:
    """Recupera uma sessão"""
    if db:
        try:
            doc_ref = db.collection('sessions').document(session_id)
            doc = doc_ref.get()
            if doc.exists:
                session_data = doc.to_dict()
                # Carregar mensagens da subcoleção
                messages = await get_messages_from_firestore(session_id)
                session_data['messages'] = messages
                return session_data
            return None
        except Exception as e:
            logger.error(f"Error getting session from Firestore: {e}")
            return sessions_db.get(session_id)
    else:
        return sessions_db.get(session_id)

async def save_session(session_id: str, session_data: Dict) -> bool:
    """Salva uma sessão"""
    if db:
        try:
            from google.cloud import firestore
            doc_ref = db.collection('sessions').document(session_id)
            
            # Converter timestamps para Firestore SERVER_TIMESTAMP se necessário
            firestore_data = session_data.copy()
            if 'createdAt' in firestore_data and isinstance(firestore_data['createdAt'], str):
                firestore_data['createdAt'] = firestore.SERVER_TIMESTAMP
            if 'lastActivity' in firestore_data and isinstance(firestore_data['lastActivity'], str):
                firestore_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.set(firestore_data)
            logger.info(f"Session {session_id} saved to Firestore")
            return True
        except Exception as e:
            logger.error(f"Error saving session to Firestore: {e}")
            sessions_db[session_id] = session_data
            return True
    else:
        sessions_db[session_id] = session_data
        return True

async def update_session(session_id: str, updates: Dict) -> bool:
    """Atualiza uma sessão"""
    if db:
        try:
            from google.cloud import firestore
            doc_ref = db.collection('sessions').document(session_id)
            doc = doc_ref.get()
            if doc.exists:
                # Converter timestamps para Firestore SERVER_TIMESTAMP se necessário
                firestore_updates = updates.copy()
                if 'lastActivity' in firestore_updates:
                    firestore_updates['updatedAt'] = firestore.SERVER_TIMESTAMP
                    # Remover lastActivity se existir, usar updatedAt
                    if 'lastActivity' in firestore_updates:
                        del firestore_updates['lastActivity']
                
                doc_ref.update(firestore_updates)
                logger.info(f"Session {session_id} updated in Firestore")
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating session in Firestore: {e}")
            if session_id in sessions_db:
                sessions_db[session_id].update(updates)
                return True
            return False
    else:
        if session_id in sessions_db:
            sessions_db[session_id].update(updates)
            return True
        return False

async def delete_session(session_id: str) -> bool:
    """Marca uma sessão como deletada (soft delete)"""
    if db:
        try:
            from google.cloud.firestore import SERVER_TIMESTAMP
            doc_ref = db.collection('sessions').document(session_id)
            doc_ref.update({
                'deleted': True,
                'deletedAt': SERVER_TIMESTAMP
            })
            logger.info(f"Session {session_id} marked as deleted in Firestore")
            return True
        except Exception as e:
            logger.error(f"Error marking session as deleted in Firestore: {e}")
            if session_id in sessions_db:
                sessions_db[session_id]['deleted'] = True
                sessions_db[session_id]['deletedAt'] = datetime.now(timezone.utc).isoformat()
                return True
            return False
    else:
        if session_id in sessions_db:
            sessions_db[session_id]['deleted'] = True
            sessions_db[session_id]['deletedAt'] = datetime.now(timezone.utc).isoformat()
            return True
        return False

async def list_user_sessions(user_id: str, app_name: Optional[str] = None) -> List[Dict]:
    """Lista sessões de um usuário (excluindo as deletadas)"""
    user_sessions = []
    if db:
        try:
            sessions_ref = db.collection('sessions')
            query = sessions_ref.where('userId', '==', user_id)
            if app_name:
                query = query.where('appName', '==', app_name)
            docs = query.stream()
            for doc in docs:
                session_data = doc.to_dict()
                # Filtrar sessões deletadas
                if not session_data.get('deleted', False):
                    session_data['sessionId'] = doc.id
                    user_sessions.append(session_data)
            return user_sessions
        except Exception as e:
            logger.error(f"Error listing sessions from Firestore: {e}")
            # Fallback to in-memory
            for session in sessions_db.values():
                if session["userId"] == user_id and not session.get('deleted', False):
                    if app_name is None or session.get("appName") == app_name:
                        user_sessions.append(session)
            return user_sessions
    else:
         for session in sessions_db.values():
             if session["userId"] == user_id and not session.get('deleted', False):
                 if app_name is None or session["appName"] == app_name:
                     user_sessions.append(session)
         return user_sessions
    return user_sessions

class MessagePart(BaseModel):
    text: str

class Message(BaseModel):
    parts: List[MessagePart]
    role: str

class RunRequest(BaseModel):
    appName: str
    userId: str
    sessionId: str
    newMessage: Message

class RunResponse(BaseModel):
    response: str
    status: str

class SessionCreateRequest(BaseModel):
    appName: str
    userId: str

class SessionCreateResponse(BaseModel):
    sessionId: str
    status: str

class SessionInfo(BaseModel):
    sessionId: str
    appName: str
    userId: str
    createdAt: str
    lastActivity: str
    messageCount: int

class SessionListResponse(BaseModel):
    sessions: List[SessionInfo]
    status: str

class SessionDeleteResponse(BaseModel):
    sessionId: str
    status: str



@app.get("/")
async def root():
    return {"message": "Practia API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/sessions", response_model=SessionCreateResponse)
async def create_session(request: SessionCreateRequest):
    """Cria uma nova sessão para o usuário"""
    try:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        session_data = {
            "sessionId": session_id,
            "appName": request.appName,
            "userId": request.userId,
            "createdAt": now,
            "lastActivity": now,
            "messageCount": 0,
            "messages": []
        }
        
        await save_session(session_id, session_data)
        
        return SessionCreateResponse(
            sessionId=session_id,
            status="created"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions", response_model=SessionListResponse)
async def list_sessions(userId: str, appName: Optional[str] = None):
    """Lista todas as sessões de um usuário"""
    try:
        sessions = await list_user_sessions(userId, appName)
        user_sessions = []
        
        for session in sessions:
            user_sessions.append(SessionInfo(
                sessionId=session["sessionId"],
                appName=session["appName"],
                userId=session["userId"],
                createdAt=session["createdAt"],
                lastActivity=session["lastActivity"],
                messageCount=session["messageCount"]
            ))
        
        return SessionListResponse(
            sessions=user_sessions,
            status="success"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sessions/{session_id}", response_model=SessionDeleteResponse)
async def delete_session_endpoint(session_id: str):
    """Deleta uma sessão específica"""
    try:
        session = await get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        await delete_session(session_id)
        
        return SessionDeleteResponse(
            sessionId=session_id,
            status="deleted"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions/{session_id}")
async def get_session_endpoint(session_id: str):
    """Obtém informações de uma sessão específica"""
    try:
        session = await get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        return SessionInfo(
            sessionId=session["sessionId"],
            appName=session["appName"],
            userId=session["userId"],
            createdAt=session["createdAt"],
            lastActivity=session["lastActivity"],
            messageCount=session["messageCount"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



#@app.post("/run", response_model=RunResponse)
#async def run_agent(request: RunRequest):
    try:
        # Verificar se a sessão existe
        session = await get_session(request.sessionId)
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        
        # Extrair a mensagem do usuário
        user_message = request.newMessage.parts[0].text if request.newMessage.parts else ""
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Mensagem vazia")
        
        # Preparar atualizações da sessão
        now = datetime.now(timezone.utc).isoformat()
        new_message = {
            "role": "user",
            "text": user_message,
            "timestamp": now
        }
        
        # Processar a mensagem usando o agente ADK
        response_text = await process_message_with_agent(user_message)
        
        response_message = {
            "role": "assistant",
            "text": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Atualizar sessão no Firebase
        updates = {
            "lastActivity": now,
            "messageCount": session["messageCount"] + 1,
            "messages": session["messages"] + [new_message, response_message]
        }
        
        await update_session(request.sessionId, updates)
        
        return RunResponse(
            response=response_text,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_message_with_agent(message: str) -> str:
    """Processa uma mensagem usando o agente ADK real"""
    try:
        from google.adk.sessions import DatabaseSessionService
        from google.adk.runners import Runner
        from agent import root_agent
        from google.genai import types
        import uuid
        
        # Configurações
        DB_URL = "sqlite:///./multi_agent_data.db"
        APP_NAME = "Practia"
        
        # Gerar IDs únicos para esta sessão
        unique_id = str(uuid.uuid4())
        session_id = unique_id
        user_id = unique_id
        
        # Inicializar o serviço de sessão
        session_service = DatabaseSessionService(db_url=DB_URL)
        
        # Tentar obter sessão existente ou criar nova
        current_session = None
        try:
            current_session = session_service.get_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
        except Exception as e:
            print(f"Sessão não encontrada, criando nova: {e}")
        
        # Se não encontrou sessão, criar nova
        if current_session is None:
            current_session = session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )

        artifact_service = InMemoryArtifactService()
        
        # Inicializar o Runner do ADK com nosso agente
        runner = Runner(
            app_name=APP_NAME,
            agent=root_agent,
            session_service=session_service,
            artifact_service=artifact_service,
        )
        
        # Formatar a mensagem do usuário
        user_message = types.Content(
            role="user", parts=[types.Part.from_text(text=message)]
        )
        
        # Executar o agente
        events = runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message,
        )
        
        # Processar eventos para encontrar a resposta final
        final_response = None
        last_event_content = None
        
        async for event in events:
            if event.is_final_response():
                if event.content and event.content.parts:
                    # Linha que mostra o conteúdo da resposta do agente
                    last_event_content = event.content.parts[0].text
        
        if last_event_content:
            final_response = last_event_content
        else:
            print("Nenhuma resposta final encontrada do agente.")
            final_response = "Desculpe, não consegui processar sua pergunta no momento."
        
        return final_response

    except Exception as e:
        logger.exception(f"Erro ao usar agente ADK: {e}")
        return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."

async def process_message_stream(message: str, session_id: Optional[str] = None, user_id: Optional[str] = None):
    """Gera deltas de texto da resposta do agente em tempo real quando possível.

    Tenta usar o ADK (Runner.run_async) e emitir incrementos conforme os eventos chegam.
    Caso não seja possível, emite apenas a resposta final (fallback).
    """
    try:
        from google.adk.sessions import DatabaseSessionService
        from google.adk.runners import Runner
        from agent import root_agent
        from google.genai import types
        import uuid as _uuid

        DB_URL = "sqlite:///./multi_agent_data.db"
        APP_NAME = "Practia"

        # Usar IDs recebidos do cliente quando disponíveis para manter consistência
        if session_id is None:
            session_id = str(_uuid.uuid4())
        if user_id is None:
            user_id = str(_uuid.uuid4())

        session_service = DatabaseSessionService(db_url=DB_URL)

        current_session = None
        try:
            current_session = session_service.get_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
        except Exception:
            current_session = None
        if current_session is None:
            session_service.create_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)

        artifact_service = InMemoryArtifactService()

        runner = Runner(app_name=APP_NAME, agent=root_agent, session_service=session_service, artifact_service=artifact_service)

        user_message = types.Content(role="user", parts=[types.Part.from_text(text=message)])
        events = runner.run_async(user_id=user_id, session_id=session_id, new_message=user_message)
        logger.info("[stream] ADK runner.run_async iniciado")

        accumulated = ""
        last_text = ""
        async for event in events:
            # Alguns eventos podem conter texto parcial (dependendo do provedor)
            try:
                if event.content and event.content.parts:
                    text = event.content.parts[0].text or ""
                    # emitir somente o delta novo
                    if text:
                        if len(text) > len(accumulated):
                            delta = text[len(accumulated):]
                            accumulated = text
                            logger.info(f"[stream] ADK delta len={len(delta)} preview='{delta[:40]}'")
                            yield delta
                        last_text = text
            except Exception:
                # ignorar eventos sem texto
                pass

        # Garante retorno final (pode ser igual ao acumulado)
        if accumulated:
            logger.info("[stream] ADK concluiu com deltas acumulados")
            return

        # Se não houve nada incremental mas houve conteúdo final, emitir uma vez
        if last_text:
            logger.info(f"[stream] Emitindo texto final sem deltas; len={len(last_text)}")
            yield last_text
            return

        # Sem conteúdo
        logger.info("[stream] Nenhum conteúdo recebido do ADK")
        yield "Desculpe, não recebi conteúdo de resposta do agente."
    except Exception as err:
        logger.exception(f"[stream] Erro durante streaming: {err}")
        yield "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."

@app.get("/tools")
async def list_tools():
    """Lista as ferramentas disponíveis"""
    return {
        "tools": [
            {
                "name": "get_weather",
                "description": "Retorna informações sobre o clima de uma cidade",
                "parameters": {"city": "string"}
            },
            {
                "name": "get_current_time", 
                "description": "Retorna o horário atual de uma cidade",
                "parameters": {"city": "string"}
            },
            {
                "name": "general_knowledge",
                "description": "Responde perguntas gerais sobre geografia, história e outros temas",
                "parameters": {"question": "string"}
            }
        ]
    }

@app.get("/agent-info")
async def agent_info():
    """Informações do agente atual (nome, descrição e ferramentas)."""
    try:
        # Importação tardia para evitar queda do servidor quando dependências opcionais do agente não estão instaladas
        from agent import root_agent  # type: ignore
        return {
            "name": getattr(root_agent, "name", "practia-agent"),
            "description": getattr(root_agent, "description", "Agente de conhecimento geral com clima e horário"),
            "tools": [
                getattr(t, "__name__", str(t)) for t in getattr(root_agent, "tools", [])
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/users")
async def get_admin_users():
    """Lista usuários registrados no sistema (rota administrativa)."""
    try:
        if db:
            # Buscar usuários no Firestore
            users_ref = db.collection('users')
            docs = users_ref.stream()
            
            users = []
            for doc in docs:
                user_data = doc.to_dict()
                users.append({
                    "username": user_data.get('email', user_data.get('name', 'Unknown')),
                    "role": user_data.get('userType', 'user')
                })
            
            return users
        else:
            # Fallback para dados simulados quando Firestore não está disponível
            return [
                {"username": "admin@practia.com", "role": "admin"},
                {"username": "user@practia.com", "role": "user"}
            ]
    except Exception as e:
        logger.error(f"Erro ao buscar usuários: {e}")
        # Retornar dados simulados em caso de erro
        return [
            {"username": "admin@practia.com", "role": "admin"},
            {"username": "user@practia.com", "role": "user"}
        ]

@app.post("/run_sse")
async def run_sse(request: RunSSERequest):
    """Processa uma mensagem e responde. Se streaming=true, envia via SSE (text/event-stream)."""
    try:
        # Tenta obter a sessão. Se não existir, cria uma nova.
        logger.info(f"[/run_sse] sessionId={request.sessionId} userId={request.userId} appName={request.appName} streaming={request.streaming}")
        session = await get_session(request.sessionId)
        if not session:
            now = datetime.now(timezone.utc).isoformat()
            session = {
                "sessionId": request.sessionId,
                "appName": request.appName,
                "userId": request.userId,
                "createdAt": now,
                "lastActivity": now,
                "messageCount": 0,
                "messages": []
            }
            await save_session(request.sessionId, session)
        
        user_message_text = request.newMessage.parts[0].text
        logger.info(f"[/run_sse] nova mensagem len={len(user_message_text)} preview='{user_message_text[:80]}'")
        
        # Registrar mensagem do usuário
        user_message = {
            "role": "user",
            "content": user_message_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        session["messages"].append(user_message)
        # Salvar mensagem do usuário no Firestore
        await save_message_to_firestore(request.sessionId, user_message)
        
        if request.streaming:
            async def event_generator():
                invocation_id = f"e-{str(uuid.uuid4())}"
                final_accumulated = []
                
                # Helper para dividir deltas grandes em partes menores e preservar palavras/linhas
                def chunk_delta_text(delta_text: str, max_chars: int = 120):
                    if not delta_text:
                        return []
                    chunks = []
                    current = []
                    current_len = 0
                    for token in delta_text.split(" "):
                        # manter quebras de linha dentro do token
                        token_str = (" " if current else "") + token
                        if current_len + len(token_str) > max_chars or "\n\n" in token_str:
                            # se tiver parágrafo, quebrar no parágrafo
                            parts = token_str.split("\n\n")
                            if current:
                                chunks.append("".join(current))
                                current = []
                                current_len = 0
                            for i, p in enumerate(parts):
                                if not p:
                                    chunks.append("\n\n")
                                else:
                                    chunks.append(p)
                        else:
                            current.append(token_str)
                            current_len += len(token_str)
                    if current:
                        chunks.append("".join(current))
                    # Se ainda ficaram pedaços enormes (sem espaços), quebrar por tamanho fixo
                    normalized = []
                    for c in chunks:
                        if len(c) <= max_chars:
                            normalized.append(c)
                        else:
                            for i in range(0, len(c), max_chars):
                                normalized.append(c[i:i+max_chars])
                    return normalized
                try:
                    # Sequência real de subagentes definidos em agent.py (ordem do LoopAgent)
                    agent_sequence = [
                        "enrichment_agent",
                        "structure_agent",
                        "search_agent",
                        "tech_lead_agent",
                        "coder_agent",
                        "coder_reviewer_agent",
                    ]
                    current_agent_idx = 0
                    total_emitted = 0
                    # tamanho aproximado por agente para progressão de status durante streaming de texto
                    chars_per_agent = 800
                    # Emitir início do primeiro agente
                    first = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "thinking", "timestamp": time.time()}
                    yield f"data: {json.dumps(first, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0)
                    first_exec = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "executing", "timestamp": time.time()}
                    yield f"data: {json.dumps(first_exec, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0)

                    # Tenta streaming real via ADK com os IDs do cliente
                    async for delta in process_message_stream(user_message_text, session_id=request.sessionId, user_id=request.userId):
                        if delta:
                            final_accumulated.append(delta)
                            for piece in chunk_delta_text(delta):
                                payload = {
                                    "type": "delta",
                                    "invocationId": invocation_id,
                                    "delta": piece,
                                    "agent": agent_sequence[current_agent_idx],
                                    "done": False,
                                    "timestamp": time.time(),
                                    "author": "practia-agent",
                                }
                                logger.info(f"[/run_sse] emitindo delta len={len(piece)} preview='{piece[:40]}'")
                                yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                                await asyncio.sleep(0)
                                # Atualizar progressão por agente
                                total_emitted += len(piece)
                                while current_agent_idx < len(agent_sequence) - 1 and total_emitted >= (current_agent_idx + 1) * chars_per_agent:
                                    # concluir agente atual
                                    done_evt = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "done", "timestamp": time.time()}
                                    yield f"data: {json.dumps(done_evt, ensure_ascii=False)}\n\n"
                                    await asyncio.sleep(0)
                                    # iniciar próximo
                                    current_agent_idx += 1
                                    next_think = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "thinking", "timestamp": time.time()}
                                    yield f"data: {json.dumps(next_think, ensure_ascii=False)}\n\n"
                                    await asyncio.sleep(0)
                                    next_exec = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "executing", "timestamp": time.time()}
                                    yield f"data: {json.dumps(next_exec, ensure_ascii=False)}\n\n"
                                    await asyncio.sleep(0)

                    final_text = ("".join(final_accumulated)).strip()
                    if final_text:
                        logger.info(f"[/run_sse] final_text len={len(final_text)}")
                        assistant_message = {
                            "role": "assistant",
                            "content": final_text,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }
                        session["messages"].append(assistant_message)
                        # Salvar mensagem do assistente no Firestore
                        await save_message_to_firestore(request.sessionId, assistant_message)
                        await update_session(request.sessionId, {
                            "lastActivity": datetime.now(timezone.utc).isoformat(),
                            "messages": session["messages"],
                            "messageCount": len(session["messages"]),
                        })
                        # Garantir que todos os agentes restantes recebam 'done'
                        while current_agent_idx < len(agent_sequence):
                            fin = {"type": "status", "agent": agent_sequence[current_agent_idx], "state": "done", "timestamp": time.time()}
                            yield f"data: {json.dumps(fin, ensure_ascii=False)}\n\n"
                            await asyncio.sleep(0)
                            current_agent_idx += 1

                    done_evt = {"type": "done", "invocationId": invocation_id, "done": True, "timestamp": time.time()}
                    logger.info(f"[/run_sse] done event: {done_evt}")
                    yield f"data: {json.dumps(done_evt, ensure_ascii=False)}\n\n"
                except Exception as stream_err:
                    err_payload = {"error": str(stream_err), "done": True}
                    logger.exception(f"[/run_sse] erro no streaming: {stream_err}")
                    yield f"data: {json.dumps(err_payload, ensure_ascii=False)}\n\n"

            headers = {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
            return StreamingResponse(event_generator(), headers=headers, media_type="text/event-stream")

        # Não-streaming (comportamento anterior)
        response_text = await process_message_with_agent(user_message_text)
        assistant_message = {
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        session["messages"].append(assistant_message)
        # Salvar mensagem do assistente no Firestore
        await save_message_to_firestore(request.sessionId, assistant_message)
        await update_session(request.sessionId, {
            "lastActivity": datetime.now(timezone.utc).isoformat(),
            "messages": session["messages"],
            "messageCount": len(session["messages"])
        })
        
        invocation_id = f"e-{str(uuid.uuid4())}"
        response_id = str(uuid.uuid4())
        prompt_tokens = len(user_message_text.split())
        response_tokens = len(response_text.split())
        total_tokens = prompt_tokens + response_tokens
        
        return RunSSEResponse(
            content=Content(parts=[ContentPart(text=response_text)], role="model"),
            usageMetadata=UsageMetadata(
                candidatesTokenCount=response_tokens,
                candidatesTokensDetails=[TokensDetails(modality="TEXT", tokenCount=response_tokens)],
                promptTokenCount=prompt_tokens,
                promptTokensDetails=[TokensDetails(modality="TEXT", tokenCount=prompt_tokens)],
                totalTokenCount=total_tokens,
            ),
            invocationId=invocation_id,
            author="practia-agent",
            actions=Actions(stateDelta={}, artifactDelta={}, requestedAuthConfigs={}),
            id=response_id,
            timestamp=time.time(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)