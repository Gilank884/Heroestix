/**
 * Utility to export JSON data to an Excel file using the xlsx library via CDN
 */

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Exports data to Excel
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 */
export const exportToExcel = async (data, filename = 'export.xlsx') => {
    try {
        // Load xlsx library from CDN
        await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');

        if (!window.XLSX) {
            throw new Error('XLSX library not loaded');
        }

        const XLSX = window.XLSX;

        // Create a worksheet from the data
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Create a workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Trigger the download
        XLSX.writeFile(workbook, filename);

        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        return false;
    }
};
