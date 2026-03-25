/**
 * Utility to export a DOM element as a PDF using jspdf and html2canvas via CDN
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

export const exportToPDF = async (elementId, filename = 'receipt.pdf') => {
    try {
        // Load newer html-to-image to avoid html2canvas CSS parsing bugs (like unsupported oklch)
        await Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        ]);

        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found:', elementId);
            return;
        }

        // Wait a bit for images to render if any
        await new Promise(resolve => setTimeout(resolve, 800));

        const imgData = await window.htmlToImage.toPng(element, {
            quality: 1.0,
            pixelRatio: 1.5, // Reduced from 2 for "lighter" file size while maintaining readability
            backgroundColor: '#ffffff',
            style: {
                height: 'auto',
                maxHeight: 'none',
                overflow: 'visible'
            }
        });

        // Load image to get true dimensions
        const img = new Image();
        img.src = imgData;
        await new Promise(r => img.onload = r);

        const imgWidth = img.width;
        const imgHeight = img.height;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate the height of the image when scaled to A4 width
        const canvasHeightInMm = (imgHeight * pdfWidth) / imgWidth;

        let heightLeft = canvasHeightInMm;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm);
        heightLeft -= pdfHeight;

        // Add additional pages if the image is taller than one A4 page
        while (heightLeft > 0) {
            position = heightLeft - canvasHeightInMm;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm);
            heightLeft -= pdfHeight;
        }

        pdf.save(filename);
        
        return true;
    } catch (error) {
        console.error('PDF Export Error:', error);
        return false;
    }
};
