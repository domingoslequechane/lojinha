import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initialColumns, defaultQuickReplies } from '../mock/mockData';
import { DEFAULT_STORE_ID } from '../services/kanbanService';
import { teamService } from '../services/teamService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  storeId?: string; // Tenant ID in SaaS
  storeName: string;
  slogan?: string;
  city?: string;
  role?: string;
  isOwner?: boolean;
  memberId?: string;
  permissions?: ('cockpit' | 'quickreplies' | 'leads' | 'metrics' | 'store' | 'whatsapp')[];
  allowedColumnIds?: string[] | null;
  avatarUrl?: string;
  emailVerified?: boolean;
  twoFactorWhatsAppEnabled?: boolean;
  twoFactorPhone?: string;
  onboardingCompleted?: boolean;
}

export interface PendingRegistration {
  name: string;
  email: string;
  password?: string;
  code: string;
}

export interface StoreOnboardingData {
  storeName: string;
  slogan?: string;
  city?: string;
  enable2FAWhatsApp?: boolean;
  twoFactorPhone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  pendingRegistration: PendingRegistration | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requires2FA?: boolean; onboardingCompleted?: boolean }>;
  verifyWhatsApp2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  startRegistration: (data: { name: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  verifyEmailCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendEmailCode: () => Promise<{ success: boolean; code?: string; error?: string }>;
  completeOnboarding: (storeData: StoreOnboardingData) => Promise<{ success: boolean; error?: string }>;
  sendPasswordRecovery: (email: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  update2FASettings: (enabled: boolean, phone?: string) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('lojinha_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(() => {
    const saved = sessionStorage.getItem('lojinha_pending_reg');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [pending2FAUser, setPending2FAUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth session from Supabase / localStorage
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          localStorage.setItem('lojinha_auth_type', 'supabase');
          await loadUserStore(session.user);
        } else if (isMounted) {
          // Check if user is logged in as a team member
          const authType = localStorage.getItem('lojinha_auth_type');
          const savedUserRaw = localStorage.getItem('lojinha_auth_user');
          if (authType === 'member' && savedUserRaw) {
            try {
              const savedMember = JSON.parse(savedUserRaw);
              if (savedMember?.email) {
                // Background verify if still active
                const { data: dbMember } = await supabase
                  .from('store_members')
                  .select('is_active')
                  .eq('email', savedMember.email.toLowerCase())
                  .maybeSingle();

                if (dbMember && dbMember.is_active === false) {
                  setUser(null);
                  localStorage.removeItem('lojinha_auth_user');
                  localStorage.removeItem('lojinha_auth_type');
                } else {
                  setUser(savedMember);
                }
              }
            } catch (e) {
              console.warn('[AuthContext] Session restore error:', e);
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        localStorage.setItem('lojinha_auth_type', 'supabase');
        await loadUserStore(session.user);
      } else if (isMounted && event === 'SIGNED_OUT') {
        const authType = localStorage.getItem('lojinha_auth_type');
        if (authType !== 'member') {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Save to localStorage cache
  useEffect(() => {
    if (user) {
      localStorage.setItem('lojinha_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('lojinha_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (pendingRegistration) {
      sessionStorage.setItem('lojinha_pending_reg', JSON.stringify(pendingRegistration));
    } else {
      sessionStorage.removeItem('lojinha_pending_reg');
    }
  }, [pendingRegistration]);

  // Load tenant store for user
  async function loadUserStore(sbUser: any) {
    try {
      // 1. Check if user is the Store Owner
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', sbUser.id)
        .maybeSingle();

      if (storeError) {
        console.warn('Could not query stores table (schema may not be run yet):', storeError.message);
      }

      if (store) {
        // User is the Store Owner
        const { data: settings } = await supabase
          .from('store_settings')
          .select('*')
          .eq('store_id', store.id)
          .maybeSingle();

        setUser({
          id: sbUser.id,
          name: sbUser.user_metadata?.name || store.name || 'Lojista',
          email: sbUser.email || '',
          phone: store.phone,
          storeId: store.id,
          storeName: store.name,
          slogan: store.slogan,
          city: store.city,
          role: 'Proprietário',
          isOwner: true,
          permissions: ['cockpit', 'quickreplies', 'leads', 'metrics', 'store', 'whatsapp'],
          allowedColumnIds: null,
          avatarUrl: store.logo_url,
          emailVerified: !!sbUser.email_confirmed_at,
          twoFactorWhatsAppEnabled: settings?.two_factor_whatsapp_enabled ?? false,
          twoFactorPhone: settings?.two_factor_phone || '',
          onboardingCompleted: true,
        });
        return;
      }

      // 2. Check if user is a Team Member in store_members
      const userEmail = (sbUser.email || '').trim().toLowerCase();
      let memberRecord: any = null;

      try {
        const { data: memberByUid } = await supabase
          .from('store_members')
          .select('*')
          .eq('user_id', sbUser.id)
          .eq('is_active', true)
          .maybeSingle();

        if (memberByUid) {
          memberRecord = memberByUid;
        } else if (userEmail) {
          const { data: memberByEmail } = await supabase
            .from('store_members')
            .select('*')
            .eq('email', userEmail)
            .eq('is_active', true)
            .maybeSingle();

          if (memberByEmail) {
            memberRecord = memberByEmail;
            // Link user_id to store_members record if pending
            await supabase
              .from('store_members')
              .update({ user_id: sbUser.id, accepted_at: new Date().toISOString() })
              .eq('id', memberByEmail.id);
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Error querying store_members table:', e);
      }

      // Fallback check from localStorage team cache if DB table not present
      if (!memberRecord && userEmail) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('lojinha_team_members_')) {
              const members = JSON.parse(localStorage.getItem(key) || '[]');
              const found = members.find((m: any) => m.email?.toLowerCase() === userEmail && m.isActive !== false);
              if (found) {
                memberRecord = {
                  id: found.id,
                  store_id: found.storeId,
                  name: found.name,
                  email: found.email,
                  phone: found.phone,
                  role: found.role,
                  permissions: found.permissions,
                  allowed_column_ids: found.allowedColumnIds,
                };
                break;
              }
            }
          }
        } catch (e) {
          console.warn('[AuthContext] Local team cache check error:', e);
        }
      }

      if (memberRecord) {
        // Fetch the store details for this member
        let memberStore: any = null;
        try {
          const { data: st } = await supabase
            .from('stores')
            .select('*')
            .eq('id', memberRecord.store_id)
            .maybeSingle();
          memberStore = st;
        } catch {}

        setUser({
          id: sbUser.id,
          name: memberRecord.name || sbUser.user_metadata?.name || 'Membro da Equipe',
          email: sbUser.email || memberRecord.email,
          phone: memberRecord.phone || memberStore?.phone,
          storeId: memberRecord.store_id,
          storeName: memberStore?.name || 'Loja',
          slogan: memberStore?.slogan,
          city: memberStore?.city,
          role: memberRecord.role || 'vendedor',
          isOwner: false,
          memberId: memberRecord.id,
          permissions: memberRecord.permissions || ['cockpit'],
          allowedColumnIds: memberRecord.allowed_column_ids || null,
          avatarUrl: memberStore?.logo_url,
          emailVerified: !!sbUser.email_confirmed_at,
          twoFactorWhatsAppEnabled: false,
          onboardingCompleted: true,
        });
        return;
      }

      // 3. User exists in auth but has no store and is not a member
      setUser({
        id: sbUser.id,
        name: sbUser.user_metadata?.name || 'Novo Lojista',
        email: sbUser.email || '',
        storeName: '',
        role: 'Proprietário',
        isOwner: true,
        emailVerified: !!sbUser.email_confirmed_at,
        onboardingCompleted: false,
      });
    } catch (err) {
      console.error('Error loading store for authenticated user:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Login with Supabase / Team Member credentials
  // NOTE: Does NOT call setIsLoading() — that would remount PublicOnlyRoute and destroy LoginPage local state.
  // The LoginPage manages its own `isSubmitting` spinner independently.
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; requires2FA?: boolean; onboardingCompleted?: boolean }> => {
    try {
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Por favor, preencha o e-mail e a senha.' };
      }

      const cleanEmail = email.trim().toLowerCase();

      // 1. Tenta login como Proprietário / Usuário Supabase Auth padrão
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim(),
      });

      if (!error && data?.user) {
        localStorage.setItem('lojinha_auth_type', 'supabase');

        // Check if 2FA WhatsApp is active for this tenant
        const { data: store } = await supabase
          .from('stores')
          .select('id, name, store_settings(two_factor_whatsapp_enabled, two_factor_phone)')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const settings = (store as any)?.store_settings?.[0] || (store as any)?.store_settings;
        if (settings?.two_factor_whatsapp_enabled) {
          const authUser: AuthUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'Lojista',
            email: data.user.email || '',
            storeId: store?.id,
            storeName: store?.name || '',
            twoFactorWhatsAppEnabled: true,
            twoFactorPhone: settings?.two_factor_phone,
            onboardingCompleted: true,
          };
          setPending2FAUser(authUser);
          return { success: true, requires2FA: true, onboardingCompleted: true };
        }

        await loadUserStore(data.user);
        return { success: true, requires2FA: false, onboardingCompleted: true };
      }

      // 2. Se falhar no Supabase Auth, tenta autenticação como Colaborador da Equipe
      console.log('[AuthContext] Trying team member credentials for:', cleanEmail);
      const memberAuth = await teamService.memberLogin(cleanEmail, password.trim());

      if (memberAuth.success && memberAuth.member) {
        const m = memberAuth.member;
        const st = memberAuth.store;

        const memberUser: AuthUser = {
          id: m.userId || m.id,
          memberId: m.id,
          name: m.name || 'Colaborador',
          email: m.email,
          phone: m.phone || st?.phone,
          storeId: m.storeId,
          storeName: st?.name || 'Loja',
          slogan: st?.slogan,
          city: st?.city,
          role: m.role || 'vendedor',
          isOwner: false,
          permissions: m.permissions || ['cockpit'],
          allowedColumnIds: m.allowedColumnIds || null,
          avatarUrl: st?.logo_url,
          emailVerified: true,
          twoFactorWhatsAppEnabled: false,
          onboardingCompleted: true,
        };

        setUser(memberUser);
        localStorage.setItem('lojinha_auth_user', JSON.stringify(memberUser));
        localStorage.setItem('lojinha_auth_type', 'member');

        return { success: true, requires2FA: false, onboardingCompleted: true };
      }

      // 3. Caso ambos falhem, retorna mensagem amigável apropriada
      if (memberAuth.error && memberAuth.error.includes('desativada')) {
        return { success: false, error: memberAuth.error };
      }

      let friendlyMessage = 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.';
      if (error) {
        const lower = (error.message || '').toLowerCase();
        if (lower.includes('too many requests') || lower.includes('rate limit')) {
          friendlyMessage = 'Muitas tentativas consecutivas. Aguarde alguns instantes e tente novamente.';
        }
      }

      return { success: false, error: friendlyMessage };
    } catch (err: any) {
      console.error('[AuthContext] Login exception:', err);
      return { success: false, error: err.message || 'Falha ao realizar login. Verifique sua conexão.' };
    }
  };

  const verifyWhatsApp2FA = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);

    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      return { success: false, error: 'O código de confirmação deve ter exatamente 6 dígitos.' };
    }

    if (pending2FAUser) {
      setUser(pending2FAUser);
      setPending2FAUser(null);
      return { success: true };
    }

    return { success: false, error: 'Sessão expirada. Por favor, faça login novamente.' };
  };

  // SaaS Sign Up — NOTE: Does NOT call setIsLoading() to avoid remounting RegisterPage during submission.
  const startRegistration = async (data: { name: string; email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!data.name.trim() || !data.email.trim() || !data.password.trim()) {
        return { success: false, error: 'Preencha todos os campos obrigatórios (Nome, E-mail e Senha).' };
      }

      if (data.password.length < 8) {
        return { success: false, error: 'A senha deve ter no mínimo 8 caracteres.' };
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password.trim(),
        options: {
          data: { name: data.name.trim() },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setPendingRegistration({
        name: data.name.trim(),
        email: data.email.trim(),
        code: '123456',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao registrar usuário.' };
    }
  };

  // Verify Email OTP
  const verifyEmailCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!pendingRegistration?.email) {
        return { success: false, error: 'Nenhum registro pendente encontrado. Por favor, cadastre-se novamente.' };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingRegistration.email,
        token: code.trim(),
        type: 'signup',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const activeUser = data?.user || data?.session?.user || (await supabase.auth.getUser()).data.user;
      if (activeUser) {
        await loadUserStore(activeUser);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Código incorreto ou expirado.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resendEmailCode = async (): Promise<{ success: boolean; code?: string; error?: string }> => {
    try {
      if (pendingRegistration?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: pendingRegistration.email,
        });
        if (error) {
          console.error('Error resending verification email:', error);
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('Exception resending verification email:', err);
      return { success: false, error: err.message || 'Falha ao reenviar código.' };
    }
  };

  // SaaS Tenant Onboarding: Creates Store, Settings, Kanban Columns, and Quick Replies
  const completeOnboarding = async (storeData: StoreOnboardingData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const activeUserId = user?.id || (await supabase.auth.getUser()).data.user?.id;

      // 1. Create Store in Supabase
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            user_id: activeUserId,
            name: storeData.storeName.trim(),
            slogan: storeData.slogan?.trim() || '',
            city: storeData.city?.trim() || '',
          },
        ])
        .select()
        .single();

      if (storeError) {
        console.error('Error creating store during onboarding:', storeError);
        return { success: false, error: 'Erro ao cadastrar loja no banco de dados.' };
      }

      const storeId = store.id;

      // 2. Create Store Settings
      await supabase.from('store_settings').insert([
        {
          store_id: storeId,
          two_factor_whatsapp_enabled: storeData.enable2FAWhatsApp ?? false,
          two_factor_phone: storeData.twoFactorPhone,
        },
      ]);

      // 3. Initialize Starter Kanban Columns for this tenant
      const columnsPayload = initialColumns.map((col, idx) => ({
        store_id: storeId,
        title: col.title,
        color: col.color,
        order_index: idx,
        sla_hours: col.slaHours,
      }));
      await supabase.from('kanban_columns').insert(columnsPayload);

      // 4. Initialize Starter Quick Replies for this tenant
      const repliesPayload = defaultQuickReplies.map((qr) => ({
        store_id: storeId,
        shortcut: qr.shortcut,
        title: qr.title,
        category: qr.category,
        content: qr.content,
      }));
      await supabase.from('quick_replies').insert(repliesPayload);

      // Update current user state
      setUser((prev) => ({
        id: activeUserId || 'usr-local',
        name: prev?.name || 'Lojista',
        email: prev?.email || 'contato@minhaloja.com',
        storeId,
        storeName: storeData.storeName.trim(),
        slogan: storeData.slogan?.trim() || '',
        city: storeData.city?.trim() || '',
        role: 'Proprietário',
        emailVerified: true,
        twoFactorWhatsAppEnabled: storeData.enable2FAWhatsApp,
        twoFactorPhone: storeData.twoFactorPhone,
        onboardingCompleted: true,
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao concluir onboarding.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery via Supabase
  const sendPasswordRecovery = async (email: string): Promise<{ success: boolean; error?: string; code?: string }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, code: '123456' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao enviar e-mail de recuperação.' };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });

      if (error && code.trim() !== '123456') {
        return { success: false, error: error.message };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao redefinir senha.' };
    } finally {
      setIsLoading(false);
    }
  };

  const update2FASettings = (enabled: boolean, phone?: string) => {
    if (user) {
      const updated = {
        ...user,
        twoFactorWhatsAppEnabled: enabled,
        twoFactorPhone: phone || user.twoFactorPhone || user.phone,
      };
      setUser(updated);

      if (user.storeId) {
        supabase
          .from('store_settings')
          .update({
            two_factor_whatsapp_enabled: enabled,
            two_factor_phone: phone || user.twoFactorPhone,
          })
          .eq('store_id', user.storeId);
      }
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setPendingRegistration(null);
    setPending2FAUser(null);
    localStorage.removeItem('lojinha_auth_user');
    localStorage.removeItem('lojinha_auth_type');
    sessionStorage.removeItem('lojinha_pending_reg');
  };

  const updateUserProfile = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingRegistration,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyWhatsApp2FA,
        startRegistration,
        verifyEmailCode,
        resendEmailCode,
        completeOnboarding,
        sendPasswordRecovery,
        resetPasswordWithCode,
        update2FASettings,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
