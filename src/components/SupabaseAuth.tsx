import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, LogOut, User } from 'lucide-react';

export function SupabaseAuth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) onLogin();
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (session) {
    return (
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-500">
            <User size={20} />
          </div>
          <div>
            <div className="text-sm font-medium text-white">Conectado como</div>
            <div className="text-xs text-zinc-400">{session.user.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
          title="Sair"
        >
          <LogOut size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <LogIn size={20} className="text-brand-500" />
        {mode === 'login' ? 'Entrar com Supabase' : 'Criar Conta'}
      </h3>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500"
            required
          />
        </div>

        {error && <div className="text-red-400 text-xs">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 text-zinc-950 py-2 rounded-lg font-bold text-sm hover:bg-brand-400 transition-colors disabled:opacity-50"
        >
          {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>

        <div className="text-center text-xs text-zinc-500">
          {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-brand-500 hover:underline"
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entre'}
          </button>
        </div>
      </form>
    </div>
  );
}
