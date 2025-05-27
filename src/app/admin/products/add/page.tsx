'use client';

import { useState } from 'react';
import { addProduct } from '@/lib/firebase/products';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Timestamp } from '@/lib/firebase/config'; // Importa Timestamp desde tu config

const manufacturers = [
  { id: '1', name: 'Bandai Spirits', value: 'Bandai Spirits' },
  { id: '2', name: 'Good Smile Company', value: 'Good Smile Company' },
  { id: '3', name: 'Taito', value: 'Taito' }
];

export default function AddProductPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isNewRelease, setIsNewRelease] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');  // Fecha opcional
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brand) {
      alert('Selecciona un fabricante');
      return;
    }

    if (!files || files.length === 0) {
      alert('Selecciona al menos una imagen');
      return;
    }

    if (name.trim().length < 3) {
      alert('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (Number(price) <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Error subiendo imagen:', error);
              alert('Error al subir la imagen');
              setLoading(false);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }

      // Convertir releaseDate a Timestamp si existe, sino usar Timestamp.now()
      const createdAtTimestamp = releaseDate
        ? Timestamp.fromDate(new Date(releaseDate))
        : Timestamp.now();

      await addProduct({
        name,
        price: Number(price),
        description,
        imageUrls: uploadedUrls,
        brand,
        isNewRelease,
        heightCm: heightCm ? Number(heightCm) : undefined,
        createdAt: createdAtTimestamp,
      });

      alert('Producto agregado con éxito');
      setName('');
      setPrice('');
      setHeightCm('');
      setDescription('');
      setBrand('');
      setFiles(null);
      setIsNewRelease(false);
      setReleaseDate('');
      setUploadProgress(0);
      setLoading(false);
    } catch (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar producto');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <label className="block">
        Nombre
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Precio
        <input
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
          min="0"
          step="0.01"
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Altura (cm)
        <input
          type="number"
          value={heightCm}
          onChange={e => setHeightCm(e.target.value)}
          placeholder="Ej. 17"
          min="0"
          step="0.1"
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Descripción
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Imágenes
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          multiple
          required
          className="w-full"
        />
      </label>

      {uploadProgress > 0 && (
        <p>Subiendo imagen: {uploadProgress.toFixed(0)}%</p>
      )}

      <label className="block">
        Fabricante
        <select
          value={brand}
          onChange={e => setBrand(e.target.value)}
          required
          className="w-full border p-2 rounded"
        >
          <option value="">Selecciona un fabricante</option>
          {manufacturers.map(m => (
            <option key={m.id} value={m.value}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        Fecha de lanzamiento (opcional)
        <input
          type="date"
          value={releaseDate}
          onChange={e => setReleaseDate(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isNewRelease}
          onChange={e => setIsNewRelease(e.target.checked)}
          className="w-4 h-4"
        />
        Nuevo Lanzamiento
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Agregar Producto'}
      </button>
    </form>
  );
}
