import React from 'react';
import { rupiah, containerStyle, tableStyle, thStyle, tdStyle, RenderFooter } from './SharedParts';

export default function PlatformReport({ data, metrics }) {
    return (
        <div id="platform-report-content" style={containerStyle}>
            <div style={{ textAlign: 'center', marginBottom: '10mm', borderBottom: '2px solid black', paddingBottom: '5mm' }}>
                <h1 style={{ fontSize: '18pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>HEROESTIX TICKETING SYSTEM</h1>
                <h2 style={{ fontSize: '14pt', margin: '0 0 2mm 0', fontWeight: 'bold' }}>LAPORAN KEUANGAN PLATFORM (CONSOLIDATED)</h2>
                <p style={{ fontSize: '10pt', margin: 0 }}>Generated on: {new Date().toLocaleString('id-ID')}</p>
            </div>

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th colSpan="2" style={thStyle}>RINGKASAN EKSEKUTIF</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={tdStyle}>Total Pendapatan Kotor (Gross Sales)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{rupiah(metrics?.totalGross, 2)}</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}>Total Bagi Hasil Kreator (Net Revenue)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>({rupiah(metrics?.totalNetRevenue, 2)})</td>
                    </tr>
                    <tr>
                        <td style={tdStyle}>Potongan Biaya Layanan (Payment Gateway Fees)</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>({rupiah(metrics?.totalGross - metrics?.totalNetRevenue - metrics?.totalCleanProfit, 2)})</td>
                    </tr>
                    <tr>
                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>Laba Bersih Platform (Sebelum Pajak)</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{rupiah(metrics?.totalCleanProfit, 2)}</td>
                    </tr>
                    <tr>
                        <td style={{ ...tdStyle, color: '#b91c1c' }}>Potongan PPN Platform (11%)</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#b91c1c' }}>({rupiah(metrics?.totalPpn, 2)})</td>
                    </tr>
                    <tr style={{ backgroundColor: '#fff1f2' }}>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', fontWeight: 'bold', fontSize: '12pt' }}>TOTAL HASIL AKHIR (NET PROFIT)</td>
                        <td style={{ ...tdStyle, padding: '4mm 3mm', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>{rupiah(metrics?.totalFinalProfit, 2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style={{ marginBottom: '10mm' }}>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '2mm', marginBottom: '4mm' }}>DETAIL PERFORMA PER EVENT</h3>
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th style={{ ...thStyle, fontSize: '9pt' }}>Nama Event</th>
                            <th style={{ ...thStyle, textAlign: 'center', fontSize: '9pt' }}>Terjual</th>
                            <th style={{ ...thStyle, textAlign: 'right', fontSize: '9pt' }}>Net Profit Platform</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((e, i) => (
                            <tr key={i}>
                                <td style={{ ...tdStyle, fontSize: '9pt' }}>{e.title}</td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontSize: '9pt' }}>{e.ticketsSold}</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontSize: '9pt' }}>{rupiah(e.finalProfit, 2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <RenderFooter signer="Disetujui Oleh," traceId="CONSOLIDATED-AUDIT" />
        </div>
    );
}
