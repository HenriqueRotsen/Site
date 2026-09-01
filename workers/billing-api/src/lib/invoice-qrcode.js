import qrcode from 'qrcode-generator';

export function qrCodeDataUrl(text, size = 120) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const cell = Math.max(2, Math.floor(size / count));
  const svgSize = count * cell;
  const rects = [];

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) continue;
      rects.push(`<rect x="${col * cell}" y="${row * cell}" width="${cell}" height="${cell}"/>`);
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" ` +
    `width="${size}" height="${size}" fill="#191919">${rects.join('')}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
