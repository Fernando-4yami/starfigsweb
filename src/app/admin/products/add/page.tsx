'use client';

import React, { useState } from 'react';
import { productsService } from '@/lib/firebase/products';

export default function AddProductPage() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      alert('Por favor selecciona una imagen');
      return;
    }

    try {
      const imageUrl = await productsService.uploadImage(imageFile);
      await productsService.addProduct({
        name,
        price: Number(price),
        description,
        category,
        brand,
        stock: Number(stock),
        imageUrl,
      });

      alert('Producto agregado con éxito');
      // Limpiar formulario
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setBrand('');
      setStock('');
      setImageFile(null);
    } catch (error) {
      console.error(error);
      alert('Error al agregar producto');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto' }}>
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Precio"
        value={price}
        onChange={e => setPrice(e.target.value)}
        required
      />
      <textarea
        placeholder="Descripción"
        value={description}
        onChange={e => setDescription(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Categoría"
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Marca"
        value={brand}
        onChange={e => setBrand(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Stock"
        value={stock}
        onChange={e => setStock(e.target.value)}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={e => {
          if (e.target.files) setImageFile(e.target.files[0]);
        }}
        required
      />
      <button type="submit">Agregar Producto</button>
    </form>
  );
}
