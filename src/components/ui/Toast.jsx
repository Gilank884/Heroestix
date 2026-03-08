import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

const Toast = ({ show, message, type = 'success', onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ease-in-out ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
            <div className={`
                ${type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'} 
                text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-bold text-sm border border-slate-800 backdrop-blur-md bg-opacity-95
            `}>
                <div className={`${type === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'} rounded-full p-2 shrink-0 shadow-lg`}>
                    {type === 'warning' ? (
                        <AlertTriangle size={18} className="text-white" />
                    ) : (
                        <CheckCircle size={18} className="text-white" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-white tracking-tight">{message}</span>
                </div>
                <button onClick={onClose} className="ml-4 p-1 hover:bg-white/10 rounded-full transition-all active:scale-90">
                    <X size={16} className="text-slate-400" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
