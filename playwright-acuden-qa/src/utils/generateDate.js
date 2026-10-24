// generateData.js
import fs from 'fs'
import path from 'path'

//const nombres = ['Carlos', 'Maria', 'Jose', 'Ana', 'Luis', 'Carmen', 'Hector', 'Sofia', 'Javier', 'Elena']
//const apellidos = ['Rivera', 'Torres', 'Rodriguez', 'Santiago', 'Ortiz', 'Colon', 'Morales', 'Ramos', 'Cruz', 'Vazquez']
const pueblos = ['San Juan', 'Bayamon', 'Carolina', 'Ponce', 'Caguas', 'Guaynabo', 'Mayaguez', 'Arecibo', 'Trujillo Alto', 'Toa Baja']

// Helper para limpiar cualquier tilde o acento
const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Helpers para aleatoriedad
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const dataset = Array.from({ length: 1 }, (_, i) => {
  const index = i + 1
  const dia = String(randomInt(1, 30)).padStart(2, '0')
  const mes = String(randomInt(1, 12)).padStart(2, '0')
  const anio = randomInt(1975, 2025)

  return {
    id: index,
    //nombre: normalizar(randomElement(nombres)),
    //apellido: normalizar(randomElement(apellidos)),
    fechaNacimiento: `${dia}/${mes}/${anio}`,
    paisNacimiento: normalizar('Puerto Rico'),
    puebloNacimiento: normalizar(randomElement(pueblos)),
    puebloResidencia: normalizar(randomElement(pueblos)),
    //correoPrefix: `qa_${Date.now()}_${randomInt(1000, 9999)}_${index}`
  }
})

const outputPath = path.resolve('fixtures', 'solicitantes.json')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf-8')
console.log(`Generados ${dataset.length} registros en: ${outputPath}`)