'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProductById, Product, updateProduct } from '@/lib/firebase/products';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/lib/firebase/firebase';

interface EditProductPageProps {
  params: { id: string };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const storage = getStorage(app);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const prod = await getProductById(params.id);
      if (!prod) {
        alert('Producto no encontrado');
        router.push('/admin/products');
        return;
      }
      setProduct(prod);
      setName(prod.name);
      setPrice(prod.price.toString());
      setHeightCm(prod.heightCm?.toString() || '');
      setDescription(prod.description || '');
      setImageUrls(prod.imageUrls || []);
      setLoading(false);
    }
    fetchProduct();
  }, [params.id, router]);

  // Drag & Drop handlers nativos
  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necesario para permitir drop
  };

  const onDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    setImageUrls(prev => {
      const newList = [...prev];
      const draggedItem = newList.splice(draggedIndex, 1)[0];
      newList.splice(index, 0, draggedItem);
      return newList;
    });
    setDraggedIndex(null);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(prev => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setUploading(true);
    const files = Array.from(e.target.files);

    try {
      const uploadPromises = files.map(async (file) => {
        const storageRef = ref(storage, `products/${params.id}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Error subiendo imagenes:', error);
      alert('Error subiendo imágenes');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSave() {
    if (!name || !price) {
      alert('Nombre y precio son obligatorios');
      return;
    }

    const priceNum = parseFloat(price);
    const heightNum = heightCm ? parseInt(heightCm) : undefined;

    if (isNaN(priceNum)) {
      alert('Precio inválido');
      return;
    }

    setSaving(true);
    try {
      await updateProduct(params.id, {
        name,
        price: priceNum,
        heightCm: heightNum,
        description,
        imageUrls,
      });
      alert('Producto actualizado');
      router.push('/admin/products');
    } catch (e) {
      alert('Error al actualizar');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Cargando producto...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold mb-6">Editar producto</h1>

      <label className="block mb-2 font-semibold">Nombre</label>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      <label className="block mb-2 font-semibold">Precio (S/.)</label>
      <input
        type="number"
        step="0.01"
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      <label className="block mb-2 font-semibold">Altura (cm)</label>
      <input
        type="number"
        value={heightCm}
        onChange={e => setHeightCm(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      <label className="block mb-2 font-semibold">Descripción</label>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
        rows={4}
      />

      <label className="block mb-2 font-semibold">Imágenes (ordena arrastrando)</label>
      <div className="flex gap-4 mb-4 overflow-x-auto p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        {imageUrls.map((url, index) => (
          <div
            key={url + index}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(index)}
            className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden shadow-sm cursor-move flex-shrink-0 bg-white flex items-center justify-center"
          >
            <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveImage(index);
              }}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
              title="Eliminar imagen"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="p-2 border rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploading && <span className="ml-2 text-gray-600">Subiendo...</span>}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || uploading}
        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
