import http from 'node:http'

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787

// Minimal CORS pass-through proxy for OpenAI-compatible APIs.
// Usage: the app sends requests to  http://localhost:8787/proxy?url=<encoded upstream url>
// Only intended for local personal use as a fallback when a provider blocks
// direct browser calls via CORS.

const ALLOW_HOSTS = [
  'api.openai.com',
  'api.deepseek.com',
  'dashscope.aliyuncs.com',
  'open.bigmodel.cn',
  'api.moonshot.cn',
]

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`)
  if (reqUrl.pathname !== '/proxy') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('cet6-coach CORS proxy is running. POST to /proxy?url=<upstream>.')
    return
  }

  const target = reqUrl.searchParams.get('url')
  if (!target) {
    res.writeHead(400)
    res.end('missing url')
    return
  }

  let upstream
  try {
    upstream = new URL(target)
  } catch {
    res.writeHead(400)
    res.end('invalid url')
    return
  }

  if (!ALLOW_HOSTS.some((h) => upstream.hostname === h || upstream.hostname.endsWith('.' + h))) {
    res.writeHead(403)
    res.end('host not allowed')
    return
  }

  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks)

  try {
    const upstreamRes = await fetch(upstream, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Authorization: req.headers['authorization'] || '',
      },
      body: req.method === 'POST' ? body : undefined,
    })

    res.writeHead(upstreamRes.status, {
      'Content-Type': upstreamRes.headers.get('content-type') || 'application/json',
    })

    if (upstreamRes.body) {
      const reader = upstreamRes.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    }
    res.end()
  } catch (e) {
    res.writeHead(502)
    res.end('upstream error: ' + (e?.message || 'unknown'))
  }
})

server.listen(PORT, () => {
  console.log(`cet6-coach CORS proxy listening on http://localhost:${PORT}`)
  console.log('Set "本地代理地址" in Settings to this URL if direct calls are blocked.')
})
