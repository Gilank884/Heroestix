import React from 'react';
import { HiShieldCheck } from 'react-icons/hi';

const VerificationPending = () => {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 px-6">
            <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                <HiShieldCheck size={48} />
            </div>
            <div className="max-w-md space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight text-balance">Akun Dalam Peninjauan</h2>
                <p className="text-slate-500 font-medium text-lg">Tim kami sedang memverifikasi profil Anda. Proses ini biasanya memakan waktu 1x24 jam.</p>
            </div>
        </div>
    );
};

export default VerificationPending;
