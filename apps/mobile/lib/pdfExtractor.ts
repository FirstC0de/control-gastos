import * as FileSystem from 'expo-file-system';

/**
 * Extrae texto de un PDF dado su URI local (de expo-document-picker).
 * Usa pdfjs-dist con fake worker (sin Web Workers, compatible con RN/Hermes).
 */
export async function extractTextFromPDF(uri: string): Promise<string> {
    // Leer el archivo como base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    // Convertir base64 → Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    // Importar pdfjs con fake worker
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Agrupar items por posición Y para reconstruir líneas
        const itemsByY: Record<number, { x: number; str: string }[]> = {};
        for (const item of content.items as any[]) {
            const y = Math.round(item.transform[5]);
            if (!itemsByY[y]) itemsByY[y] = [];
            itemsByY[y].push({ x: item.transform[4], str: item.str });
        }

        const sortedYs = Object.keys(itemsByY).map(Number).sort((a, b) => b - a);
        for (const y of sortedYs) {
            const line = itemsByY[y].sort((a, b) => a.x - b.x).map(i => i.str).join('  ');
            if (line.trim()) fullText += line + '\n';
        }
    }

    return fullText;
}
