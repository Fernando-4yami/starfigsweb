import { getManufacturers } from "@/lib/firebase/manufacturers";
import Link from "next/link";

export default async function FabricantesPage() {
  const manufacturers = await getManufacturers(); // Obtiene datos de Firebase

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Fabricantes</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {manufacturers.map((m) => (
          <Link 
            key={m.id} 
            href={`/fabricantes/${m.slug}`}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <img 
              src={m.logo} 
              alt={m.name}
              className="h-20 mx-auto object-contain mb-2"
            />
            <h2 className="text-center font-medium">{m.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
