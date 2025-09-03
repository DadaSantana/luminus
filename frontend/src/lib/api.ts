import { db } from './firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, increment, deleteDoc } from 'firebase/firestore';

// URL base da API - usa Firebase Functions em produção, local em desenvolvimento
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD 
    ? 'https://us-central1-luminus-aca84.cloudfunctions.net' 
    : 'http://127.0.0.1:8000');

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface MessageRequest {
  message: string;
}

interface MessageResponse {
  response: string;
  session_id: string;
  timestamp: string;
}

interface AgentInfo {
  name: string;
  description: string;
  tools: string[];
}

// Interfaces para o endpoint /run_sse
interface MessagePart {
  text: string;
}

interface NewMessage {
  role: string;
  parts: MessagePart[];
}

interface RunSSERequest {
  appName: string;
  userId: string;
  sessionId: string;
  newMessage: NewMessage;
  streaming: boolean;
  stateDelta?: Record<string, any>;
  locale?: string;
}

interface ContentPart {
  text: string;
}

interface Content {
  parts: ContentPart[];
  role: string;
}

interface TokensDetails {
  modality: string;
  tokenCount: number;
}

interface UsageMetadata {
  candidatesTokenCount: number;
  candidatesTokensDetails: TokensDetails[];
  promptTokenCount: number;
  promptTokensDetails: TokensDetails[];
  totalTokenCount: number;
}

interface Actions {
  stateDelta: Record<string, any>;
  artifactDelta: Record<string, any>;
  requestedAuthConfigs: Record<string, any>;
}

interface RunSSEResponse {
  content: Content;
  usageMetadata: UsageMetadata;
  invocationId: string;
  author: string;
  actions: Actions;
  id: string;
  timestamp: number;
}

// Interfaces para Firestore
interface FirestoreMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: any; // Firestore Timestamp
  userId: string;
}

interface FirestoreSession {
  id: string;
  title: string;
  userId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

class ApiService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.apiKey = (import.meta as any).env?.VITE_API_KEY;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendMessage(sessionId: string, message: string, userId: string = 'default-user'): Promise<ApiResponse<RunSSEResponse>> {
    const request: RunSSERequest = {
      appName: 'Practia',
      userId: userId,
      sessionId: sessionId,
      newMessage: {
        role: 'user',
        parts: [{ text: message }]
      },
      streaming: true,
      stateDelta: {}
    };

    // Seleciona o endpoint conforme a baseUrl: Firebase Functions x Backend próprio
    const endpoint = this.baseUrl.includes('cloudfunctions.net') ? '/practia_agent' : '/run_sse';
    
    const res = await this.makeRequest<RunSSEResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    // Se o backend principal (server.py) estiver rodando em outra porta/path base, tentar fallback
    if (res.error && this.baseUrl.endsWith('cloudfunctions.net')) {
      // local dev fallback
      try {
        const local = new ApiService('http://127.0.0.1:8000');
        return await local.makeRequest<RunSSEResponse>('/run_sse', {
          method: 'POST',
          body: JSON.stringify(request),
        });
      } catch (e) {
        // ignore
      }
    }
    return res;
  }

  async sendMessageStream(
    sessionId: string,
    message: string,
    userId: string = 'default-user',
    onDelta?: (delta: string) => void,
    onStatus?: (info: { agent: string; state: 'thinking' | 'executing' | 'done'; timestamp?: number }) => void,
    onAgentDelta?: (info: { agent: string; delta: string; invocationId: string; timestamp: number }) => void,
    signal?: AbortSignal,
    locale?: string
  ): Promise<{ finalText: string }> {
     const request: RunSSERequest = {
       appName: 'Practia',
       userId: userId,
       sessionId: sessionId,
       newMessage: {
         role: 'user',
         parts: [{ text: message }]
       },
       streaming: true,
       stateDelta: {},
       locale
     };

    // Seleciona o endpoint conforme a baseUrl: Firebase Functions x Backend próprio
    const endpoint = this.baseUrl.includes('cloudfunctions.net') ? '/practia_agent' : '/run_sse';

    console.log('[api] sendMessageStream → POST', `${this.baseUrl}${endpoint}`);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(text || `HTTP ${response.status}`);
    }

