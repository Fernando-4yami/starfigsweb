import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'starfigs-29d31'
})

const db = admin.firestore()

// Función para convertir URL antigua a nueva
function convertUrl(oldUrl) {
  if (!oldUrl) return oldUrl
  
  // Si ya está en el formato correcto, no hacer nada
  if (oldUrl.includes('storage.googleapis.com/starfigs-29d31/')) {
    return oldUrl
  }
  
  // Extraer el path del archivo
  let filePath = ''
  
  // Formato: firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?alt=media
  if (oldUrl.includes('firebasestorage.googleapis.com')) {
    const match = oldUrl.match(/\/o\/(.+?)(\?|$)/)
    if (match) {
      filePath = decodeURIComponent(match[1])
    }
  }
  
  // Formato: storage.googleapis.com/BUCKET/PATH
  if (oldUrl.includes('storage.googleapis.com') && !filePath) {
    const match = oldUrl.match(/storage\.googleapis\.com\/[^\/]+\/(.+)/)
    if (match) {
      filePath = match[1]
    }
  }
  
  if (!filePath) {
    console.warn('⚠️ No se pudo parsear URL:', oldUrl)
    return oldUrl
  }
  
  // Nueva URL correcta
  return `https://storage.googleapis.com/starfigs-29d31/${filePath}`
}

async function updateImageUrls() {
  console.log('🔄 ACTUALIZANDO URLs DE IMÁGENES...\n')
  
  try {
    const productsRef = db.collection('products')
    const snapshot = await productsRef.get()
    
    console.log(`📦 Encontrados ${snapshot.size} productos\n`)
    
    let updatedCount = 0
    let unchangedCount = 0
    
    for (const doc of snapshot.docs) {
      const data = doc.data()
      let needsUpdate = false
      const updates = {}
      
      // Actualizar imageUrls[]
      if (data.imageUrls && Array.isArray(data.imageUrls)) {
        const newImageUrls = data.imageUrls.map(url => {
          const newUrl = convertUrl(url)
          if (newUrl !== url) needsUpdate = true
          return newUrl
        })
        if (needsUpdate) {
          updates.imageUrls = newImageUrls
        }
      }
      
      // Actualizar thumbnailUrl
      if (data.thumbnailUrl) {
        const newThumbnailUrl = convertUrl(data.thumbnailUrl)
        if (newThumbnailUrl !== data.thumbnailUrl) {
          updates.thumbnailUrl = newThumbnailUrl
          needsUpdate = true
        }
      }
      
      // Actualizar galleryThumbnailUrls[]
      if (data.galleryThumbnailUrls && Array.isArray(data.galleryThumbnailUrls)) {
        const newGalleryUrls = data.galleryThumbnailUrls.map(url => {
          const newUrl = convertUrl(url)
          if (newUrl !== url) needsUpdate = true
          return newUrl
        })
        if (needsUpdate) {
          updates.galleryThumbnailUrls = newGalleryUrls
        }
      }
      
      if (needsUpdate) {
        await doc.ref.update(updates)
        updatedCount++
        console.log(`✅ Actualizado: ${data.name}`)
      } else {
        unchangedCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log(`🎉 Proceso completado`)
    console.log(`✅ Actualizados: ${updatedCount}`)
    console.log(`➖ Sin cambios: ${unchangedCount}`)
    console.log('='.repeat(50) + '\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateImageUrls()