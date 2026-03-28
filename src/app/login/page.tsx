'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const Login: React.FC = () => {
    // Action de autenticação (mock) armazenada no Context
    const { login } = useApp();
    // Navegação client-side
    const router = useRouter();

    // Campos do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Controla se a senha aparece em texto puro
    const [showPassword, setShowPassword] = useState(false);
    // Quando true, persiste o usuário no localStorage
    const [remember, setRemember] = useState(true);
    // Mensagem de erro exibida no topo do form
    const [error, setError] = useState('');
    // Estado de loading para feedback visual no botão
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao autenticar.');
            }

            // Login bem-sucedido
            login(data, remember);
            router.push('/dashboard');
        } catch (err: unknown) {
            const loginError = err as { message?: string };
            setError(loginError.message || 'Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="max-w-[400px] w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 animate-fadeIn relative overflow-hidden">

                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="mb-6">
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M30 20H80L20 80H70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M30 35H80L20 95H70" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-normal text-slate-900 dark:text-white mb-1">Zeus Enterprise Manager</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Sua infraestrutura para Software Houses</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">E-mail Corporativo</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors text-[20px]">mail</span>
                            <input
                                type="email"
                                required
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500 outline-none transition-all text-sm"
                                placeholder="ex: admin@softhouse.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Senha de Acesso</label>
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors text-[20px]">lock</span>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-400 dark:focus:border-slate-500 outline-none transition-all text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                />
                                <div className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 peer-checked:bg-slate-800 peer-checked:border-slate-800 transition-all"></div>
                                <span className="material-symbols-outlined absolute text-white text-[12px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Lembrar acesso</span>
                        </label>
                        <a href="#" className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Esqueceu a senha?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0f2a4a] hover:bg-[#0a1e36] text-white font-medium py-3.5 rounded-lg shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                        ) : (
                            <>
                                <span>Acessar Plataforma</span>
                                <span className="material-symbols-outlined text-xl">navigate_next</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
