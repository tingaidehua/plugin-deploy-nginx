import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' })
  return {
    status: r.status,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
    error: r.error ? String(r.error.message) : '',
  }
}

export function domain() {
  return process.env.DSH_DOMAIN || 'tingaidehua.top'
}

export function nginxReload() {
  const t = run('nginx', ['-t'])
  if (t.status !== 0) {
    return { ok: false, step: 'nginx -t', ...t }
  }
  const r = run('systemctl', ['reload', 'nginx'])
  return { ok: r.status === 0, step: 'reload', ...r, test: t.stdout }
}

export function tlsStatus() {
  const d = domain()
  const live = `/etc/letsencrypt/live/${d}`
  const fullchain = path.join(live, 'fullchain.pem')
  const exists = fs.existsSync(fullchain)
  let notAfter = null
  if (exists) {
    const r = run('openssl', ['x509', '-in', fullchain, '-noout', '-enddate'])
    notAfter = (r.stdout || '').replace('notAfter=', '')
  }
  const daysLeft = notAfter ? Math.floor((Date.parse(notAfter) - Date.now()) / 86400000) : null
  return {
    domain: d,
    certDir: live,
    exists,
    notAfter,
    daysLeft,
    alert: daysLeft !== null && daysLeft < 14,
  }
}

export function ensureSite({ domain: d = domain(), forceHttpsSnippet = true } = {}) {
  const site = `/etc/nginx/sites-available/${d}`
  const enabled = `/etc/nginx/sites-enabled/${d}`
  const routes = '/etc/nginx/dsh-routes.d'
  const webroot = `/var/www/${d}/html`
  fs.mkdirSync(routes, { recursive: true })
  fs.mkdirSync(webroot, { recursive: true })
  if (!fs.existsSync(site)) {
    return {
      ok: false,
      error: `missing ${site}; run skill-deploy-dsh remote-bootstrap.sh first`,
      routesDir: routes,
    }
  }
  if (!fs.existsSync(enabled)) {
    fs.symlinkSync(site, enabled)
  }
  const reload = nginxReload()
  return {
    ok: reload.ok,
    site,
    enabled,
    routesDir: routes,
    webroot,
    forceHttpsSnippet,
    reload,
  }
}

export function nginxTest() {
  const t = run('nginx', ['-t'])
  return {
    ok: t.status === 0,
    stdout: t.stdout,
    stderr: t.stderr,
  }
}

export function siteStatus({ domain: d = domain() } = {}) {
  const site = `/etc/nginx/sites-available/${d}`
  const enabled = `/etc/nginx/sites-enabled/${d}`
  const active = run('systemctl', ['is-active', 'nginx'])
  const test = nginxTest()
  return {
    domain: d,
    siteExists: fs.existsSync(site),
    enabled: fs.existsSync(enabled),
    enabledPath: enabled,
    nginxActive: active.stdout === 'active',
    test,
  }
}

export function listRoutes() {
  const dir = '/etc/nginx/dsh-routes.d'
  if (!fs.existsSync(dir)) return { routes: [] }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.conf'))
  return {
    routes: files.map((f) => ({
      file: path.join(dir, f),
      body: fs.readFileSync(path.join(dir, f), 'utf8').slice(0, 2000),
    })),
  }
}
