// Serve identical public information as HTML or Markdown. No private data or agent actions.
function prefersMarkdown(accept = '') {
  const types = accept.toLowerCase().split(',').map(part => {
    const [type, ...params] = part.trim().split(';');
    const q = params.find(p => p.trim().startsWith('q='));
    return {type, q: q ? Number(q.trim().slice(2)) : 1};
  });
  const md = Math.max(0, ...types.filter(t => t.type === 'text/markdown').map(t => t.q));
  const html = Math.max(0, ...types.filter(t => t.type === 'text/html').map(t => t.q));
  return md > 0 && md >= html;
}
export { prefersMarkdown };
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.wazoozie.com' || /\/index\.html$/.test(url.pathname)) {
      url.hostname = url.hostname === 'www.wazoozie.com' ? 'wazoozie.com' : url.hostname;
      url.pathname = url.pathname.replace(/index\.html$/, '');
      return Response.redirect(url.toString(), 301);
    }
    const original = await env.ASSETS.fetch(request);
    const isPage = original.ok && (original.headers.get('content-type') || '').includes('text/html');
    let response = original;
    if (isPage && ['GET', 'HEAD'].includes(request.method) && prefersMarkdown(request.headers.get('accept') || '')) {
      const path = url.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
      const mdURL = new URL('/agent-content' + path + '/index.md', url);
      const md = await env.ASSETS.fetch(new Request(mdURL, {method: request.method}));
      if (md.ok && !(md.headers.get('content-type') || '').includes('text/html')) {
        response = new Response(md.body, md);
        response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
        response.headers.set('Content-Location', mdURL.pathname);
      }
    }
    response = new Response(response.body, response);
    if (url.pathname.startsWith('/agent-content/')) response.headers.set('X-Robots-Tag', 'noindex');
    if (isPage) {
      response.headers.append('Vary', 'Accept');
      response.headers.set('Link', '<https://wazoozie.com' + url.pathname + '>; rel="canonical", </sitemap.xml>; rel="sitemap"; type="application/xml", </llms.txt>; rel="describedby"; type="text/plain"');
    }
    return response;
  }
};
