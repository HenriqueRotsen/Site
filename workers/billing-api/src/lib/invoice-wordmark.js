import wordmarkData from '../../assets/wordmark-branca.png';

function normalizeImageBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === 'string') {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  throw new Error('Formato de imagem inválido.');
}

let cachedWordmarkBytes = null;

export function getInvoiceWordmarkBytes(overrideBytes) {
  if (overrideBytes) return normalizeImageBytes(overrideBytes);
  if (!cachedWordmarkBytes) cachedWordmarkBytes = normalizeImageBytes(wordmarkData);
  return cachedWordmarkBytes;
}
