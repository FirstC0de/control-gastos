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

        const workerFile = path.join('node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        const cwd = process.cwd();
        const localPath = path.join(cwd, workerFile);
        const rootPath = path.resolve(cwd, '../..', workerFile);
        const localExists = existsSync(localPath);
        const rootExists = existsSync(rootPath);
        const workerPath = localExists ? localPath : rootPath;
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
        const cwd = process.cwd();
        const workerFile = path.join('node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs');
        const localPath = path.join(cwd, workerFile);
        const rootPath = path.resolve(cwd, '../..', workerFile);
        return NextResponse.json({
            error: err.message ?? 'Error al procesar el PDF',
            _debug: {
                cwd,
                localPath,
                localExists: existsSync(localPath),
                rootPath,
                rootExists: existsSync(rootPath),
            },
        }, { status: 500 });
    }
}
