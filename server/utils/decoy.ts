/**
 * Plausible-looking decoy HTML so a probe sees something innocuous rather than
 * an obvious honeypot. Kept deliberately generic.
 */
export function decoyPage(kind: 'document' = 'document', title = 'Document'): string {
  const safeTitle = title.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!))
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${safeTitle}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f5f6f8;color:#333;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{background:#fff;border:1px solid #e3e6ea;border-radius:8px;padding:40px 48px;max-width:420px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .spinner{width:34px;height:34px;border:3px solid #e3e6ea;border-top-color:#888;border-radius:50%;margin:0 auto 18px;animation:s 1s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
  h1{font-size:17px;font-weight:600;margin:0 0 6px}
  p{font-size:13px;color:#888;margin:0}
</style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>Preparing your document…</h1>
    <p>This is taking a little longer than usual. Please wait.</p>
  </div>
</body>
</html>`
}
