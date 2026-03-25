import React from 'react';
import { rupiah, containerStyle, tableStyle, thStyle, tdStyle, RenderFooter } from './SharedParts';

export default function CreatorSalesReport({ data, metrics, eventData, creatorInfo }) {
    return (
        <div id="financial-report-content" style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '10mm', borderBottom: '2px solid black', paddingBottom: '5mm' }}>
                <h1 style={{ fontSize: '18pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>HEROESTIX TICKETING SYSTEM</h1>
                <h2 style={{ fontSize: '14pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>LAPORAN PENJUALAN EVENT (SALES SUMMARY)</h2>
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
                            <td style={{ fontWeight: 'bold' }}>Total Tiket Terjual</td>
                            <td>:</td>
                            <td>{metrics?.totalTickets || data?.stats?.ticketsSold} Unit</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3mm' }}>A. RINGKASAN PENDAPATAN PENJUALAN</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={thStyle}>Deskripsi Akun</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Jumlah (IDR)</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '10pt' }}>
                    <tr>
                        <td style={tdStyle}>Total Penjualan Bruto (Ticket Sales)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{rupiah(metrics?.totalGross || data?.stats?.totalRevenue)}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f0f9ff' }}>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', fontWeight: 'bold', fontSize: '12pt' }}>ESTIMASI PENDAPATAN BERSIH</td>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>{rupiah(metrics?.totalNetRevenue || data?.stats?.totalRevenue)}</td>
                    </tr>
                </tbody>
            </table>

            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '3mm' }}>B. DETAIL TRANSAKSI TERAKHIR (SAMPEL)</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ ...thStyle, fontSize: '9pt' }}>ID Order</th>
                        <th style={{ ...thStyle, fontSize: '9pt' }}>Nama Pembeli</th>
                        <th style={{ ...thStyle, fontSize: '9pt' }}>Email</th>
                        <th style={{ ...thStyle, textAlign: 'right', fontSize: '9pt' }}>Potensi Net</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: '8pt' }}>
                    {data?.length > 0 ? data.slice(0, 15).map((t, i) => (
                        <tr key={i}>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.order_id?.substring(0, 8) || t.orders?.id.substring(0, 8)}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.full_name}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.email}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm', textAlign: 'right' }}>{rupiah(t.calculated_revenue)}</td>
                        </tr>
                    )) : data?.history?.length > 0 ? data.history.slice(0, 15).map((t, i) => (
                        <tr key={i}>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.orders?.id.substring(0, 8)}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.full_name}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm' }}>{t.email}</td>
                            <td style={{ ...tdStyle, padding: '1.5mm', textAlign: 'right' }}>{rupiah(t.calculated_revenue)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4" style={{ ...tdStyle, padding: '4mm', textAlign: 'center' }}>Belum ada data transaksi.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <RenderFooter signer="Admin Ticketing," traceId={eventData?.id?.slice(0, 6).toUpperCase()} />
        </div>
    );
}
