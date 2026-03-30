import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const inputPath = path.join(rootDir, 'docs', 'architecture-guide.md');
const outputPath = path.join(rootDir, 'Campus-Spots-Architecture-Guide.pdf');

const rawMarkdown = fs.readFileSync(inputPath, 'utf8');

function normalizeLine(line) {
  return line
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^###\s+/g, '')
    .replace(/^##\s+/g, '')
    .replace(/^#\s+/g, '')
    .trimEnd();
}

function markdownToPlainText(markdown) {
  const lines = markdown.split('\n');
  const output = [];

  for (const originalLine of lines) {
    const line = normalizeLine(originalLine);

    if (originalLine.startsWith('# ')) {
      output.push(line.toUpperCase());
      output.push('');
      continue;
    }

    if (originalLine.startsWith('## ')) {
      output.push(line.toUpperCase());
      output.push('');
      continue;
    }

    if (originalLine.startsWith('### ')) {
      output.push(line);
      output.push('');
      continue;
    }

    if (/^\d+\.\s+/.test(originalLine)) {
      output.push(line);
      continue;
    }

    if (originalLine.startsWith('- ')) {
      output.push(`- ${line.slice(2)}`);
      continue;
    }

    output.push(line);
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function wrapParagraph(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function layoutText(text) {
  const maxChars = 92;
  const laidOut = [];

  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) {
      laidOut.push('');
      continue;
    }

    if (/^[A-Z0-9][A-Z0-9 .:()/-]{3,}$/.test(rawLine.trim())) {
      laidOut.push(rawLine.trim());
      laidOut.push('');
      continue;
    }

    if (/^-\s+/.test(rawLine)) {
      const bulletText = rawLine.replace(/^-\s+/, '');
      const wrapped = wrapParagraph(bulletText, maxChars - 2);
      wrapped.forEach((line, index) => {
        laidOut.push(index === 0 ? `- ${line}` : `  ${line}`);
      });
      continue;
    }

    if (/^\d+\.\s+/.test(rawLine)) {
      const match = rawLine.match(/^(\d+\.)\s+(.*)$/);
      const prefix = match[1];
      const body = match[2];
      const wrapped = wrapParagraph(body, maxChars - prefix.length - 1);
      wrapped.forEach((line, index) => {
        laidOut.push(index === 0 ? `${prefix} ${line}` : `${' '.repeat(prefix.length + 1)}${line}`);
      });
      continue;
    }

    laidOut.push(...wrapParagraph(rawLine.trim(), maxChars));
  }

  return laidOut;
}

function escapePdfText(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPdf(lines) {
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 54;
  const top = 756;
  const lineHeight = 14;
  const bottomMargin = 54;
  const usableLines = Math.floor((top - bottomMargin) / lineHeight);
  const pages = [];

  for (let i = 0; i < lines.length; i += usableLines) {
    pages.push(lines.slice(i, i + usableLines));
  }

  const objects = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  const contentIds = [];

  for (const pageLines of pages) {
    const commands = ['BT', `/F1 11 Tf`, `${left} ${top} Td`, `${lineHeight} TL`];
    for (const line of pageLines) {
      commands.push(`(${escapePdfText(line)}) Tj`);
      commands.push('T*');
    }
    commands.push('ET');

    const stream = commands.join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
    contentIds.push(contentId);

    const pageId = addObject('');
    pageIds.push(pageId);
  }

  const kids = pageIds.map((id) => `${id} 0 R`).join(' ');
  const pagesId = addObject(`<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`);

  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

const plainText = markdownToPlainText(rawMarkdown);
const laidOutLines = layoutText(plainText);
const pdfData = buildPdf(laidOutLines);

fs.writeFileSync(outputPath, pdfData, 'binary');
console.log(`Created ${path.basename(outputPath)}`);
