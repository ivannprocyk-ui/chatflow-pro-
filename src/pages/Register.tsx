import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Sparkles, Shield, Rocket } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(email, password, organizationName);
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar. Intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding & Benefits */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold">ChatFlow Pro</h1>
                <p className="text-xl text-white/80">Empieza gratis hoy mismo</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-6 mt-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Sin tarjeta de crédito</h3>
                <p className="text-sm text-white/70">Comienza gratis, sin compromisos. Actualiza cuando estés listo.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Setup en 5 minutos</h3>
                <p className="text-sm text-white/70">Configura tu cuenta y empieza a automatizar en minutos.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">100% Seguro</h3>
                <p className="text-sm text-white/70">Tus datos están protegidos con encriptación de nivel empresarial.</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-white/70">Empresas activas</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50M+</div>
              <div className="text-sm text-white/70">Mensajes enviados</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-white/70">Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta</h2>
              <p className="text-gray-600">Únete a miles de empresas exitosas</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de tu empresa
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                  placeholder="Mi Empresa S.A."
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email corporativo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                  placeholder="tu@empresa.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">Usa al menos 6 caracteres</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear cuenta gratis'
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="mt-6 text-xs text-gray-500 text-center">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
                Política de Privacidad
              </a>
            </p>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 font-semibold hover:text-purple-700 transition"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
