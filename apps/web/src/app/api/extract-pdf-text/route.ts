import { NextRequest, NextResponse } from 'next/server';
import { pathToFileURL } from 'url';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const buffer = new Uint8Array(await file.arrayBuffer());

        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
        const lib = pdfjsLib.default ?? pdfjsLib;

        // En monorepo, pdfjs puede estar hoisted al root (../../) o local a apps/web
        const workerFile = path.join('node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        const cwd = process.cwd();
        const workerPath = existsSync(path.join(cwd, workerFile))
            ? path.join(cwd, workerFile)
            : path.resolve(cwd, '../..', workerFile);
        lib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

        const pdf = await lib.getDocument({ data: buffer, useSystemFonts: true }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();

            const itemsByY: Record<number, { x: number; str: string }[]> = {};
            for (const item of content.items as any[]) {
                const y = Math.round(item.transform[5]);
                if (!itemsByY[y]) itemsByY[y] = [];
                itemsByY[y].push({ x: item.transform[4], str: item.str });
            }

            const sortedYs = Object.keys(itemsByY).map(Number).sort((a, b) => b - a);
            for (const y of sortedYs) {
                const line = itemsByY[y].sort((a, b) => a.x - b.x).map((i: any) => i.str).join('  ');
                if (line.trim()) fullText += line + '\n';
            }
        }

        return NextResponse.json({ text: fullText });
    } catch (err: any) {
        console.error('extract-pdf-text error:', err);
        return NextResponse.json({ error: err.message ?? 'Error al procesar el PDF' }, { status: 500 });
    }
}
