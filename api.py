from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import time

# Importando o agente ADK
from agent import root_agent

# Criando a aplicação FastAPI
app = FastAPI(title="Weather Time Agent API")

# Configurando CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique as origens permitidas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Armazenamento em memória para sessões e histórico
# Em um ambiente de produção, isso seria substituído por um banco de dados
sessions = {}
users = {
    "admin": {
        "username": "admin",
        "password": "admin123",  # Em produção, use hash de senha
        "role": "admin"
    },
    "user": {
        "username": "user",
        "password": "user123",  # Em produção, use hash de senha
        "role": "user"
    }
}

# Modelos Pydantic
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    username: str
    role: str
    token: str

class MessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    response: str
    session_id: str
    timestamp: str

class Session(BaseModel):
    session_id: str
    user_id: str
    created_at: str
    messages: List[Dict[str, Any]] = []

class SessionResponse(BaseModel):
    session_id: str
    created_at: str
    message_count: int

# Novos modelos para o endpoint /run_sse
class MessagePart(BaseModel):
    text: str

class NewMessage(BaseModel):
    role: str
    parts: List[MessagePart]

class RunSSERequest(BaseModel):
    appName: str
    userId: str
    sessionId: str
    newMessage: NewMessage
    streaming: bool
    stateDelta: Optional[Dict[str, Any]] = None

class ContentPart(BaseModel):
    text: str

class Content(BaseModel):
    parts: List[ContentPart]
    role: str

class TokensDetails(BaseModel):
    modality: str
    tokenCount: int

class UsageMetadata(BaseModel):
    candidatesTokenCount: int
    candidatesTokensDetails: List[TokensDetails]
    promptTokenCount: int
    promptTokensDetails: List[TokensDetails]
    totalTokenCount: int

class Actions(BaseModel):
    stateDelta: Dict[str, Any]
    artifactDelta: Dict[str, Any]
    requestedAuthConfigs: Dict[str, Any]

class RunSSEResponse(BaseModel):
    content: Content
    usageMetadata: UsageMetadata
    invocationId: str
    author: str
    actions: Actions
    id: str
    timestamp: float

# Função para autenticação
def authenticate_user(username: str, password: str):
    if username in users and users[username]["password"] == password:
        return users[username]
    return None

# Função para verificar token (simulação simples)
def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = token.replace("Bearer ", "")
    
    # Em um sistema real, você verificaria o token JWT ou similar
    # Aqui estamos apenas verificando se o token existe em nosso armazenamento
    for username, user_data in users.items():
        if "token" in user_data and user_data["token"] == token:
            return user_data
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Rotas da API

@app.post("/run_sse", response_model=RunSSEResponse)
async def run_sse(request: RunSSERequest):
    try:
        # Extrair o texto da mensagem
        message_text = request.newMessage.parts[0].text
        
        # Implementação simplificada usando as funções diretamente
        message_lower = message_text.lower()
        
        if "clima" in message_lower or "weather" in message_lower:
            # Extrair nome da cidade
            words = message_text.split()
            city = None
            for i, word in enumerate(words):
                if word.lower() in ["em", "in", "de", "of"] and i + 1 < len(words):
                    city_parts = []
                    j = i + 1
                    while j < len(words) and words[j].lower() not in ["?", "!", ".", ","]:
                        # Remover pontuação da palavra
                        clean_word = words[j].rstrip("?!.,")
                        city_parts.append(clean_word)
                        j += 1
                    city = " ".join(city_parts)
                    break
            
            if not city:
                city = "New York"
            
            from agent import get_weather
            weather_result = get_weather(city)
            
            if weather_result["status"] == "success":
                response_text = weather_result["report"]
            else:
                response_text = weather_result["error_message"]
                
        elif "horário" in message_lower or "time" in message_lower or "hora" in message_lower:
            # Extrair nome da cidade
            words = message_text.split()
            city = None
            for i, word in enumerate(words):
                if word.lower() in ["em", "in", "de", "of"] and i + 1 < len(words):
                    city_parts = []
                    j = i + 1
                    while j < len(words) and words[j].lower() not in ["?", "!", ".", ","]:
                        # Remover pontuação da palavra
                        clean_word = words[j].rstrip("?!.,")
                        city_parts.append(clean_word)
                        j += 1
                    city = " ".join(city_parts)
                    break
            
            if not city:
                city = "New York"
            
            from agent import get_current_time
            time_result = get_current_time(city)
            
            if time_result["status"] == "success":
                response_text = time_result["report"]
            else:
                response_text = time_result["error_message"]
        else:
            response_text = "Olá! Sou um agente especializado em informações sobre clima e horário. Posso ajudar você com perguntas sobre o clima ou horário atual em diferentes cidades. Por favor, me pergunte algo como 'Qual é o clima em New York?' ou 'Que horas são em New York?'"
        
        # Gerar IDs únicos
        invocation_id = f"e-{str(uuid.uuid4())}"
        response_id = str(uuid.uuid4())
        
        # Calcular tokens (simulado - em produção você usaria o tokenizer real)
        prompt_tokens = len(message_text.split()) * 1.3  # Aproximação
        response_tokens = len(response_text.split()) * 1.3  # Aproximação
        total_tokens = prompt_tokens + response_tokens
        
        # Construir a resposta no formato esperado
        response = RunSSEResponse(
            content=Content(
                parts=[ContentPart(text=response_text)],
                role="model"
            ),
            usageMetadata=UsageMetadata(
                candidatesTokenCount=int(response_tokens),
                candidatesTokensDetails=[TokensDetails(modality="TEXT", tokenCount=int(response_tokens))],
                promptTokenCount=int(prompt_tokens),
                promptTokensDetails=[TokensDetails(modality="TEXT", tokenCount=int(prompt_tokens))],
                totalTokenCount=int(total_tokens)
            ),
            invocationId=invocation_id,
            author="weather_time_agent",
            actions=Actions(
                stateDelta={},
                artifactDelta={},
                requestedAuthConfigs={}
            ),
            id=response_id,
            timestamp=time.time()
        )
        
        return response
        
    except Exception as e:
        # Em caso de erro, retornar uma resposta de erro no formato esperado
        invocation_id = f"e-{str(uuid.uuid4())}"
        response_id = str(uuid.uuid4())
        error_message = f"Error processing message: {str(e)}"
        
        return RunSSEResponse(
            content=Content(
                parts=[ContentPart(text=error_message)],
                role="model"
            ),
            usageMetadata=UsageMetadata(
                candidatesTokenCount=len(error_message.split()),
                candidatesTokensDetails=[TokensDetails(modality="TEXT", tokenCount=len(error_message.split()))],
                promptTokenCount=0,
                promptTokensDetails=[TokensDetails(modality="TEXT", tokenCount=0)],
                totalTokenCount=len(error_message.split())
            ),
            invocationId=invocation_id,
            author="weather_time_agent",
            actions=Actions(
                stateDelta={},
                artifactDelta={},
                requestedAuthConfigs={}
            ),
            id=response_id,
            timestamp=time.time()
        )

