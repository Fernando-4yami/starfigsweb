import admin from 'firebase-admin'
import { readFileSync } from 'fs'

// Cargar credenciales
const serviceAccount = JSON.parse(
  readFileSync('./lib/firebase/serviceAccountKey.json', 'utf8')
)

// ✅ Inicializar con tu bucket REAL (sin .appspot.com)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'starfigs-29d31' // ← SIN .appspot.com
})

const bucket = admin.storage().bucket()

async function fixEverything() {
  console.log('🔧 REPARANDO STORAGE COMPLETO...\n')
  
  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión...')
    console.log('   Bucket configurado:', bucket.name)
    const [exists] = await bucket.exists()
    
    if (!exists) {
      console.log('   ❌ Bucket no encontrado con nombre:', bucket.name)
      console.log('\n💡 Intentando variantes...')
      
      // Intentar con .appspot.com por si acaso
      const bucketAlt = admin.storage().bucket('starfigs-29d31.appspot.com')
      const [existsAlt] = await bucketAlt.exists()
      
      if (existsAlt) {
        console.log('   ✅ Encontrado como: starfigs-29d31.appspot.com')
        console.log('\n   ⚠️ IMPORTANTE: Tu bucket real es starfigs-29d31.appspot.com')
        console.log('   Actualiza todos tus archivos con este nombre')
        return
      }
      
      throw new Error('No se pudo encontrar el bucket con ningún nombre')
    }
    
    console.log('   ✅ Conectado a:', bucket.name)
    
    // 2. Configurar política IAM pública
    console.log('\n2️⃣ Configurando acceso público...')
    try {
      await bucket.makePublic()
      console.log('   ✅ Bucket ahora es público')
    } catch (e) {
      console.log('   ⚠️ Error:', e.message)
      
      // Intentar con IAM policy
      try {
        const [policy] = await bucket.iam.getPolicy()
        
        // Agregar allUsers con rol objectViewer
        const newBinding = {
          role: 'roles/storage.objectViewer',
          members: ['allUsers']
        }
        
        const existingBinding = policy.bindings?.find(
          b => b.role === 'roles/storage.objectViewer'
        )
        
        if (existingBinding) {
          if (!existingBinding.members?.includes('allUsers')) {
            existingBinding.members = [...(existingBinding.members || []), 'allUsers']
          }
        } else {
          policy.bindings = [...(policy.bindings || []), newBinding]
        }
        
        await bucket.iam.setPolicy(policy)
        console.log('   ✅ Política IAM actualizada')
      } catch (iamError) {
        console.log('   ⚠️ No se pudo actualizar IAM:', iamError.message)
      }
    }
    
    // 3. Hacer públicos todos los archivos existentes
    console.log('\n3️⃣ Procesando archivos existentes...')
    const [files] = await bucket.getFiles()
    console.log(`   📦 Encontrados: ${files.length} archivos`)
    
    if (files.length === 0) {
      console.log('   ⚠️ No hay archivos para procesar')
    } else {
      let successCount = 0
      let errorCount = 0
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        try {
          await file.makePublic()
          successCount++
          
          if ((i + 1) % 25 === 0 || i === files.length - 1) {
            console.log(`   📊 Progreso: ${i + 1}/${files.length}`)
          }
        } catch (error) {
          errorCount++
          if (errorCount <= 3) {
            console.log(`   ⚠️ Error en: ${file.name}`)
          }
        }
      }
      
      console.log(`\n   ✅ Públicos: ${successCount}`)
      if (errorCount > 0) {
        console.log(`   ⚠️ Errores: ${errorCount}`)
      }
      
      // 4. Test final con primera imagen
      console.log('\n4️⃣ Verificando configuración...')
      const testFile = files[0]
      
      // Construir URL correcta para tu bucket
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${testFile.name}`
      
      console.log('\n📸 URL de prueba:')
      console.log(`   ${publicUrl}`)
      console.log('\n   👉 Abre esta URL en tu navegador para verificar')
    }
    
    // 5. Configurar CORS
    console.log('\n5️⃣ Configurando CORS...')
    try {
      await bucket.setCorsConfiguration([
        {
          maxAgeSeconds: 3600,
          method: ['GET', 'HEAD', 'OPTIONS'],
          origin: ['*'],
          responseHeader: ['Content-Type', 'Access-Control-Allow-Origin']
        }
      ])
      console.log('   ✅ CORS configurado')
    } catch (e) {
      console.log('   ⚠️ CORS:', e.message)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ¡STORAGE CONFIGURADO!')
    console.log('='.repeat(60))
    console.log('\n📋 Nombre del bucket: ' + bucket.name)
    console.log('📋 Total archivos: ' + files.length)
    console.log('\n🔄 Ahora actualiza tu código con el bucket correcto\n')
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message)
    console.error('\nStack:', error.stack)
  }
}

fixEverything()