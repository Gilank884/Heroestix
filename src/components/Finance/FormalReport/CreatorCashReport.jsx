import React from 'react';
import { rupiah, containerStyle, tableStyle, thStyle, tdStyle, RenderFooter } from './SharedParts';

export default function CreatorCashReport({ data, creatorInfo, eventData }) {
    return (
        <div id="financial-report-content" style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '10mm', borderBottom: '2px solid black', paddingBottom: '5mm' }}>
                <h1 style={{ fontSize: '18pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>HEROESTIX TICKETING SYSTEM</h1>
                <h2 style={{ fontSize: '14pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>LAPORAN ARUS KAS EVENT (CREATOR)</h2>
                <p style={{ fontSize: '10pt', margin: 0 }}>Generated on: {new Date().toLocaleString('id-ID')}</p>
            </div>

            <div style={{ marginBottom: '8mm', border: '1px solid black', padding: '4mm' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '25%', fontWeight: 'bold' }}>Nama Event</td>
                            <td style={{ width: '2%' }}>:</td>
                            <td>{eventData?.title}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 'bold' }}>Penyelenggara</td>
                            <td>:</td>
                            <td>{creatorInfo?.brand_name || creatorInfo?.full_name}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 'bold' }}>ID Rekening</td>
                            <td>:</td>
                            <td>{creatorInfo?.bank_name} - {creatorInfo?.bank_account} ({creatorInfo?.bank_account_name})</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3mm' }}>A. RINGKASAN SALDO EVENT</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={thStyle}>Deskripsi Akun</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Jumlah (IDR)</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '10pt' }}>
                    <tr>
                        <td style={tdStyle}>Total Penjualan Tiket (Net Revenue Kreator)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{rupiah(data?.totalSales)}</td>
                    </tr>
                    <tr>
                        <td style={{ ...tdStyle, color: '#b91c1c' }}>Total Dana Telah Dicairkan (Withdrawals Approved)</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#b91c1c' }}>({rupiah(data?.totalWithdrawn)})</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f0f9ff' }}>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', fontWeight: 'bold', fontSize: '12pt' }}>SALDO AKHIR TERSEDIA</td>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>{rupiah(data?.eventBalance)}</td>
                    </tr>
                </tbody>
            </table>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3mm' }}>B. RIWAYAT PENCAIRAN DANA</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ ...thStyle, fontSize: '9pt' }}>Tanggal</th>
                        <th style={{ ...thStyle, fontSize: '9pt' }}>Keterangan</th>
                        <th style={{ ...thStyle, textAlign: 'right', fontSize: '9pt' }}>Nominal</th>
                        <th style={{ ...thStyle, textAlign: 'center', fontSize: '9pt' }}>Status</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '9pt' }}>
                    {data?.withdrawals?.length > 0 ? data.withdrawals.map((w, i) => (
                        <tr key={i}>
                            <td style={tdStyle}>{new Date(w.created_at).toLocaleDateString()}</td>
                            <td style={tdStyle}>Penarikan Dana Event</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{rupiah(w.amount)}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{w.status?.toUpperCase()}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" style={{ ...tdStyle, padding: '4mm', textAlign: 'center', color: '#64748b' }}>Belum ada riwayat pencairan dana.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <RenderFooter signer="Finance Department," traceId={eventData?.id?.slice(0, 6).toUpperCase()} />
        </div>
    );
}
