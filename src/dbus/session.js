import dbusNext from 'dbus-next';
import { StatusNotifierItem } from './notifier-item.js';
import { DbusMenu } from './dbus-menu.js';

const WATCHER_NAME = 'org.kde.StatusNotifierWatcher';
const WATCHER_PATH = '/StatusNotifierWatcher';
const WATCHER_IFACE = 'org.kde.StatusNotifierWatcher';

export async function startTraySession(config, { iconName, title, tooltip, onRestore }) {
  const bus = dbusNext.sessionBus();

  const serviceName = config.get('dbusServiceName') + `_p${process.pid}`;
  const objPath = '/StatusNotifierItem';

  function doCleanup() {
    // disconnect is intentionally skipped to avoid async
    // dbus-next errors during shutdown. The OS will close
    // the socket on process exit.
  }

  let exitPending = false;

  const sni = new StatusNotifierItem({
    id: 'hypr-minimizer',
    iconName: iconName || 'hypr-minimizer',
    title: title || 'Minimized Window',
    tooltip: tooltip || 'Click to restore',
    onActivate: async () => {
      if (exitPending) return;
      exitPending = true;
      if (onRestore) await onRestore();
      doCleanup();
      setImmediate(() => process.exit(0));
    },
    onSecondaryActivate: async () => {
      if (exitPending) return;
      exitPending = true;
      doCleanup();
      setImmediate(() => process.exit(0));
    },
  });

  const menuItems = [
    { label: 'Restore', enabled: true },
    { label: 'Quit', enabled: true },
  ];

  const menu = new DbusMenu({
    items: menuItems,
    onActivate: async (item) => {
      if (exitPending) return;
      exitPending = true;
      if (item.label === 'Restore' && onRestore) await onRestore();
      doCleanup();
      setImmediate(() => process.exit(0));
    },
  });

  await bus.requestName(serviceName);
  bus.export(objPath, sni);
  bus.export('/Menu', menu);

  const obj = await bus.getProxyObject(WATCHER_NAME, WATCHER_PATH);
  const watcher = obj.getInterface(WATCHER_IFACE);

  await watcher.RegisterStatusNotifierItem(serviceName);

  return { bus, sni, menu, cleanup: doCleanup };
}

export default startTraySession;
