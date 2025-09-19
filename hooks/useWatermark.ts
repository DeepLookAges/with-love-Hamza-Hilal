import { useCallback } from 'react';
import { Platform } from '../types';
import { LOGO_SVG_DATA_URL } from '../constants';

export const useWatermark = () => {
    const applyWatermark = useCallback(async (base64Image: string, platform: Platform): Promise<string> => {
        return new Promise((resolve, reject) => {
            const logo = new Image();
            const originalImage = new Image();

            let logoLoaded = false;
            let originalImageLoaded = false;

            const drawCanvas = () => {
                if (!logoLoaded || !originalImageLoaded) return;

                const canvas = document.createElement('canvas');
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context.'));
                }

                // Draw original image
                ctx.drawImage(originalImage, 0, 0);

                // Watermark settings
                const padding = Math.max(20, canvas.width * 0.02); // 2% padding or 20px min
                const logoHeight = Math.min(60, canvas.height * 0.1); // 10% of image height, max 60px
                const logoWidth = logoHeight * (200 / 60); // maintain aspect ratio (200w/60h)

                const x = padding;
                const y = canvas.height - logoHeight - padding;

                ctx.drawImage(logo, x, y, logoWidth, logoHeight);

                resolve(canvas.toDataURL('image/png'));
            };

            logo.onload = () => {
                logoLoaded = true;
                drawCanvas();
            };
            logo.onerror = (error) => reject(new Error(`Failed to load logo image: ${error}`));
            logo.src = LOGO_SVG_DATA_URL;

            originalImage.onload = () => {
                originalImageLoaded = true;
                drawCanvas();
            };
            originalImage.onerror = (error) => reject(new Error(`Failed to load image for watermarking: ${error}`));
            originalImage.src = `data:image/png;base64,${base64Image}`;
        });
    }, []);

    return { applyWatermark };
};
