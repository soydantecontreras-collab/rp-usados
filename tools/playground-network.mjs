import net from 'node:net';

// CLI 3.1 has no bind-host option. Restrict its default TCP listener before startup.
// This adapter is local to the launcher process; no vendor source is modified.
export function installPlaygroundNetworkPolicy({ allowLan = false } = {}) {
  const original = net.Server.prototype.listen;
  const host = allowLan ? '0.0.0.0' : '127.0.0.1';
  net.Server.prototype.listen = function (...args) {
    if (typeof args[0] === 'number') {
      if (typeof args[1] === 'string') args[1] = host;
      else args.splice(1, 0, host);
    } else if (args[0] && typeof args[0] === 'object' && 'port' in args[0]) {
      args[0] = { ...args[0], host };
    }
    return original.apply(this, args);
  };
  return () => { net.Server.prototype.listen = original; };
}
