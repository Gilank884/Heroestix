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
        // Load dependencies from CDN
        await Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        ]);

        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found:', elementId);
            return;
        }

        // Wait a bit for images to render if any
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc, clonedElement) => {
                // Fix for "oklch" and other modern color functions that html2canvas doesn't support
                // We iterate over the original elements to get their computed RGB values
                const allElements = element.querySelectorAll('*');
                const allClonedElements = clonedElement.querySelectorAll('*');
                
                // Also handle the root element
                [element, ...allElements].forEach((el, index) => {
                    const clonedEl = index === 0 ? clonedElement : allClonedElements[index - 1];
                    if (!clonedEl) return;

                    const style = window.getComputedStyle(el);
                    
                    // html2canvas fails when it sees modern color functions in any style property
                    // We force the most common ones to computed RGB
                    clonedEl.style.color = style.color;
                    clonedEl.style.backgroundColor = style.backgroundColor;
                    clonedEl.style.borderColor = style.borderColor;
                    clonedEl.style.fill = style.fill;
                    clonedEl.style.stroke = style.stroke;
                });
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2] // Matching the element's size
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(filename);
        
        return true;
    } catch (error) {
        console.error('PDF Export Error:', error);
        return false;
    }
};
