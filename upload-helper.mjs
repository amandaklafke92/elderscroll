/* Local upload bridge for the hackathon demo.
   Browser -> localhost -> Lovable keeps the admin passcode out of the app. */
import http from 'node:http';

const LOVABLE_URL = 'https://claude-vid-spot.lovable.app/api/admin/upload';
const LOVABLE_ORIGIN = new URL(LOVABLE_URL).origin;
const PASSCODE = process.env.LOVABLE_ADMIN_PASSCODE;
const PORT = 8787;

if (!PASSCODE) {
  console.error('Missing LOVABLE_ADMIN_PASSCODE.');
  console.error('Run: LOVABLE_ADMIN_PASSCODE="..." node upload-helper.mjs');
  process.exit(1);
}

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST' || !req.url.startsWith('/upload')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }

  try {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const name = params.get('name') || 'Anonymous';
    const requestedExt = (params.get('ext') || 'mp4').toLowerCase();
    const extension = requestedExt === 'webm' ? 'webm' : 'mp4';
    const requestType = req.headers['content-type'] || '';
    const contentType = requestType.startsWith('video/')
      ? requestType
      : `video/${extension}`;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append('name', name);
    form.append(
      'file',
      new Blob([buffer], { type: contentType }),
      `${name.replace(/\s+/g, '_')}.${extension}`
    );

    const upload = await fetch(LOVABLE_URL, {
      method: 'POST',
      headers: { 'x-admin-passcode': PASSCODE },
      body: form,
    });
    const text = await upload.text();
    res.writeHead(upload.status, { 'Content-Type': 'application/json' });
    if (!upload.ok) {
      res.end(text);
      return;
    }
    const result = JSON.parse(text);
    res.end(JSON.stringify({
      ...result,
      url: result.id ? `${LOVABLE_ORIGIN}/v/${result.id}` : undefined,
    }));
  } catch (error) {
    console.error('[upload helper]', error);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(error) }));
  }
}).listen(PORT, () => {
  console.log(`[upload helper] http://localhost:${PORT} -> ${LOVABLE_URL}`);
});
