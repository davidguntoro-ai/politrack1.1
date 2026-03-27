export interface WatermarkData {
  userName: string;
  timestamp: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  latitude: number;
  longitude: number;
}

export const applyWatermark = async (base64Image: string, data: WatermarkData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark settings
      const padding = 20;
      const lineHeight = 24;
      const lines = [
        'POLITRACK AI - VERIFIED',
        `${data.userName} | ${data.timestamp}`,
        `Kab: ${data.kabupaten} | Kec: ${data.kecamatan}`,
        `Desa: ${data.desa}`,
        `Coords: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
      ];

      const barHeight = lines.length * lineHeight + padding * 2;
      const barY = canvas.height - barHeight;

      // Semi-transparent black bar (Opacity 50%)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, barY, canvas.width, barHeight);

      // Text settings
      ctx.fillStyle = 'white';
      ctx.font = '14pt sans-serif';
      ctx.textBaseline = 'top';

      // Draw text lines
      lines.forEach((line, index) => {
        ctx.fillText(line, padding, barY + padding + index * lineHeight);
      });

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};
