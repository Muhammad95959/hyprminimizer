import dbusNext from 'dbus-next';
const Interface = dbusNext.interface.Interface;
const { Variant } = dbusNext;

const MENU_IFACE = 'com.canonical.dbusmenu';

export class DbusMenu extends Interface {
  constructor(opts = {}) {
    super(MENU_IFACE);
    this._items = opts.items || [];
    this._onActivate = opts.onActivate || (() => {});
  }

  get Version() { return 3; }
  get TextDirection() { return 'ltr'; }
  get Status() { return 'normal'; }
  get IconThemePath() { return ''; }

  GetLayout(parentId, recursionDepth, propertyNames) {
    const revision = 0;
    const children = this._items.map((item, i) => {
      const id = i + 1;
      const props = {};
      props.label = new Variant('s', item.label);
      props.enabled = new Variant('b', item.enabled !== false);
      props.visible = new Variant('b', item.visible !== false);
      return new Variant('(ia{sv}av)', [id, props, []]);
    });

    const rootProps = {
      'children-display': new Variant('s', 'submenu'),
    };

    return [revision, [0, rootProps, children]];
  }

  async Event(id, eventId, data, timestamp) {
    if (eventId === 'clicked' && this._items[id - 1]) {
      await this._onActivate(this._items[id - 1]);
    }
  }

  GetProperty(id, name) {
    return new Variant('v', null);
  }

  AboutToShow(id) {
    return false;
  }
}

DbusMenu.configureMembers({
  properties: {
    Version: { signature: 'u', access: 'read' },
    TextDirection: { signature: 's', access: 'read' },
    Status: { signature: 's', access: 'read' },
    IconThemePath: { signature: 's', access: 'read' },
  },
  methods: {
    GetLayout: { inSignature: 'iib', outSignature: 'u(ia{sv}av)' },
    GetProperty: { inSignature: 'is', outSignature: 'v' },
    Event: { inSignature: 'isvu', outSignature: '' },
    AboutToShow: { inSignature: 'i', outSignature: 'b' },
  },
});

export default DbusMenu;
