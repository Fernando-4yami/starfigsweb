//src/components/Gallery.tsx
'use client';

import { useState } from 'react';

interface GalleryProps {
  imageUrls: string[];
  productName: string;
}

export default function Gallery({ imageUrls, productName }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (imageUrls.length === 0) {
    return <div>No hay imágenes disponibles</div>;
  }

  const prevImage = () => {
    setCurrentIndex((i) => (i === 0 ? imageUrls.length - 1 : i - 1));
  };

  const nextImage = () => {
    setCurrentIndex((i) => (i === imageUrls.length - 1 ? 0 : i + 1));
  };

  return (
    <div>
      {/* Imagen principal */}
      <div className="relative w-full h-96 md:h-[400px]">
        <img
          src={imageUrls[currentIndex]}
          alt={`${productName} imagen ${currentIndex + 1}`}
          className="object-contain w-full h-full rounded-md"
        />

        {/* Flechas - ejemplo simple */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
        >
          ‹
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2"
        >
          ›
        </button>
      </div>

      {/* Miniaturas debajo */}
      <div className="flex gap-2 mt-4 overflow-x-auto">
        {imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`${productName} miniatura ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
            className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${
              index === currentIndex ? 'border-amber-500' : 'border-transparent'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
