/* Rostros — utilidades compartidas de reconocimiento facial (No'j Studio)
   Todo corre en el navegador con face-api (vladmandic). Nada se sube a ningún servidor. */
(function () {
  const MODELOS = new URL('models/', document.currentScript.src).href;
  const cargados = {};

  async function cargar(nombres) {
    await faceapi.tf.ready();
    for (const n of nombres) {
      if (cargados[n]) { await cargados[n]; continue; }
      cargados[n] = faceapi.nets[n].loadFromUri(MODELOS);
      await cargados[n];
    }
  }

  // Dibuja un File/Blob en un canvas respetando la orientación EXIF y con tamaño máximo.
  async function aCanvas(fuente, maxLado) {
    let bmp;
    try { bmp = await createImageBitmap(fuente, { imageOrientation: 'from-image' }); }
    catch (e) { bmp = await createImageBitmap(fuente); }
    const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    if (bmp.close) bmp.close();
    return c;
  }

  // Detección para indexar fotos del evento (SSD: mejor para rostros chicos en grupos)
  async function rostrosDeFoto(canvas, minConfianza) {
    await cargar(['ssdMobilenetv1', 'faceLandmark68Net', 'faceRecognitionNet']);
    const opts = new faceapi.SsdMobilenetv1Options({ minConfidence: minConfianza || 0.4, maxResults: 40 });
    const r = await faceapi.detectAllFaces(canvas, opts).withFaceLandmarks().withFaceDescriptors();
    return r.map(d => ({ descriptor: d.descriptor, box: d.detection.box, score: d.detection.score }));
  }

  // Detección para la selfie: rostro más grande. Primero el detector ligero; si falla, SSD.
  async function unRostro(canvas, conSsd) {
    const opts = conSsd ? new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 })
                        : new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.45 });
    const r = await faceapi.detectAllFaces(canvas, opts).withFaceLandmarks().withFaceDescriptors();
    if (!r.length) return null;
    r.sort((a, b) => b.detection.box.area - a.detection.box.area);
    return r[0].descriptor;
  }
  function espejo(c) {
    const m = document.createElement('canvas'); m.width = c.width; m.height = c.height;
    const x = m.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return m;
  }
  // Devuelve [descriptor, descriptorEspejo]: muchas cámaras frontales guardan la selfie en espejo
  async function rostroDeSelfie(canvas, alAvanzar) {
    alAvanzar && alAvanzar('Cargando reconocimiento…');
    await cargar(['tinyFaceDetector', 'faceLandmark68Net', 'faceRecognitionNet']);
    alAvanzar && alAvanzar('Analizando tu selfie…');
    let ssd = false, d = await unRostro(canvas, false);
    if (!d) {
      alAvanzar && alAvanzar('Buscando tu rostro con más detalle…');
      await cargar(['ssdMobilenetv1']); ssd = true;
      d = await unRostro(canvas, true);
    }
    if (!d) return null;
    const e = await unRostro(espejo(canvas), ssd);
    return e ? [d, e] : [d];
  }

  // Cuantización int8 + base64 para que el índice pese poco
  function codificar(desc, escala) {
    const b = new Int8Array(desc.length);
    for (let i = 0; i < desc.length; i++) b[i] = Math.max(-127, Math.min(127, Math.round(desc[i] * escala)));
    let s = ''; const u = new Uint8Array(b.buffer);
    for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    return btoa(s);
  }
  function decodificar(b64, escala) {
    const s = atob(b64); const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    const b = new Int8Array(u.buffer); const f = new Float32Array(b.length);
    for (let i = 0; i < b.length; i++) f[i] = b[i] / escala;
    return f;
  }
  function distancia(a, b) {
    let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
  }

  window.Rostros = { cargar, aCanvas, rostrosDeFoto, rostroDeSelfie, codificar, decodificar, distancia, ESCALA: 200 };
})();
