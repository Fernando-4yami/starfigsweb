"use client";

import { useState } from "react";

type ProductFormProps = {
  onSubmit: (data: any) => void;
};

export default function ProductForm({ onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    // ✅ Ya no usamos 'nuevo'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "precio" ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        placeholder="Nombre del producto"
        className="border p-2 w-full"
      />
      <textarea
        name="descripcion"
        value={formData.descripcion}
        onChange={handleChange}
        placeholder="Descripción"
        className="border p-2 w-full"
      />
      <input
        name="precio"
        value={formData.precio}
        onChange={handleChange}
        placeholder="Precio"
        type="number"
        className="border p-2 w-full"
      />
      {/* ✅ Eliminado: checkbox de 'nuevo lanzamiento' */}
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Guardar producto
      </button>
    </form>
  );
}
