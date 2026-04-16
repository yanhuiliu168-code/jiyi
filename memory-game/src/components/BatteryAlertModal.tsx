import { X, BatteryWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface BatteryAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatteryAlertModal({ isOpen, onClose }: BatteryAlertModalProps) {
  const navigate = useNavigate();
  const serverConfig = useStore((state) => state.serverConfig);

  if (!isOpen) return null;

  const handleGoToParent = () => {
    onClose();
    navigate('/parent');
  };

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BatteryWarning className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800">游戏电量不足</h2>
        
        <p className="text-gray-600 text-lg">
          {serverConfig?.batteryAlertMessage || '游戏电量不足，请家长去家长专区看广告进行充电。'}
        </p>
        
        <div className="pt-4 flex flex-col space-y-3">
          <button
            onClick={handleGoToParent}
            className="w-full bg-blue-500 text-white font-bold text-xl py-3 rounded-xl hover:bg-blue-600 transition active:scale-95"
          >
            去充电
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 font-bold text-xl py-3 rounded-xl hover:bg-gray-200 transition active:scale-95"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
