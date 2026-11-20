/**
 * Utility to compress and resize an image (File or Data URL)
 * Ensuring the final size is strictly under 500 KB (512,000 bytes).
 */
export async function compressImageToMax500KB(imageSource, maxDim = 800, maxSizeKB = 480) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maxDim
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively compress quality until under maxSizeKB (<= 500KB)
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let sizeInBytes = Math.round((dataUrl.length * 3) / 4);
      const maxSizeBytes = maxSizeKB * 1024;

      while (sizeInBytes > maxSizeBytes && quality > 0.2) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeInBytes = Math.round((dataUrl.length * 3) / 4);
      }

      console.log(`Image compressed: ${Math.round(sizeInBytes / 1024)} KB (Quality: ${quality.toFixed(1)}, ${width}x${height})`);
      resolve(dataUrl);
    };

    img.onerror = (err) => reject(new Error('Failed to load image for compression: ' + err));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(imageSource);
    } else {
      reject(new Error('Unsupported image source type'));
    }
  });
}
