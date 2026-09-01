import logoData from '../../assets/hr-cinza.png';

function normalizeLogoBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === 'string') {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  throw new Error('Formato de logo inválido.');
}

let cachedLogoBytes = null;

export function getInvoiceLogoBytes(overrideBytes) {
  if (overrideBytes) return normalizeLogoBytes(overrideBytes);
  if (!cachedLogoBytes) cachedLogoBytes = normalizeLogoBytes(logoData);
  return cachedLogoBytes;
}
