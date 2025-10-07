import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function handleProxy(req: NextRequest, method: 'GET' | 'HEAD') {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const fileType = searchParams.get('fileType');
    const index = searchParams.get('index');
    const tokenFromQuery = searchParams.get('token');

    if (!applicationId || !fileType) {
      return NextResponse.json({ error: 'Missing applicationId or fileType' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const bearer = authHeader || (tokenFromQuery ? `Bearer ${tokenFromQuery}` : undefined);
    if (!bearer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let upstreamUrl = `${API_BASE}/api/vehicle-passes/files/${encodeURIComponent(applicationId)}/${encodeURIComponent(fileType)}`;
    if (index) {
      upstreamUrl += `/${encodeURIComponent(index)}`;
    }

    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        'Authorization': bearer,
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text || 'Upstream error', { status: upstream.status });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');
    const disposition = upstream.headers.get('content-disposition');
    headers.set('Content-Type', contentType);
    if (contentLength) headers.set('Content-Length', contentLength);
    if (disposition) headers.set('Content-Disposition', disposition);
    headers.set('Cache-Control', 'private, max-age=0, no-store');

    return new NextResponse(method === 'HEAD' ? null : upstream.body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req, 'GET');
}

export async function HEAD(req: NextRequest) {
  return handleProxy(req, 'HEAD');
}

