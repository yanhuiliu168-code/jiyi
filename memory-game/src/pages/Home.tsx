import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Gamepad2, Brain, Battery, LogOut, Eye, Hourglass } from 'lucide-react';
import { useStore } from '../store/useStore';
import BatteryAlertModal from '../components/BatteryAlertModal';

export default function Home() {
  const navigate = useNavigate();
  const battery = useStore((state) => state.battery);
  const reviveItems = useStore((state) => state.reviveItems);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [showBatteryAlert, setShowBatteryAlert] = useState(false);

  const handlePlay = (route: string) => {
    if (battery > 0) {
      navigate(route);
    } else {
      setShowBatteryAlert(true);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-6 relative">
      <button 
        onClick={handleLogout}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm flex items-center"
      >
        <LogOut className="w-5 h-5" />
      </button>

      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">宝宝记忆卡</h1>
        <p className="text-gray-500">欢迎, {user.username || '玩家'} | 轻松好玩的记忆力训练</p>
      </div>

      <div className="flex space-x-3 mb-8">
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm text-gray-700 font-medium">
          <Battery className="text-green-500 w-5 h-5" />
          <span>{battery} 局</span>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm text-gray-700 font-medium">
          <Hourglass className="text-orange-500 w-5 h-5" />
          <span>{reviveItems} 个</span>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={() => handlePlay('/game1')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg transition-transform active:scale-95"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">闪卡记忆训练</h2>
              <p className="text-blue-100 text-base mt-1">锻炼瞬间记忆能力</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handlePlay('/game2')}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg transition-transform active:scale-95"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">连续记忆训练</h2>
              <p className="text-purple-100 text-base mt-1">提升专注与持久记忆</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handlePlay('/game3')}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg transition-transform active:scale-95"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">视觉注意力训练</h2>
              <p className="text-teal-100 text-base mt-1">提升视觉搜索与处理</p>
            </div>
          </div>
        </button>
      </div>

      <div className="w-full px-6 pt-10">
        <Link
          to="/parent"
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl py-3 flex items-center justify-center space-x-2 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-bold text-lg">家长专区</span>
        </Link>
      </div>

      <BatteryAlertModal 
        isOpen={showBatteryAlert} 
        onClose={() => setShowBatteryAlert(false)} 
      />
    </div>
  );
}
