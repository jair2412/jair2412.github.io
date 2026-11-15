# LAB-06: Modernizar un sitio web con IA generativa en Google Cloud

Lab: *Modernize your Website with Generative AI on Google Cloud* (Google Skills), proyecto `qwiklabs-gcp-01-3966f0110668`, región `us-west1`, 15/11/2026.

## Evidencia por punto de control

| Punto de control | Estado | Captura |
|------------------|--------|---------|
| 1. API de Agent Platform habilitada | ✅ `gcloud services enable aiplatform.googleapis.com` | entra con el puntaje final |
| 2. App de Agent Search creada | ✅ `my-search-app` con el data store `my-data-store_1794780247683` (carpeta `blog_posts`) | [agent-search-preview.png](evidencia/agent-search-preview.png) |
| 3. Sitio desplegado en Cloud Run | ✅ `webmod-svc` en https://webmod-svc-494264845730.us-west1.run.app, respondiendo la pregunta y la de seguimiento sobre ETFs | [cloud-run.png](evidencia/cloud-run.png) |
| 4. Contenido editado con IA | ❌ Falla del lab: el proyecto bloquea los modelos de Gemini que el propio lab indica | [error-modelo-imagen.png](evidencia/error-modelo-imagen.png), [error-modelo-texto.png](evidencia/error-modelo-texto.png), [modelos-imagen-bloqueados.png](evidencia/modelos-imagen-bloqueados.png), [modelos-texto-bloqueados.png](evidencia/modelos-texto-bloqueados.png) |

## Qué pasó en la Tarea 6

El lab indica usar `gemini-3.6-flash` (texto) y `gemini-3.1-flash-image` (imágenes). Con el sitio ya desplegado:

- **Generar imagen** (`POST /imagen/api/generate-images`, 23:01): respondió `500`. En los logs de Cloud Run, Vertex AI devuelve `400 FAILED_PRECONDITION: Organization Policy constraint constraints/vertexai.allowedModels violated ... disallowed Gen AI model gemini-3.1-flash-image`.
- **Traducir** (`POST /vertex-llm/ai-translate-inline`, 23:10 y 23:10:50): el sitio mostró *Error refining text*, con el mismo error para `gemini-3.6-flash`.
- Para descartar un error de configuración, llamé directo a la API de Vertex AI (`generateContent`) desde Cloud Shell con otros modelos:
  - Imagen: `gemini-3.1-flash-image` y `gemini-2.5-flash-image` bloqueados por `allowedModels`; `gemini-2.5-flash-image-preview` y `gemini-3-pro-image-preview` no disponibles.
  - Texto: `gemini-3.6-flash`, `gemini-2.5-flash` y `gemini-2.5-pro` bloqueados por `allowedModels`; `gemini-2.0-flash` no disponible.

Es la política de organización del proyecto temporal del lab, que no se puede leer ni cambiar con la cuenta de estudiante (`PERMISSION_DENIED`). Sin un modelo permitido no se pueden hacer la imagen, la traducción ni el *Refine Text*, y por eso tampoco existe un `REFINE_PROMPT` que buscar en Logs Explorer.

## Bitácora

- **Reinicio del lab.** La primera vez el lab se cerró a mitad de camino y el proyecto cambió. Al volver, `gcloud run deploy` falló en `us-central1` por la política `gcp.resourceLocations`; consulté la política efectiva y la región permitida de este proyecto era `us-west1`. También tuve que actualizar `config.toml` con el proyecto, los buckets y el ID del data store nuevos (el de la primera vez apuntaba a un proyecto que ya no existía).
- **Cómo funciona la búsqueda.** El sitio no busca por su cuenta: `routers/vertex_search.py` llama a la API de Discovery Engine con la ruta `projects/{project_id}/locations/global/collections/default_collection/dataStores/{datastore_id}`, y Agent Search responde con un resumen generado a partir de los HTML de `blog_posts` (RAG gestionado por Google) más los enlaces a los artículos.
- **La respuesta sobre ETFs.** La pregunta de seguimiento respondió que las fuentes no dicen nada concreto sobre ETFs: el modelo se limita a lo que hay en los documentos importados en lugar de inventar.
