import React from 'react';
import { rupiah, containerStyle, tableStyle, thStyle, tdStyle, RenderFooter } from './SharedParts';

export default function EventAuditReport({ eventData, creatorInfo, metrics, paymentBreakdown }) {
    return (
        <div id="financial-report-content" style={containerStyle}>
            {/* Centered Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
                <h1 style={{ fontSize: '22pt', margin: '0 0 2mm 0', fontWeight: 'bold', letterSpacing: '1px' }}>HEROESTIX TICKETING SYSTEM</h1>
                <h2 style={{ fontSize: '16pt', margin: '0 0 3mm 0', fontWeight: 'bold' }}>AUDIT KEUANGAN EVENT</h2>
                <p style={{ fontSize: '10pt', margin: '0 0 6mm 0', color: '#000' }}>
                    ID Event: {eventData?.id} | Generated: {new Date().toLocaleString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                </p>
                <div style={{ borderBottom: '2px solid black', width: '100%', marginBottom: '10mm' }}></div>
            </div>

            {/* Event Profile Box */}
            <div style={{ border: '1.5px solid black', padding: '6mm', marginBottom: '10mm' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '38mm', fontWeight: 'bold', padding: '1.5mm 0' }}>Nama Event</td>
                            <td style={{ width: '5mm' }}>:</td>
                            <td style={{ padding: '1.5mm 0' }}>{eventData?.title}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 'bold', padding: '1.5mm 0' }}>Penyelenggara</td>
                            <td>:</td>
                            <td style={{ padding: '1.5mm 0' }}>{creatorInfo?.brand_name || creatorInfo?.full_name}</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 'bold', padding: '1.5mm 0' }}>Tanggal Event</td>
                            <td>:</td>
                            <td style={{ padding: '1.5mm 0' }}>{eventData?.event_date || eventData?.start_date || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '4mm', textTransform: 'uppercase' }}>A. RINGKASAN PENDAPATAN PLATFORM</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f5' }}>
                        <th style={{ ...thStyle, width: '70%' }}>Deskripsi</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Jumlah (IDR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}>Total Penjualan Kotor ({metrics?.totalTickets || 0} Tiket)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{rupiah(metrics?.totalGross || 0)}</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}>Hak Kreator (Net Revenue)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>({rupiah(metrics?.totalNetRevenue || 0)})</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}>Biaya Payment Gateway (Bayarind)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>({rupiah(metrics?.totalGross - metrics?.totalNetRevenue - metrics?.totalCleanProfit, 1)})</td>
                    </tr>
                    <tr>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>Laba Bersih Platform (Bruto)</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{rupiah(metrics?.totalCleanProfit || 0, 1)}</td>
                    </tr>
                    <tr>
                        <td style={{ ...tdStyle, color: '#b91c1c' }}>Pajak PPN Platform (11%)</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#b91c1c' }}>({rupiah(metrics?.totalPpn || 0, 2)})</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fff1f2' }}>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', fontWeight: 'bold', textTransform: 'uppercase' }}>Hasil Akhir Platform (Net Profit)</td>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', textAlign: 'right', fontWeight: 'bold' }}>{rupiah(metrics?.totalFinalProfit || 0, 2)}</td>
                    </tr>
                </tbody>
            </table>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '4mm', textTransform: 'uppercase' }}>B. BREAKDOWN METODE PEMBAYARAN</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f5' }}>
                        <th style={{ ...thStyle, width: '70%' }}>Metode Pembayaran</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Jumlah Transaksi</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentBreakdown && Object.entries(paymentBreakdown).filter(([_, count]) => count > 0).map(([label, count]) => (
                        <tr key={label}>
                            <td style={tdStyle}>{label}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{count}</td>
                        </tr>
                    ))}
                    {(!paymentBreakdown || Object.values(paymentBreakdown).every(v => v === 0)) && (
                        <tr>
                            <td colSpan="2" style={{ ...tdStyle, textAlign: 'center', color: '#64748b' }}>Belum ada data pembayaran.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <RenderFooter signer="Disetujui Oleh," traceId={eventData?.id?.slice(0, 6).toUpperCase()} />
        </div>
    );
}
