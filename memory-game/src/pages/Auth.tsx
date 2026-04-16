import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Auth() {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`;
    const body = isLogin ? { username, password } : { username, email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      setUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      });
      
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'wechat' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Wechat login failed');
      
      setUser({
        id: data.user.id,
        username: data.user.username,
        token: data.token
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🧠
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isLogin ? '欢迎回来' : '注册新账号'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? '登录以同步您的训练进度' : '创建账号开始您的训练之旅'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          )}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="用户名 / 邮箱"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-600 transition active:scale-95 disabled:opacity-70"
          >
            {loading ? '处理中...' : (isLogin ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative bg-white px-4 text-sm text-gray-500">或者</span>
        </div>

        <button
          onClick={handleWechatLogin}
          type="button"
          disabled={loading}
          className="w-full bg-[#07C160] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#06ad56] transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>微信一键登录 (模拟)</span>
        </button>

        <div className="text-center text-sm">
          <span className="text-gray-500">
            {isLogin ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 font-bold ml-1 hover:underline"
          >
            {isLogin ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
}