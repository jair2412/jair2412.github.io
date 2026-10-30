import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const SITIO = '_site'   // carpeta que genera scripts/armar-sitio.sh
let doc                 // documento HTML parseado, compartido por las pruebas

// beforeAll: corre una vez antes de todas las pruebas.
// Lee _site/index.html y lo convierte en un DOM consultable con jsdom.
beforeAll(() => {
  const html = readFileSync(`${SITIO}/index.html`, 'utf-8')
  doc = new JSDOM(html).window.document
})

describe('index.html', () => {
  // Verifica que el <title> no esté vacío
  it('tiene un título', () => {
    expect(doc.title.trim()).not.toBe('')
  })

  // Verifica que el h1 contenga mi nombre
  it('muestra mi nombre en el h1', () => {
    expect(doc.querySelector('h1')?.textContent).toContain('Jair Alegria Medina')
  })

  // Busca imágenes sin alt (accesibilidad); debe haber 0
  it('todas las imágenes tienen texto alternativo', () => {
    const sinAlt = [...doc.querySelectorAll('img')].filter((img) => !img.getAttribute('alt'))
    expect(sinAlt).toHaveLength(0)
  })

  // Comprueba que cada script/css/img local referenciado exista en _site/
  it('los archivos locales que usa la página existen', () => {
    const rutas = [...doc.querySelectorAll('script[src], link[rel="stylesheet"], img[src]')]
      .map((el) => el.getAttribute('src') ?? el.getAttribute('href'))
      .filter((ruta) => !/^(https?:)?\/\//.test(ruta))   // ignora recursos de Internet
    for (const ruta of rutas) {
      expect(existsSync(`${SITIO}/${ruta}`), `falta ${ruta}`).toBe(true)
    }
  })

  // ---------- 5 PRUEBAS PROPIAS ----------

  // 1. La página declara el idioma español
  it('declara lang="es"', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('es')
  })

  // 2. Existe la etiqueta meta charset
  it('declara el charset', () => {
    expect(doc.querySelector('meta[charset]')).not.toBeNull()
  })

  // 3. Existe la etiqueta viewport (diseño responsive)
  it('declara la etiqueta viewport', () => {
    expect(doc.querySelector('meta[name="viewport"]')).not.toBeNull()
  })

  // 4. Hay exactamente un h1
  it('tiene un solo h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1)
  })

  // 5. El sitio no apunta a localhost ni a rutas de mi máquina
  it('no apunta a localhost', () => {
    expect(doc.documentElement.innerHTML).not.toContain('localhost')
  })
})

describe('el sitio que se publica', () => {
  // Verifica que ningún archivo interno del repo termine publicado
  it('no incluye archivos internos del repositorio', () => {
    for (const interno of ['compose.yaml', '.env.example', 'api', 'db', 'web', 'tests']) {
      expect(existsSync(`${SITIO}/${interno}`), `${interno} no debería publicarse`).toBe(false)
    }
  })
})
