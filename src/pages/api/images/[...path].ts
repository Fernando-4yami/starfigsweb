// pages/api/images/[...path].ts

export default async function handler(req, res) {
  const pathArray = req.query.path as string[]; // Ej: ['products', '1_18604.jpg']
  const imagePath = pathArray.join('/');

  const firebaseToken = '380701b3-3ece-4854-8b98-275e77bbdb33'; // Usa el que corresponde o elimínalo si haces pública la imagen

  const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/starfigs-29d31/o/${encodeURIComponent(imagePath)}?alt=media&token=${firebaseToken}`;

  try {
    const response = await fetch(firebaseUrl);
    if (!response.ok) {
      return res.status(response.status).send("No se encontró la imagen");
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send("Error al obtener la imagen");
  }
}
