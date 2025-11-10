import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Credenciales inválidas. Por favor registra una nueva cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Simple Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500"></div>

      {/* Decorative Circles (Static) */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"></div>

      {/* Beautiful WhatsApp/Chat Illustration */}
      <div className="absolute top-10 right-10 hidden lg:block opacity-20">
        <svg width="300" height="300" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" fill="white" opacity="0.1"/>
          <path d="M100 40c33.137 0 60 26.863 60 60s-26.863 60-60 60-60-26.863-60-60 26.863-60 60-60z" fill="white" opacity="0.15"/>
          <path d="M70 90h60M70 110h40" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.3"/>
        </svg>
      </div>

      {/* Left side illustration */}
      <div className="absolute bottom-10 left-10 hidden lg:block opacity-15">
        <svg width="250" height="250" viewBox="0 0 100 100" fill="none">
          <rect x="20" y="30" width="60" height="50" rx="10" fill="white" opacity="0.3"/>
          <circle cx="35" cy="45" r="5" fill="white" opacity="0.5"/>
          <circle cx="50" cy="45" r="5" fill="white" opacity="0.5"/>
          <circle cx="65" cy="45" r="5" fill="white" opacity="0.5"/>
        </svg>
      </div>

      {/* Login Card with 3D Effect */}
      <div className="relative z-10 w-full max-w-md">
        <div
          ref={cardRef}
          className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/10 via-blue-400/10 to-cyan-400/10 blur-xl"></div>

          {/* Content */}
          <div className="relative">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <div className="text-6xl">💬</div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ChatFlow Pro
              </h1>
              <p className="text-white/80 text-lg">
                WhatsApp CRM con IA
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-white/60 text-sm">Sistema Inteligente</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl animate-shake">
                <p className="text-red-100 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 outline-none"
                    placeholder="tu@email.com"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 outline-none"
                    placeholder="••••••••"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg overflow-hidden group hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Iniciando...
                    </>
                  ) : (
                    <>
                      Iniciar Sesión
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30">
              <div className="flex items-start gap-2">
                <div className="text-blue-300 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-200 font-medium mb-1">
                    ¿Primera vez aquí?
                  </p>
                  <p className="text-xs text-blue-100/80">
                    Crea tu cuenta gratis para empezar a usar WhatsApp con IA
                  </p>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-white/70">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="text-cyan-300 font-semibold hover:text-cyan-200 transition-colors underline-offset-4 hover:underline"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Custom CSS */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
