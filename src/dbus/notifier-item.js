import dbusNext from '@deltachat/dbus-next';
const Interface = dbusNext.interface.Interface;

const SNI_IFACE = 'org.kde.StatusNotifierItem';

export class StatusNotifierItem extends Interface {
  constructor(opts = {}) {
    super(SNI_IFACE);
    this._id = opts.id || 'minimizer';
    this._iconName = opts.iconName || opts.id || 'hypr-minimizer';
    this._title = opts.title || 'Minimized Window';
    this._tooltip = opts.tooltip || '';
    this._onActivate = opts.onActivate || (() => {});
    this._onSecondaryActivate = opts.onSecondaryActivate || (() => {});
  }

  get Category() { return 'ApplicationStatus'; }
  get Id() { return this._id; }
  get Title() { return this._title; }
  get Status() { return 'Active'; }
  get IconName() { return this._iconName; }
  get ItemIsMenu() { return false; }
  get WindowId() { return 0; }

  get IconPixmap() { return []; }

  get ToolTip() {
    return ['', [], this._tooltip, ''];
  }

  get Menu() { return '/Menu'; }

  async Activate(x, y) {
    await this._onActivate();
  }

  async SecondaryActivate(x, y) {
    await this._onSecondaryActivate();
  }

  async ContextMenu(x, y) {}

  async Scroll(delta, direction) {}

}

StatusNotifierItem.configureMembers({
  properties: {
    Category: { signature: 's', access: 'read' },
    Id: { signature: 's', access: 'read' },
    Title: { signature: 's', access: 'read' },
    Status: { signature: 's', access: 'read' },
    IconName: { signature: 's', access: 'read' },
    IconPixmap: { signature: 'a(iiay)', access: 'read' },
    ToolTip: { signature: '(sa(iiay)ss)', access: 'read' },
    ItemIsMenu: { signature: 'b', access: 'read' },
    Menu: { signature: 'o', access: 'read' },
    WindowId: { signature: 'i', access: 'read' },
  },
  methods: {
    Activate: { inSignature: 'ii', outSignature: '' },
    SecondaryActivate: { inSignature: 'ii', outSignature: '' },
    ContextMenu: { inSignature: 'ii', outSignature: '' },
    Scroll: { inSignature: 'is', outSignature: '' },
  },
  signals: {
    NewTitle: { signature: '' },
    NewIcon: { signature: '' },
    NewToolTip: { signature: '' },
  }
});

export default StatusNotifierItem;
