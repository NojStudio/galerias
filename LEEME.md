# Galerías No'j: búsqueda por selfie

Es una galería de eventos con la marca del cliente y de No'j. El invitado escanea un QR, se toma una selfie y ve todas las fotos donde aparece, listas para guardar. El reconocimiento facial corre **en el teléfono del invitado**: no hay servidor, no hay AWS y la selfie nunca se sube a ningún lado.

```
galerias/
├── _lib/            motor (face-api, modelos, fuentes): no se toca
├── admin/           indexador para preparar cada evento
├── casa1916-casino/   galería del evento (cópiala y renómbrala para otros eventos)
│   ├── config.js    ← lo único que se edita por evento
│   ├── assets/      logo del cliente (opcional)
│   ├── data/        índice de fotos y rostros (lo genera el admin)
│   └── fotos/       versiones web y miniaturas (las genera el admin)
├── index.html       redirige a la web de No'j
└── .nojekyll        necesario para GitHub Pages (no lo borres)
```

---

## 1. Antes del evento (una sola vez, ~15 min)

1. **Crea un repo nuevo en GitHub**, llamado `galerias`, en la cuenta de nojstudio y público. Va separado del repo de la web porque cada evento suma cientos de MB y GitHub Pages tiene un límite de 1 GB por sitio.
2. Sube todo el contenido de esta carpeta al repo con GitHub Desktop: *Clone*, copias los archivos, *Commit* y *Push*.
3. En el repo, ve a **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. En 1-2 minutos quedan arriba estas URLs:
   - Galería: `https://nojstudio.github.io/galerias/casa1916-casino/`
   - Admin: `https://nojstudio.github.io/galerias/admin/`
5. Edita `casa1916-casino/config.js` con el nombre del evento, el cliente, la fecha y el día en que estarán listas las fotos. Si hay logo del cliente, ponlo en `assets/` (PNG o SVG claro con fondo transparente) y escribe su ruta en `logoCliente`. Haz push.
6. Abre la galería. Mientras no haya fotos, muestra **"Tus fotos vienen en camino"** con la fecha.
7. Abre el **admin**, sección 04, y genera la **tarjeta QR** (10×15 cm, PNG). Imprímela para ponerla junto al backdrop o en las mesas. Escanéala con tu cel antes de imprimir.

> ⚠️ El link del QR queda fijo. Si renombras la carpeta del evento, tienes que regenerar el QR.

## 2. Después del evento (flujo con GitHub Desktop)

1. Abre GitHub Desktop, selecciona el repo `galerias` y haz **Fetch origin → Pull** para bajar los últimos cambios.
2. Exporta de Lightroom las fotos seleccionadas en JPG, con el lado largo de 2500 px o más.
3. Abre **https://nojstudio.github.io/galerias/admin/** en **Chrome o Edge**. No uses el navegador integrado de Claude.
4. **01**: haz clic en **Elegir carpeta** y selecciona `Documentos\GitHub\galerias\casa1916-casino`.
   - Si sale el error en rojo, usa **"Sin carpeta: descargar .zip al final"**. Al terminar, descomprime el .zip **dentro** de `casa1916-casino`, reemplazando lo que pida.
5. **02**: elige las fotos. **03**: Procesar, con la *Detección fina* activada.
6. En GitHub Desktop vas a ver los cambios en `casa1916-casino/data` y `casa1916-casino/fotos`. Haz **Commit to main** y después **Push origin**.
7. Espera 1-2 min y prueba con una selfie en el link del QR.

> No subas las fotos arrastrándolas a github.com: la web aplana las carpetas y quedan fuera de su lugar.

## 3. Para un evento nuevo

Copia la carpeta `casa1916-casino`, renómbrala (por ejemplo `boda-ana-luis`), vacía `data/` y `fotos/`, edita `config.js` y genera un QR nuevo.

---

## Cómo funciona la búsqueda

- Para cada foto del evento se guarda una "huella" de 128 números por rostro (`data/rostros.json`, ~170 bytes por rostro). Las fotos no se analizan de nuevo en el teléfono.
- La selfie se analiza en el navegador del invitado, tanto en su versión normal como en espejo, porque muchas cámaras frontales guardan la foto invertida. Luego se compara contra las huellas.
- **Tus fotos**: distancia < `umbral` (0.45).
- **¿También eres tú?**: entre 0.45 y `umbralPosible` (0.53). Si no hay ninguna coincidencia clara, se muestran las 8 más parecidas.
- Para ser más estricto, baja los umbrales en `config.js`. Para encontrar más fotos, súbelos un poco (0.48 / 0.56), aunque aumenta el riesgo de que aparezcan fotos de otras personas.
- La primera búsqueda descarga ~7 MB de modelos, que se cargan en segundo plano en cuanto se abre la página. Las siguientes búsquedas son inmediatas.

## Guardar fotos

- **iPhone y Android**: el botón abre el menú de compartir y ahí se elige *Guardar imagen*. Con **Guardar mis N fotos** se guardan todas de un jalón.
- **Computadora**: las fotos se descargan directo como `casa1916-casino-noj-XXXX.jpg`. El prefijo se cambia en `config.js`.

## Notas

- Las fotos quedan públicas para quien tenga el link. La página tiene `noindex` para que no aparezca en Google.
- Sirve para eventos de hasta unas 1,500 fotos. Si un evento es más grande, conviene mover las fotos a Cloudflare R2.
- Para probarlo en local necesitas un servidor, porque abrir el `index.html` con doble clic no funciona. Desde esta carpeta corre `python -m http.server` y abre `http://localhost:8000/casa1916-casino/`.
