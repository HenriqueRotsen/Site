export function maskPhoneInput(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function maskCepInput(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function formatAddressLine(client) {
  const parts = [
    client.addressStreet,
    client.addressNumber ? `nº ${client.addressNumber}` : null,
    client.addressComplement,
    client.addressNeighborhood,
    client.addressCity && client.addressState
      ? `${client.addressCity} - ${client.addressState}`
      : client.addressCity || client.addressState,
    client.addressZip,
  ].filter(Boolean);
  return parts.join(', ');
}

export async function fetchCep(cep) {
  const digits = String(cep).replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      addressStreet: data.logradouro || '',
      addressNeighborhood: data.bairro || '',
      addressCity: data.localidade || '',
      addressState: data.uf || '',
    };
  } catch {
    return null;
  }
}
