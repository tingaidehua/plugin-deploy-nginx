import { ensureSite, nginxReload, tlsStatus, listRoutes, domain, nginxTest, siteStatus } from './lib/nginx-ops.js'
import { registerJsonTool } from './lib/register-json-tool.js'

export const name = 'plugin-deploy-nginx'
export const inject = ['tools']

export function apply(ctx) {
  registerJsonTool(ctx, {
    name: 'nginx_ensure_site',
    description: `Ensure nginx site for ${domain()} exists, routes dir ready, then reload.`,
    parameters: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      additionalProperties: false,
    },
    execute: async (args) => ensureSite(args),
  })
  registerJsonTool(ctx, {
    name: 'nginx_reload',
    description: 'nginx -t then systemctl reload nginx',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => nginxReload(),
  })
  registerJsonTool(ctx, {
    name: 'nginx_tls_status',
    description: 'Show Let\'s Encrypt cert expiry for DSH_DOMAIN',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => tlsStatus(),
  })
  registerJsonTool(ctx, {
    name: 'nginx_list_routes',
    description: 'List /etc/nginx/dsh-routes.d snippets',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => listRoutes(),
  })
  registerJsonTool(ctx, {
    name: 'nginx_test',
    description: 'Run nginx -t only (no reload)',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => nginxTest(),
  })
  registerJsonTool(ctx, {
    name: 'nginx_site_status',
    description: 'Show site file / enablement / nginx active + config test for DSH_DOMAIN',
    parameters: {
      type: 'object',
      properties: { domain: { type: 'string' } },
      additionalProperties: false,
    },
    execute: async (args) => siteStatus(args),
  })
  console.log('[plugin-deploy-nginx] tools registered')
}
