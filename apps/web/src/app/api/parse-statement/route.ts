import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    

    const message = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Sos un parser experto de resúmenes de tarjetas de crédito argentinas.
Analizá el siguiente texto extraído de un resumen de tarjeta de crédito y extraé TODAS las transacciones de compra.

Devolvé ÚNICAMENTE un JSON válido con esta estructura, sin texto adicional, sin markdown, sin backticks:

{
  "bank": "nombre del banco detectado",
  "cardType": "Visa | Mastercard | American Express | otra",
  "period": "período de facturación como string",
  "closingDate": "fecha de cierre en formato YYYY-MM-DD o null",
  "dueDate": "fecha de vencimiento en formato YYYY-MM-DD o null",
  "totalARS": número total en pesos del resumen,
  "totalUSD": número total en dólares o 0,
  "items": [
    {
      "date": "YYYY-MM-DD",
      "description": "descripción limpia del comercio",
      "amount": número (monto de la cuota si tiene cuotas, monto total si es contado),
      "installments": número (1 si es contado, N si tiene cuotas),
      "currentInstallment": número (1 si es contado),
      "installmentAmount": número (igual a amount),
      "comprobante": "número de comprobante o referencia si existe, sino string vacío",
      "currency": "ARS" o "USD",
      "selected": true
    }
  ]
}

Reglas importantes:
- Ignorá: saldos anteriores, pagos realizados, ajustes, intereses, cargos de financiación, impuestos sobre el resumen
- Solo incluí compras y consumos reales
- Las cuotas pueden venir como "3/12", "cuota 3 de 12", "3 de 12" — siempre extraé cuota actual y total
- El monto que aparece en el PDF para cuotas ES el monto de esa cuota (no el total)
- Los montos argentinos usan punto como miles y coma como decimal: "25.807,61" → 25807.61
- También pueden venir sin separador de miles: "25807,61" → 25807.61
- Si hay gastos en dólares, ponelos con currency "USD"
- Si no podés determinar la fecha exacta, usá la fecha de cierre del resumen
- Limpié las descripciones: "MERPAGO*MERCADOLIBRE" → "MercadoPago - MercadoLibre"

Texto del resumen:
${text.slice(0, 15000)}`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Respuesta inesperada');

    // Limpiar posibles backticks que Claude agregue igual
    const clean = content.text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error('Error en parse-statement:', err);
    return NextResponse.json(
      { error: 'No se pudo parsear el resumen' },
      { status: 500 }
    );
  }
}