import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { 
    loginWithEmailPassword, 
    loginWithGoogle, 
    loading, 
    error, 
    clearError 
  } = useAuthStore();
  
  // Sincronizar erro do store com o estado local
  useEffect(() => {
    if (error) {
      setLocalError(error);
      clearError();
    }
  }, [error, clearError]);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email || !password) {
      setLocalError('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      await loginWithEmailPassword(email, password);
    } catch (error: any) {
      // Erros já são tratados na store
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      await loginWithGoogle();
    } catch (error: any) {
      // Erros já são tratados na store
    }
  };
  
  return (
    <div className="w-full max-w-md p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-lg sm:text-xl font-bold">
          Sonatto
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Gerenciamento de Tarefas
        </p>
      </div>
      
      {localError && (
        <div className="p-3 text-sm text-white bg-red-500 rounded">
          {localError}
        </div>
      )}
      
      <form 
        className="space-y-4"
        onSubmit={handleEmailLogin}
      >
        <div>
          <label 
            className="block mb-1 text-sm font-medium text-gray-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            disabled={loading}
            id="email"
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            type="email"
            value={email}
          />
        </div>
        
        <div>
          <label 
            className="block mb-1 text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Senha
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
            disabled={loading}
            id="password"
            onChange={e => setPassword(e.target.value)}
            placeholder="********"
            type="password"
            value={password}
          />
        </div>
        
        <Button
          className="w-full h-10 !bg-amber-700 hover:bg-amber-700/70  text-white"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-gray-500 bg-white">
            ou continue com
          </span>
        </div>
      </div>
      
      <Button
        className="w-full h-10 text-slate-100 bg-zinc-900 hover:bg-zinc-900/95 hover:text-slate-100"
        disabled={loading}
        onClick={handleGoogleLogin}
        type="button"
        variant="outline"
      >
        <svg
          className="w-5 h-5 mr-2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="#DC6943"
          />
        </svg>
        Entrar com Google
      </Button>
    </div>
  );
}; 