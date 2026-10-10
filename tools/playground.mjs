import { installPlaygroundNetworkPolicy } from './playground-network.mjs';

const allowLan = process.env.RP_USADOS_ALLOW_LAN === '1';
installPlaygroundNetworkPolicy({ allowLan });
if (process.argv[2] === 'server') {
  const explicitLogin = process.argv.includes('--login') || process.argv.includes('--login=true');
  if (allowLan && explicitLogin) throw new Error('LAN no permite auto-login de administrador. Usá autenticación normal de WordPress.');
  // CLI defaults to automatic admin access; test real WordPress sessions instead.
  if (!explicitLogin && !process.argv.includes('--no-login')) process.argv.push('--no-login');
}
await import('./node_modules/@wp-playground/cli/cli.js');
