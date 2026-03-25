import React from 'react';

export const rupiah = (value, decimals = 0) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value || 0).replace("Rp", "Rp ");
};

export const containerStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '20mm',
    background: 'white',
    color: 'black',
    fontFamily: "'Times New Roman', Times, serif",
    lineHeight: '1.5'
};

export const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '8mm'
};

export const thStyle = {
    border: '1px solid black',
    padding: '3mm',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
    fontSize: '10pt',
    fontWeight: 'bold'
};

export const tdStyle = {
    border: '1px solid black',
    padding: '3mm',
    fontSize: '10pt'
};

export const RenderFooter = ({ signer, traceId }) => (
    <div style={{ marginTop: '20mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
                <p style={{ margin: '0 0 20mm 0', fontSize: '10pt' }}>{signer}</p>
                <div style={{ borderBottom: '1px solid black', width: '80%', margin: '0 auto' }}></div>
                <p style={{ fontSize: '9pt', marginTop: '1mm' }}>Finance Department</p>
            </div>
            <div style={{ textAlign: 'right', width: '45%' }}>
                <p style={{ fontSize: '8pt', color: '#334155', fontStyle: 'italic', marginBottom: '8mm' }}>
                    Dokumen ini adalah salinan digital resmi dan tidak memerlukan tanda tangan basah. 
                    Keaslian data dapat diverifikasi melalui sistem internal Heroestix.
                </p>
                <p style={{ fontSize: '8pt', color: '#94a3b8' }}>Hash Trace: {traceId || 'N/A'}</p>
            </div>
        </div>
    </div>
);