@app.post("/login", response_model=UserResponse)
async def login(user_data: UserLogin):
    user = authenticate_user(user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Gerar token (em produção, use JWT)
    token = str(uuid.uuid4())
    users[user_data.username]["token"] = token
    
    return {
        "username": user["username"],
        "role": user["role"],
        "token": token
    }

@app.post("/sessions", response_model=SessionResponse)
async def create_session(current_user: dict = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    sessions[session_id] = Session(
        session_id=session_id,
        user_id=current_user["username"],
        created_at=timestamp,
        messages=[]
    )
    
    return {
        "session_id": session_id,
        "created_at": timestamp,
        "message_count": 0
    }

@app.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(current_user: dict = Depends(get_current_user)):
    user_sessions = []
    
    for session_id, session in sessions.items():
        # Administradores podem ver todas as sessões, usuários comuns apenas as suas
        if current_user["role"] == "admin" or session.user_id == current_user["username"]:
            user_sessions.append({
                "session_id": session.session_id,
                "created_at": session.created_at,
                "message_count": len(session.messages)
            })
    
    return user_sessions

@app.get("/sessions/{session_id}")
async def get_session_details(session_id: str, current_user: dict = Depends(get_current_user)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Verificar permissão
    if current_user["role"] != "admin" and session.user_id != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    return session

@app.post("/sessions/{session_id}/message", response_model=MessageResponse)
async def send_message(session_id: str, message_request: MessageRequest, current_user: dict = Depends(get_current_user)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Verificar permissão
    if current_user["role"] != "admin" and session.user_id != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    # Processar a mensagem com o agente ADK
    try:
        # Executar o agente com a mensagem do usuário
        agent_response = root_agent.run(message_request.message)
        response_text = agent_response.response
    except Exception as e:
        response_text = f"Error processing message: {str(e)}"
    
    timestamp = datetime.now().isoformat()
    
    # Armazenar a mensagem e resposta na sessão
    message_data = {
        "user_message": message_request.message,
        "agent_response": response_text,
        "timestamp": timestamp
    }
    
    session.messages.append(message_data)
    
    return {
        "response": response_text,
        "session_id": session_id,
        "timestamp": timestamp
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "agent": "weather_time_agent"}

# Rota para obter informações do agente
@app.get("/agent-info")
async def agent_info():
    return {
        "name": root_agent.name,
        "description": root_agent.description,
        "tools": [tool.__name__ for tool in root_agent.tools]
    }

# Rota para administradores gerenciarem usuários
@app.get("/admin/users")
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Retornar lista de usuários sem as senhas
    return [
        {"username": username, "role": user_data["role"]}
        for username, user_data in users.items()
    ]

# Iniciar o servidor com uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)