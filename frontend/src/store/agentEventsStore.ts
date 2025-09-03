import { create } from 'zustand';
import { apiService } from '@/lib/api';

type AgentEvent = {
  agent: string;
  delta: string;
  invocationId: string;
  timestamp: number;
};

type AgentEventsState = {
  eventsBySession: Record<string, Record<string, AgentEvent[]>>; // sessionId -> agent -> events
  appendEvent: (sessionId: string, agent: string, event: AgentEvent) => void;
  statusBySession: Record<string, Record<string, { startedAt?: number; executedAt?: number; finishedAt?: number }>>;
  updateStatus: (sessionId: string, agent: string, state: 'thinking' | 'executing' | 'done', ts: number) => void;
  getAgentTranscript: (sessionId: string, agent: string) => { text: string; meta: AgentEvent[] };
  getAgentStatus: (sessionId: string, agent: string) => { startedAt?: number; executedAt?: number; finishedAt?: number; durationMs?: number; chunks: number };
  loadSessionData: (sessionId: string) => Promise<void>;
  clearSessionData: (sessionId: string) => void;
};

export const useAgentEventsStore = create<AgentEventsState>((set, get) => ({
  eventsBySession: {},
  statusBySession: {},
  appendEvent: (sessionId, agent, event) => {
    set((state) => {
      const forSession = state.eventsBySession[sessionId] || {};
      const list = forSession[agent] || [];
      const updated = { ...state.eventsBySession, [sessionId]: { ...forSession, [agent]: [...list, event] } };
      return { eventsBySession: updated };
    });
    // Salvar no Firestore
    apiService.saveAgentEvent(sessionId, event);
  },
  updateStatus: (sessionId, agent, state, ts) => {
    set((stateObj) => {
      const forSession = stateObj.statusBySession[sessionId] || {};
      const current = forSession[agent] || {};
      const next = { ...current } as { startedAt?: number; executedAt?: number; finishedAt?: number };
      if (state === 'thinking') next.startedAt = ts;
      if (state === 'executing') next.executedAt = ts;
      if (state === 'done') next.finishedAt = ts;
      return { statusBySession: { ...stateObj.statusBySession, [sessionId]: { ...forSession, [agent]: next } } };
    });
    // Salvar no Firestore
    apiService.saveAgentStatus(sessionId, { agent, state, timestamp: ts });
  },
  getAgentTranscript: (sessionId, agent) => {
    const forSession = get().eventsBySession[sessionId] || {};
    const meta = forSession[agent] || [];
    const text = meta.map((e) => e.delta).join('');
    return { text, meta };
  },
  getAgentStatus: (sessionId, agent) => {
    const sForSession = get().statusBySession[sessionId] || {};
    const st = sForSession[agent] || {};
    const events = get().eventsBySession[sessionId]?.[agent] || [];
    const durationMs = st.startedAt && st.finishedAt ? Math.max(0, (st.finishedAt - st.startedAt) * 1000) : undefined;
    return { ...st, durationMs, chunks: events.length };
  },
  loadSessionData: async (sessionId) => {
    try {
      const [events, statuses] = await Promise.all([
        apiService.getAgentEvents(sessionId),
        apiService.getAgentStatuses(sessionId)
      ]);
      
      set((state) => {
        // Organizar eventos por agente
        const eventsByAgent: Record<string, AgentEvent[]> = {};
        events.forEach(event => {
          if (!eventsByAgent[event.agent]) {
            eventsByAgent[event.agent] = [];
          }
          eventsByAgent[event.agent].push(event);
        });
        
        return {
          eventsBySession: {
            ...state.eventsBySession,
            [sessionId]: eventsByAgent
          },
          statusBySession: {
            ...state.statusBySession,
            [sessionId]: statuses
          }
        };
      });
    } catch (error) {
      console.error('Erro ao carregar dados da sessão:', error);
    }
  },
  clearSessionData: (sessionId) => {
    set((state) => {
      const newEventsBySession = { ...state.eventsBySession };
      const newStatusBySession = { ...state.statusBySession };
      delete newEventsBySession[sessionId];
      delete newStatusBySession[sessionId];
      return {
        eventsBySession: newEventsBySession,
        statusBySession: newStatusBySession
      };
    });
  },
}));