    // Se não for streaming, devolver JSON normal
    const contentType = response.headers.get('Content-Type') || '';
    console.log('[api] Content-Type:', contentType);
    if (!contentType.includes('text/event-stream')) {
      const data = await response.json();
      const finalText = data?.content?.parts?.[0]?.text || '';
      if (finalText && onDelta) onDelta(finalText);
      console.log('[api] Non-stream JSON finalText len=', finalText.length);
      return { finalText };
    }

    const reader = response.body?.getReader();
    if (!reader) return { finalText: '' };

    const decoder = new TextDecoder();
    let buffer = '';
    let finalText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const raw of events) {
        const line = raw.trim();
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.replace(/^data: /, '');
        try {
          const payload = JSON.parse(jsonStr);
          if (payload?.type === 'status' && payload.agent && payload.state && onStatus) {
            onStatus({ agent: payload.agent, state: payload.state, timestamp: payload.timestamp });
          } else if (payload?.delta) {
            finalText += payload.delta;
            onDelta?.(payload.delta);
            if (payload.agent && payload.invocationId && onAgentDelta) {
              onAgentDelta({ agent: payload.agent, delta: payload.delta, invocationId: payload.invocationId, timestamp: payload.timestamp || Date.now() });
            }
            console.log('[api] delta len=', payload.delta.length, 'preview=', String(payload.delta).slice(0, 40));
            // Ceder ao event loop para permitir repaint imediato
            await new Promise<void>((resolve) => {
              if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => resolve());
              } else {
                setTimeout(() => resolve(), 0);
              }
            });
          }
          if (payload?.done || payload?.type === 'done') {
            // finalizar
            console.log('[api] done signal received');
            return { finalText: finalText.trim() };
          }
        } catch {
          // ignorar eventos malformados
        }
      }
      // Ceder entre blocos também
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => resolve());
        } else {
          setTimeout(() => resolve(), 0);
        }
      });
    }

    return { finalText: finalText.trim() };
  }

  async getAgentInfo(): Promise<ApiResponse<AgentInfo>> {
    return this.makeRequest<AgentInfo>('/agent-info');
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; agent: string }>> {
    // Seleciona o endpoint conforme a baseUrl: Firebase Functions x Backend próprio
    const endpoint = this.baseUrl.includes('cloudfunctions.net') ? '/health_check' : '/health';
    return this.makeRequest(endpoint);
  }

  // Admin Users
  async listAdminUsers(): Promise<ApiResponse<Array<{ username: string; role: string }>>> {
    return this.makeRequest('/admin/users');
  }

  // Novos métodos para sessões do backend (Render ou local)
  async listSessions(userId: string, appName: string = 'Practia'): Promise<ApiResponse<any>> {
    const search = new URLSearchParams({ userId, appName }).toString();
    return this.makeRequest(`/sessions?${search}`);
  }

  async createSession(userId: string, appName: string = 'Practia'): Promise<ApiResponse<any>> {
    return this.makeRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({ appName, userId })
    });
  }

  // Funções do Firestore
  async getSessionMessages(sessionId: string): Promise<FirestoreMessage[]> {
    try {
      // Verificar se a sessão existe primeiro
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        console.log('Sessão não existe no Firestore:', sessionId);
        return [];
      }
      
      const messagesRef = collection(db, 'sessions', sessionId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        let timestamp = new Date();
        
        // Lidar com diferentes tipos de timestamp
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === 'function') {
            // Firestore Timestamp
            timestamp = data.timestamp.toDate();
          } else if (typeof data.timestamp === 'string') {
            // String ISO
            timestamp = new Date(data.timestamp);
          } else if (data.timestamp instanceof Date) {
            // Já é um Date
            timestamp = data.timestamp;
          }
        }
        
        return {
          id: doc.id,
          content: data.content || '',
          role: data.role || 'user',
          userId: data.userId || 'anonymous',
          timestamp
        };
      }) as FirestoreMessage[];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  }

  async updateSessionTitle(sessionId: string, title: string, userId: string = 'anonymous'): Promise<boolean> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      
      // Verificar se a sessão existe, se não, criar
      const sessionSnap = await getDoc(sessionRef);
      if (!sessionSnap.exists()) {
        await this.createFirestoreSession(sessionId, title, userId);
      } else {
        await updateDoc(sessionRef, {
          title: title,
          updatedAt: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar título da sessão:', error);
      return false;
    }
  }

  async getSession(sessionId: string): Promise<FirestoreSession | null> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        
        // Função helper para converter timestamps
        const convertTimestamp = (timestamp: any): Date => {
          if (!timestamp) return new Date();
          
          if (typeof timestamp.toDate === 'function') {
            // Firestore Timestamp
            return timestamp.toDate();
          } else if (typeof timestamp === 'string') {
            // String ISO
            return new Date(timestamp);
          } else if (timestamp instanceof Date) {
            // Já é um Date
            return timestamp;
          }
          return new Date();
        };
        
        return {
          id: sessionSnap.id,
          title: data.title || 'Nova Conversa',
          userId: data.userId || 'anonymous',
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt || data.lastActivity)
        } as FirestoreSession;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      return null;
    }
  }

  async saveMessage(sessionId: string, message: Omit<FirestoreMessage, 'id'>): Promise<string | null> {
    try {
      // Verificar se a sessão existe, se não, criar
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        await this.createFirestoreSession(sessionId, 'Nova Conversa', message.userId);
      }
      
      // Salvar mensagem
      const messagesRef = collection(db, 'sessions', sessionId, 'messages');
      const docRef = await addDoc(messagesRef, {
        content: message.content,
        role: message.role,
        userId: message.userId,
        timestamp: serverTimestamp()
      });

      // Atualizar resumo da sessão
      try {
        const contentText = message.content || '';
        const snippet = contentText.length > 120 ? contentText.slice(0, 120) + '...' : contentText;
        
        // Atualizar lastMessage, updatedAt e messageCount
        await updateDoc(sessionRef, {
          lastMessage: snippet,
          updatedAt: serverTimestamp(),
          messageCount: increment(1),
          userId: message.userId || 'anonymous'
        });

        // Definir título na primeira mensagem do usuário
        const latestSnap = sessionSnap.exists() ? sessionSnap : await getDoc(sessionRef);
        const currentTitle = latestSnap.exists() ? (latestSnap.data().title as string | undefined) : undefined;
        if ((!currentTitle || currentTitle === 'Nova Conversa') && message.role === 'user' && contentText.trim().length > 0) {
          const titleSnippet = contentText.trim().length > 60 ? contentText.trim().slice(0, 60) + '...' : contentText.trim();
          await updateDoc(sessionRef, {
            title: titleSnippet,
            updatedAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn('Não foi possível atualizar resumo da sessão:', e);
      }

      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      return null;
    }
  }

  async createFirestoreSession(sessionId: string, title: string, userId: string = 'anonymous'): Promise<boolean> {
    try {
      console.log('🆕 [createFirestoreSession] Criando sessão:', {
        sessionId,
        title,
        userId
      });
      
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionData = {
        id: sessionId,
        title: title,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
        messageCount: 0
      };
      
      console.log('💾 [createFirestoreSession] Dados da sessão:', sessionData);
      
      await setDoc(sessionRef, sessionData);
      
      console.log('✅ [createFirestoreSession] Sessão criada com sucesso no Firestore');
      return true;
    } catch (error) {
      console.error('❌ [createFirestoreSession] Erro ao criar sessão no Firestore:', error);
      return false;
    }
  }

  async listFirestoreSessions(userId: string): Promise<FirestoreSession[]> {
    try {
      console.log('🔍 [listFirestoreSessions] Iniciando busca por sessões para userId:', userId);
      
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, orderBy('updatedAt', 'desc'));
      
      console.log('📊 [listFirestoreSessions] Executando query no Firestore...');
      const querySnapshot = await getDocs(q);
      
      console.log('📋 [listFirestoreSessions] Documentos encontrados:', querySnapshot.docs.length);
      
      const sessions = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('📄 [listFirestoreSessions] Processando documento:', {
            id: doc.id,
            title: data.title,
            userId: data.userId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
          
          // Função helper para converter timestamps
          const convertTimestamp = (timestamp: any): Date => {
            if (!timestamp) return new Date();
            
            if (typeof timestamp.toDate === 'function') {
              // Firestore Timestamp
              return timestamp.toDate();
            } else if (typeof timestamp === 'string') {
              // String ISO
              return new Date(timestamp);
            } else if (timestamp instanceof Date) {
              // Já é um Date
              return timestamp;
            }
            return new Date();
          };
          
          return {
            id: doc.id,
            title: data.title || 'Nova Conversa',
            userId: data.userId || 'anonymous',
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt || data.lastActivity),
            deleted: data.deleted || false
          } as FirestoreSession & { deleted: boolean };
        })
        .filter(session => {
          const userMatches = session.userId === userId || session.userId === 'anonymous';
          const notDeleted = !session.deleted;
          const matches = userMatches && notDeleted;
          console.log('🔍 [listFirestoreSessions] Filtro userId e deleted:', {
            sessionId: session.id,
            sessionUserId: session.userId,
            targetUserId: userId,
            deleted: session.deleted,
            matches
          });
          return matches;
        });
      
      console.log('✅ [listFirestoreSessions] Sessões filtradas:', sessions.length);
      console.log('📝 [listFirestoreSessions] Sessões retornadas:', sessions.map(s => ({ id: s.id, title: s.title })));
      
      return sessions;
    } catch (error) {
      console.error('❌ [listFirestoreSessions] Erro ao listar sessões do Firestore:', error);
      return [];
    }
  }

  // Métodos para dados dos agentes
  async saveAgentEvent(sessionId: string, agentEvent: {
    agent: string;
    delta: string;
    invocationId: string;
    timestamp: number;
  }): Promise<boolean> {
    try {
      const agentEventsRef = collection(db, 'sessions', sessionId, 'agentEvents');
      await addDoc(agentEventsRef, {
        ...agentEvent,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Erro ao salvar evento do agente:', error);
      return false;
    }
  }

  async saveAgentStatus(sessionId: string, agentStatus: {
    agent: string;
    state: 'thinking' | 'executing' | 'done';
    timestamp: number;
  }): Promise<boolean> {
    try {
      const agentStatusRef = doc(db, 'sessions', sessionId, 'agentStatus', agentStatus.agent);
      const statusData: any = {
        agent: agentStatus.agent,
        updatedAt: serverTimestamp()
      };
      
      if (agentStatus.state === 'thinking') {
        statusData.startedAt = agentStatus.timestamp;
      } else if (agentStatus.state === 'executing') {
        statusData.executedAt = agentStatus.timestamp;
      } else if (agentStatus.state === 'done') {
        statusData.finishedAt = agentStatus.timestamp;
      }
      
      await setDoc(agentStatusRef, statusData, { merge: true });
      return true;
    } catch (error) {
      console.error('Erro ao salvar status do agente:', error);
      return false;
    }
  }

  async getAgentEvents(sessionId: string): Promise<Array<{
    agent: string;
    delta: string;
    invocationId: string;
    timestamp: number;
  }>> {
    try {
      const agentEventsRef = collection(db, 'sessions', sessionId, 'agentEvents');
      const q = query(agentEventsRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          agent: data.agent,
          delta: data.delta,
          invocationId: data.invocationId,
          timestamp: data.timestamp
        };
      });
    } catch (error) {
      console.error('Erro ao buscar eventos dos agentes:', error);
      return [];
    }
  }

  async getAgentStatuses(sessionId: string): Promise<Record<string, {
    startedAt?: number;
    executedAt?: number;
    finishedAt?: number;
  }>> {
    try {
      const agentStatusRef = collection(db, 'sessions', sessionId, 'agentStatus');
      const querySnapshot = await getDocs(agentStatusRef);
      
      const statuses: Record<string, any> = {};
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        statuses[data.agent] = {
          startedAt: data.startedAt,
          executedAt: data.executedAt,
          finishedAt: data.finishedAt
        };
      });
      
      return statuses;
    } catch (error) {
      console.error('Erro ao buscar status dos agentes:', error);
      return {};
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await deleteDoc(sessionRef);
      console.log('[api] deleteSession → Firestore hard delete OK:', sessionId);
      return true;
    } catch (error) {
      console.error('[api] deleteSession → Firestore hard delete ERROR:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export type { MessageResponse, AgentInfo, RunSSEResponse, RunSSERequest, FirestoreMessage, FirestoreSession };