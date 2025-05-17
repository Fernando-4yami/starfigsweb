// /app/components/Figura.tsx
import React from 'react';

type FiguraProps = {
  imagen: string;
  nombre: string;
  precio?: number; // opcional si quieres mostrar precio después
};

const Figura: React.FC<FiguraProps> = ({ imagen, nombre, precio }) => {
  return (
    <div className="figura">
      <img src={imagen} alt={nombre} />
      <p>{nombre}</p>
      {precio && <p>S/ {precio.toFixed(2)}</p>}
    </div>
  );
};

export default Figura;
