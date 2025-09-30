import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const fileType = searchParams.get('fileType');
    const tokenFromQuery = searchParams.get('token');

    if (!applicationId || !fileType) {
      return NextResponse.json({ error: 'Missing applicationId or fileType' }, { status: 400 });
    }

    // Get token from cookies/local header if available; fallback to token passed explicitly (optional)
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader || (tokenFromQuery ? `Bearer ${tokenFromQuery}` : undefined);
    if (!bearer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const upstream = await fetch(`${API_BASE}/api/vehicle-passes/files/${encodeURIComponent(applicationId)}/${encodeURIComponent(fileType)}`, {
      headers: {
        'Authorization': bearer,
      },
      // Do not use next: { revalidate } here; this is a pass-through stream
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text || 'Upstream error', { status: upstream.status });
    }

    // Stream response as-is with headers
    const headers = new Headers();
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');
    const disposition = upstream.headers.get('content-disposition');
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    if (disposition) headers.set('Content-Disposition', disposition);
    // Allow inline display
    headers.set('Cache-Control', 'private, max-age=0, no-store');

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}


