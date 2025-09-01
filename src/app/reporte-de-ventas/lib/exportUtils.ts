// 2025 J.O.T. (Jorge Osvaldo Tripodi) - Todos los derechos reservados

// Alternative export using modern-screenshot library approach
const captureElementAsImage = async (element: HTMLElement): Promise<string> => {
  // Create a clone of the element to avoid modifying the original
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  tempContainer.style.width = element.offsetWidth + 'px';
  tempContainer.style.height = element.offsetHeight + 'px';
  tempContainer.style.backgroundColor = 'white';
  tempContainer.style.padding = '0';
  tempContainer.style.margin = '0';
  tempContainer.style.border = 'none';
  tempContainer.style.overflow = 'hidden';
  
  // Apply inline styles to avoid CSS issues
  const applyInlineStyles = (el: HTMLElement) => {
    const computedStyle = window.getComputedStyle(el);
    
    // Copy essential computed styles as inline styles
    el.style.color = computedStyle.color === 'oklch(0.278078 0.029596 256.848)' ? 'rgb(31, 41, 55)' : computedStyle.color;
    el.style.backgroundColor = computedStyle.backgroundColor === 'oklch(1 0 0)' ? 'rgb(255, 255, 255)' : computedStyle.backgroundColor;
    el.style.fontSize = computedStyle.fontSize;
    el.style.fontWeight = computedStyle.fontWeight;
    el.style.fontFamily = computedStyle.fontFamily;
    el.style.padding = computedStyle.padding;
    el.style.margin = computedStyle.margin;
    el.style.border = computedStyle.border;
    el.style.borderRadius = computedStyle.borderRadius;
    el.style.display = computedStyle.display;
    el.style.flexDirection = computedStyle.flexDirection;
    el.style.justifyContent = computedStyle.justifyContent;
    el.style.alignItems = computedStyle.alignItems;
    el.style.width = computedStyle.width;
    el.style.height = computedStyle.height;
    
    // Hide chart controls
    if (el.classList.contains('chart-controls')) {
      el.style.display = 'none';
    }
    
    // Process children
    Array.from(el.children).forEach(child => {
      if (child instanceof HTMLElement) {
        applyInlineStyles(child);
      }
    });
  };
  
  applyInlineStyles(clonedElement);
  tempContainer.appendChild(clonedElement);
  document.body.appendChild(tempContainer);
  
  try {
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create canvas manually
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    const scale = 2; // Higher resolution
    canvas.width = element.offsetWidth * scale;
    canvas.height = element.offsetHeight * scale;
    ctx.scale(scale, scale);
    
    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, element.offsetWidth, element.offsetHeight);
    
    // Draw border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, element.offsetWidth, element.offsetHeight);
    
    // Draw title
    const titleElement = clonedElement.querySelector('h4');
    if (titleElement) {
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(titleElement.textContent || '', 24, 40);
    }
    
    // Try to capture SVG elements
    const svgElements = clonedElement.querySelectorAll('svg');
    for (const svg of svgElements) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        await new Promise<void>((resolve, _reject) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't fail on SVG errors
          img.src = url;
        });
        
        if (img.complete && img.naturalWidth > 0) {
          const rect = svg.getBoundingClientRect();
          const containerRect = element.getBoundingClientRect();
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          ctx.drawImage(img, x, y, svg.clientWidth, svg.clientHeight);
        }
        
        URL.revokeObjectURL(url);
      } catch (svgError) {
        console.log('SVG capture failed, continuing...', svgError);
      }
    }
    
    return canvas.toDataURL('image/png');
    
  } finally {
    document.body.removeChild(tempContainer);
  }
};

export const exportChartAsPNG = async (
  chartContainerRef: React.RefObject<HTMLDivElement | null>,
  filename: string = 'chart'
) => {
  if (!chartContainerRef.current) {
    console.error('Chart container reference not found');
    return;
  }

  try {
    // Hide controls temporarily
    const controlsElements = chartContainerRef.current.querySelectorAll('.chart-controls');
    controlsElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use the safe capture method
    const dataUrl = await captureElementAsImage(chartContainerRef.current);

    // Show controls again
    controlsElements.forEach(el => {
      (el as HTMLElement).style.display = '';
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Chart exported successfully');
    
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    
    // Show controls again in case of error
    const controlsElements = chartContainerRef.current?.querySelectorAll('.chart-controls');
    controlsElements?.forEach(el => {
      (el as HTMLElement).style.display = '';
    });
    
    // Show user-friendly error message
    alert('Error al exportar el gráfico. Por favor, intente nuevamente o tome una captura de pantalla manualmente.');
  }
};
