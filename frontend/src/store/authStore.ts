import { create } from 'zustand';
import { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  name?: string;
  userType?: string;
  createdAt?: any;
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUserData: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (loading) => set({ loading }),
  fetchUserData: async (uid: string) => {
    console.log('📊 [AuthStore] fetchUserData iniciado para uid:', uid);
    try {
      // Buscar usuário pelo campo authUid
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('authUid', '==', uid));
      console.log('🔍 [AuthStore] Executando query no Firestore...');
      const querySnapshot = await getDocs(q);
      
      console.log('📋 [AuthStore] Query executada, documentos encontrados:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { uid, ...userDoc.data() } as UserData;
        console.log('✅ [AuthStore] Dados do usuário encontrados:', userData);
        set({ userData });
      } else {
        console.log('⚠️ [AuthStore] Usuário não encontrado na coleção, criando dados básicos');
        // Se o usuário não existe na coleção, criar dados básicos
        const basicUserData: UserData = {
          uid,
          email: get().user?.email || '',
          userType: 'user' // padrão para usuários normais
        };
        console.log('📝 [AuthStore] Dados básicos criados:', basicUserData);
        set({ userData: basicUserData });
      }
    } catch (error) {
      console.error('❌ [AuthStore] Erro ao buscar dados do usuário:', error);
      // Fallback para dados básicos
      const basicUserData: UserData = {
        uid,
        email: get().user?.email || '',
        userType: 'user'
      };
      console.log('🔄 [AuthStore] Fallback para dados básicos:', basicUserData);
      set({ userData: basicUserData });
    }
  }
}));

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
  console.log('🔐 [AuthStore] onAuthStateChanged disparado:', {
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    } : null
  });
  
  const { setUser, setLoading, fetchUserData } = useAuthStore.getState();
  
  setUser(user);
  
  if (user) {
    console.log('👤 [AuthStore] Usuário autenticado, buscando dados no Firestore...');
    // Buscar dados do usuário no Firestore
    await fetchUserData(user.uid);

    // Checar custom claims para reforçar userType (ex.: claim 'admin' ou 'userType')
    try {
      const tokenResult = await user.getIdTokenResult();
      const claims: Record<string, any> = tokenResult?.claims || {};
      const claimedType = typeof claims.userType === 'string'
        ? claims.userType
        : (claims.admin ? 'admin' : undefined);

      if (claimedType) {
        console.log('🏷️ [AuthStore] Claims encontradas:', { claimedType });
        const current = useAuthStore.getState().userData;
        useAuthStore.getState().setUserData({
          ...(current || { uid: user.uid, email: user.email || '' }),
          userType: String(claimedType).toLowerCase(),
        });
      }
    } catch (e) {
      console.log('⚠️ [AuthStore] Erro ao buscar claims:', e);
      // Ignorar falhas de claims; já haverá fallback para 'user'
    }
  } else {
    console.log('❌ [AuthStore] Usuário não autenticado, limpando dados');
    // Limpar dados do usuário
    useAuthStore.getState().setUserData(null);
  }
  
  console.log('✅ [AuthStore] Processo de autenticação finalizado, setLoading(false)');
  setLoading(false);
});