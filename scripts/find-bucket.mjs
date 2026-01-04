import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(
  readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

async function findBucket() {
  console.log('🔍 BUSCANDO BUCKET REAL...\n')
  
  const bucketsToTry = [
    'starfigs-29d31',
    'starfigs-29d31.appspot.com',
    'starfigs-29d31.firebasestorage.app',
  ]
  
  for (const bucketName of bucketsToTry) {
    try {
      console.log(`📦 Probando: ${bucketName}`)
      const bucket = admin.storage().bucket(bucketName)
      const [exists] = await bucket.exists()
      
      if (exists) {
        console.log(`   ✅ ¡ENCONTRADO!`)
        
        // Obtener metadata
        const [metadata] = await bucket.getMetadata()
        console.log(`   📋 Nombre: ${metadata.name}`)
        console.log(`   📋 ID: ${metadata.id}`)
        console.log(`   📋 Ubicación: ${metadata.location}`)
        
        // Contar archivos
        const [files] = await bucket.getFiles({ maxResults: 1 })
        console.log(`   📋 Tiene archivos: ${files.length > 0 ? 'Sí' : 'No'}`)
        
        console.log('\n🎯 ESTE ES TU BUCKET CORRECTO:\n')
        console.log(`   storageBucket: "${bucketName}"\n`)
        
        return bucketName
      } else {
        console.log(`   ❌ No existe`)
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n⚠️ No se encontró ningún bucket')
}

findBucket()