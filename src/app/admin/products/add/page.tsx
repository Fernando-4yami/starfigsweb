'use client';

import { useState, useEffect, useRef } from 'react';
import { addProduct } from '@/lib/firebase/products';
import { createLineIfNotExists } from '@/lib/firebase/lines';
import { createManufacturerIfNotExists } from '@/lib/firebase/manufacturers';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, Timestamp, db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';

// 🔹 Combobox personalizado
function Combobox({
  label,
  value,
  onChange,
  options,
  name,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  name: string;
  required?: boolean;
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setFilteredOptions(options);
    setShowOptions(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setFilteredOptions(options.filter(opt => opt.toLowerCase().includes(val.toLowerCase())));
  };

  const handleOptionClick = (option: string) => {
    onChange(option);
    setShowOptions(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block font-medium mb-1" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value}
        onFocus={handleFocus}
        onChange={handleInputChange}
        required={required}
        className="w-full border p-2 rounded"
        autoComplete="off"
      />
      {showOptions && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleOptionClick(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddProductPage() {
  const [form, setForm] = useState({
    name: '',
    price: '',
    heightCm: '',
    description: '',
    brand: '',
    line: '',
    releaseDate: '',
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'products'));
      const brandSet = new Set<string>();
      const lineSet = new Set<string>();

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.brand) brandSet.add(data.brand);
        if (data.line) lineSet.add(data.line);
      });

      setBrands([...brandSet].sort());
      setLines([...lineSet].sort());
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.brand || !form.line) {
      alert('Selecciona o escribe un fabricante y una línea');
      return;
    }

    if (!files || files.length === 0) {
      alert('Selecciona al menos una imagen');
      return;
    }

    if (form.name.trim().length < 3 || Number(form.price) <= 0) {
      alert('Nombre o precio inválido');
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
              console.error(error);
              alert('Error al subir imagen');
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

      const createdAt = Timestamp.now();
      const releaseDate = form.releaseDate
        ? Timestamp.fromDate(new Date(form.releaseDate))
        : null;

      const manufacturerDoc = await createManufacturerIfNotExists(form.brand);
      const lineDoc = await createLineIfNotExists(form.line, form.brand);

      await addProduct({
        name: form.name,
        price: Number(form.price),
        description: form.description,
        imageUrls: uploadedUrls,
        brand: manufacturerDoc.name,
        line: lineDoc.name,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        createdAt,
        releaseDate,
      });

      alert('Producto agregado con éxito');

      setForm({
        name: '',
        price: '',
        heightCm: '',
        description: '',
        brand: '',
        line: '',
        releaseDate: '',
      });
      setFiles(null);
      setUploadProgress(0);
    } catch (error) {
      console.error(error);
      alert('Error al agregar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Agregar Producto</h1>

      <div>
        <label className="block font-medium" htmlFor="name">Nombre</label>
        <input
          name="name"
          id="name"
          value={form.name}
          onChange={handleInputChange}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-medium" htmlFor="price">Precio</label>
        <input
          name="price"
          id="price"
          type="number"
          value={form.price}
          onChange={handleInputChange}
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-medium" htmlFor="heightCm">Altura (cm)</label>
        <input
          name="heightCm"
          id="heightCm"
          type="number"
          value={form.heightCm}
          onChange={handleInputChange}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block font-medium" htmlFor="description">Descripción</label>
        <textarea
          name="description"
          id="description"
          value={form.description}
          onChange={handleInputChange}
          className="w-full border p-2 rounded"
        />
      </div>

      <Combobox
        label="Fabricante"
        name="brand"
        value={form.brand}
        onChange={(val) => setForm({ ...form, brand: val })}
        options={brands}
        required
      />

      <Combobox
        label="Línea"
        name="line"
        value={form.line}
        onChange={(val) => setForm({ ...form, line: val })}
        options={lines}
        required
      />

      <div>
        <label htmlFor="releaseDate" className="block font-medium">Fecha de lanzamiento</label>
        <input
          name="releaseDate"
          id="releaseDate"
          type="date"
          value={form.releaseDate}
          onChange={handleInputChange}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="images" className="block font-medium">Imágenes</label>
        <input
          id="images"
          type="file"
          onChange={handleFileChange}
          multiple
          className="w-full"
        />
      </div>

      {uploadProgress > 0 && (
        <div className="text-sm text-gray-600">
          Subiendo imágenes: {Math.round(uploadProgress)}%
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Subiendo...' : 'Agregar producto'}
      </button>
    </form>
  );
}
