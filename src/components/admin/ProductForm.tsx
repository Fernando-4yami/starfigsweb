'use client';

import { useState } from 'react';
import { addProduct } from '@/lib/firebase/products';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

interface Props {
  onSuccess: () => void;
}

export default function ProductForm({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isNewRelease, setIsNewRelease] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      // Convierto FileList a array
      setImageFiles(Array.from(e.target.files));
    }
  };

  const validateForm = () => {
    if (!name.trim()) return 'El nombre es obligatorio.';
    if (!price.trim()) return 'El precio es obligatorio.';
    if (isNaN(Number(price)) || Number(price) <= 0) return 'El precio debe ser un número positivo.';
    if (imageFiles.length === 0) return 'Por favor selecciona al menos una imagen.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Subir todas las imágenes a Firebase Storage y obtener URLs
      const uploadPromises = imageFiles.map(async (file) => {
        const imageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Guardar producto en Firestore con arreglo de URLs y otros datos
      await addProduct({
        name: name.trim(),
        price: +price,
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        imageUrls,  // <-- ahora es un arreglo
        isNewRelease,
      });

      setSuccessMsg('Producto guardado con éxito.');

      // Limpiar formulario
      setName('');
      setPrice('');
      setDescription('');
      setBrand('');
      setImageFiles([]);
      setIsNewRelease(false);

      onSuccess();
    } catch (err) {
      console.error('Error guardando producto:', err);
      setError('Error al guardar el producto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-4 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-center">Agregar nuevo producto</h2>

      {error && <p className="text-red-600 text-center">{error}</p>}
      {successMsg && <p className="text-green-600 text-center">{successMsg}</p>}

      <div>
        <label className="block mb-1 font-medium" htmlFor="name">Nombre *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-amber-400"
          placeholder="Nombre del producto"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium" htmlFor="price">Precio (S/.) *</label>
        <input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={e => setPrice(e.target.value)}
          disabled={saving}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-amber-400"
          placeholder="Ejemplo: 99.99"
          required
        />
      </div>

      <div>
        <label className="block mb-1 font-medium" htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={saving}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-amber-400"
          placeholder="Descripción del producto (opcional)"
          rows={3}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium" htmlFor="brand">Marca</label>
        <input
          id="brand"
          type="text"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          disabled={saving}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-amber-400"
          placeholder="Marca (opcional)"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium" htmlFor="images">Imágenes * (puedes seleccionar varias)</label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          disabled={saving}
          className="w-full"
          required
        />
        {imageFiles.length > 0 && (
          <p className="mt-1 text-sm text-gray-700">
            Archivos seleccionados: {imageFiles.map(f => f.name).join(', ')}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="isNewRelease"
          type="checkbox"
          checked={isNewRelease}
          onChange={e => setIsNewRelease(e.target.checked)}
          disabled={saving}
          className="h-4 w-4"
        />
        <label htmlFor="isNewRelease" className="font-medium select-none">Nuevo lanzamiento</label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2 rounded transition"
      >
        {saving ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  );
}
