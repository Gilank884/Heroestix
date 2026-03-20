import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import useAuthStore from '../../auth/useAuthStore';
import {
    ArrowLeft,
    Wallet,
    Building2,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    ShieldCheck,
    ArrowUpRight,
    Info,
    Download
} from 'lucide-react';
import { exportToPDF } from '../../utils/pdfExport';

const rupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value || 0);
};

export default function WithdrawalDetail() {
    const { id, eventId } = useParams();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);

    useEffect(() => {
        if (id) {
            fetchWithdrawalDetail();
        }
    }, [id]);

    const fetchWithdrawalDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    creators:creator_id (
                        brand_name,
                        bank_name,
                        bank_account,
                        account_bank_name,
                        profiles (
                            full_name,
                            email
                        )
                    ),
                    events:event_id (
                        title
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // Security check
            if (data.creator_id !== user?.id) {
                alert("Unauthorized access");
                navigate('/withdrawals');
                return;
            }

            setRequest(data);
        } catch (error) {
            console.error('Error fetching withdrawal detail:', error.message);
            alert('Error fetching details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        const filename = `WD-${request.id.substring(0, 8).toUpperCase()}-Receipt.pdf`;
        await exportToPDF('withdrawal-receipt', filename);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="p-10 text-center">
                <p className="text-slate-500 font-medium">Data penarikan tidak ditemukan.</p>
                <button 
                    onClick={() => navigate(eventId ? `/manage/event/${eventId}/withdrawals` : '/withdrawals')}
                    className="mt-4 text-blue-600 font-bold hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-6">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 lg:px-0">
                <button
                    onClick={() => navigate(eventId ? `/manage/event/${eventId}/withdrawals` : '/withdrawals')}
                    className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Detail Penarikan</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ref: WD-{request.id.substring(0, 8).toUpperCase()}</p>
                </div>
            </div>

            <div className="space-y-8 px-4 lg:px-0">
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {/* Status Header */}
                    <div className={`px-8 py-3 flex items-center justify-between ${
                        request.status === 'pending' ? 'bg-amber-50 border-b border-amber-100' : 
                        request.status === 'approved' ? 'bg-blue-50 border-b border-blue-100' : 'bg-red-50 border-b border-red-100'
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                                request.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                                request.status === 'approved' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {request.status === 'pending' ? <Clock size={16} /> : request.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${
                                    request.status === 'pending' ? 'text-amber-500' : 
                                    request.status === 'approved' ? 'text-blue-500' : 'text-red-500'
                                }`}>Status Penarikan</p>
                                <span className={`text-xs font-bold ${
                                    request.status === 'pending' ? 'text-amber-900' : 
                                    request.status === 'approved' ? 'text-blue-900' : 'text-red-900'
                                }`}>
                                    {request.status === 'approved' ? 'Berhasil Ditransfer' : request.status === 'rejected' ? 'Ditolak' : 'Sedang Diproses'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Diajukan Pada</p>
                            <span className="text-xs font-bold text-slate-700">{new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="p-5 lg:p-8 space-y-8">
                        {/* Summary Section */}
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50 rounded-[32px] p-6 border border-slate-100">
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Nominal Penarikan</p>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{rupiah(request.amount)}</h2>
                            </div>
                            <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center shadow-sm">
                                <Wallet size={28} className="text-blue-600" />
                            </div>
                        </div>

                        {/* Redesigned Confirmation Section (Only for Approved) */}
                        {request.status === 'approved' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Konfirmasi Transfer</h3>
                                    </div>
                                    <button 
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
                                    >
                                        <Download size={14} />
                                        Download PDF
                                    </button>
                                </div>

                                <div id="withdrawal-receipt" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                    {/* Sender (PT Peristiwa Kreatif Nusantara) */}
                                    <div className="md:col-span-5 bg-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-600/20">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <Building2 size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pengirim (Platform)</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1 leading-none">Nama Bank</p>
                                                    <p className="font-bold text-white text-sm">Bank BNI</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1 leading-none">No. Rekening</p>
                                                    <p className="font-mono font-black text-white text-base tracking-wider">1905373456</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mb-1 leading-none">Atas Nama</p>
                                                    <p className="font-bold text-white text-sm truncate">PT Peristiwa Kreatif Nusantara</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow icon */}
                                    <div className="md:col-span-2 flex justify-center">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 rotate-90 md:rotate-0">
                                            <ArrowUpRight size={24} className="rotate-45" />
                                        </div>
                                    </div>

                                    {/* Receiver (You) */}
                                    <div className="md:col-span-5 bg-white border-2 border-blue-600/20 rounded-3xl p-6 shadow-sm">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-600/60">
                                                <User size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Penerima (Anda)</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Nama Bank</p>
                                                    <p className="font-bold text-slate-900 text-sm">{request.creators?.bank_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">No. Rekening</p>
                                                    <p className="font-mono font-black text-slate-900 text-base tracking-wider">{request.creators?.bank_account}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Atas Nama</p>
                                                    <p className="font-bold text-slate-900 text-sm truncate">{request.creators?.account_bank_name || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-2">
                                    <Info size={14} className="text-blue-600" />
                                    <p className="text-[11px] font-bold text-blue-800 italic">"Transaksi ini Berhasil Sudah Di transfer Ke {request.creators?.account_bank_name}."</p>
                                </div>
                            </div>
                        )}

                        {/* Details Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User size={12} />
                                    Informasi Rekening
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Bank</span>
                                        <span className="text-xs font-bold text-slate-900">{request.creators?.bank_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Rekening</span>
                                        <span className="text-xs font-mono font-bold text-slate-900">{request.creators?.bank_account}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atas Nama</span>
                                        <span className="text-xs font-bold text-slate-900">{request.creators?.account_bank_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Info size={12} />
                                    Detail Pengajuan
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Referensi</span>
                                        <span className="text-sm font-black text-slate-900">WD-{request.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event</span>
                                        <span className="text-sm font-bold text-blue-600 italic truncate ml-4 text-right">{request.events?.title || 'Umum'}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Terakhir Diupdate</span>
                                        <span className="text-sm font-bold text-slate-900">{new Date(request.updated_at || request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm">
                                <Info size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-900">Butuh bantuan?</p>
                                <p className="text-xs text-slate-500 leading-relaxed">Jika terdapat ketidaksesuaian data atau pertanyaan lebih lanjut, hubungi tim support kami dengan menyertakan nomor referensi transaksi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
