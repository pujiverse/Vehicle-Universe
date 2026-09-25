/* @ds-bundle: {"format":4,"namespace":"Pujiverse","components":[{"name":"Button"},{"name":"FilterChip"},{"name":"StatusPill"},{"name":"ConfidenceBadge"},{"name":"MonogramBadge"},{"name":"Card"},{"name":"AvailabilityGrid"},{"name":"Timeline"},{"name":"Breadcrumb"},{"name":"SearchField"}]} */
(function () {
  var R = window.React, h = R.createElement;
  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(o, keys) { var r = {}; for (var k in o) if (keys.indexOf(k) < 0) r[k] = o[k]; return r; }

  var STATUS = {
    'In production': 'positive', 'In service': 'info', 'In service (production ended)': 'info', 'Operational': 'info',
    'In development': 'caution', 'Discontinued': 'neutral', 'Retired': 'neutral', 'Historical': 'neutral', 'Completed mission': 'neutral'
  };
  var AVAIL = { 'Widely available': 'wide', 'Limited / select countries': 'limited', 'Not available': 'none' };
  var AVAIL_SHORT = { wide: 'Wide', limited: 'Limited', none: 'None' };
  var CONF = { High: 'positive', Medium: 'caution', Low: 'negative' };

  function Button(p) {
    var v = p.variant || 'secondary', s = p.size || 'md';
    return h('button', Object.assign({ type: 'button' }, omit(p, ['variant', 'size', 'className', 'children']), {
      className: cx('pv-btn', 'pv-btn--' + v, s === 'sm' && 'pv-btn--sm', p.className)
    }), p.children);
  }

  function FilterChip(p) {
    return h('button', Object.assign({ type: 'button' }, omit(p, ['selected', 'domain', 'count', 'className', 'children']), {
      className: cx('pv-chip', p.selected && 'is-selected', p.domain && 'pv-d-' + String(p.domain).toLowerCase(), p.className),
      'aria-pressed': !!p.selected
    }), p.domain && h('span', { className: 'pv-chip__dot', 'aria-hidden': true }), p.children,
      p.count != null && h('span', { className: 'pv-chip__count' }, p.count));
  }

  function StatusPill(p) {
    var tone = p.tone || STATUS[p.status] || 'neutral';
    return h('span', { className: cx('pv-pill', 'pv-tone-' + tone, p.className) },
      h('span', { className: 'pv-pill__dot', 'aria-hidden': true }), p.status);
  }

  function ConfidenceBadge(p) {
    var lvl = p.level || 'Medium';
    return h('span', {
      className: cx('pv-pill', 'pv-pill--outline', 'pv-tone-' + (CONF[lvl] || 'neutral'), p.className),
      title: 'Low = estimate; verify before relying on it.', tabIndex: 0
    }, 'Data confidence: ' + lvl);
  }

  function lum(c) {
    var r, g, b, m;
    if ((m = /^#([0-9a-f]{6})$/i.exec(c || ''))) { var n = parseInt(m[1], 16); r = (n >> 16) / 255; g = (n >> 8 & 255) / 255; b = (n & 255) / 255; }
    else if ((m = /hsl\(\s*([\d.]+)[, ]+([\d.]+)%[, ]+([\d.]+)%/i.exec(c || ''))) {
      var H = +m[1] / 360, S = +m[2] / 100, L = +m[3] / 100, q = L < .5 ? L * (1 + S) : L + S - L * S, pp = 2 * L - q;
      var f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < .5 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp; };
      r = f(H + 1 / 3); g = f(H); b = f(H - 1 / 3);
    } else return null;
    var lin = function (x) { return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); };
    return .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
  }
  function inkOn(c) { var L = lum(c); if (L == null) return '#ffffff'; return (1.05 / (L + .05)) >= ((L + .05) / (0.0078 + .05)) ? '#ffffff' : '#0f0c21'; }

  function MonogramBadge(p) {
    var size = p.size || 64;
    var disc = p.imageUrl
      ? h('img', { className: 'pv-mono__img', src: p.imageUrl, alt: p.name + ' logo', width: size, height: size })
      : h('span', { className: 'pv-mono__disc', role: 'img', 'aria-label': p.name + ' monogram',
          style: { width: size, height: size, background: p.color, color: inkOn(p.color), fontSize: Math.round(size * 0.36) } }, p.monogram);
    return h('span', { className: cx('pv-mono', p.className) }, disc,
      p.showName !== false && h('span', { className: 'pv-mono__name' }, p.name));
  }

  function Card(p) {
    var interactive = !!p.onClick || p.href;
    var tag = p.href ? 'a' : (p.onClick ? 'button' : 'div');
    return h(tag, Object.assign({}, omit(p, ['domain', 'selected', 'className', 'children', 'media', 'title', 'meta', 'badge']),
      tag === 'button' ? { type: 'button' } : {}, {
      className: cx('pv-card', interactive && 'pv-card--interactive', p.selected && 'is-selected', p.domain && 'pv-d-' + String(p.domain).toLowerCase(), p.className)
    }),
      p.media && h('div', { className: 'pv-card__media' }, p.media),
      (p.title || p.badge) && h('div', { className: 'pv-card__head' },
        p.title && h('span', { className: 'pv-card__title' }, p.title),
        p.badge && h('span', { className: 'pv-card__badge' }, p.badge)),
      p.meta && h('div', { className: 'pv-card__meta' }, p.meta),
      p.children);
  }

  function AvailabilityGrid(p) {
    var regions = p.regions || {};
    var names = p.order || Object.keys(regions);
    return h('div', { className: cx('pv-avail', p.className) },
      h('ul', { className: 'pv-avail__grid', 'aria-label': 'Availability by region' },
        names.map(function (r) {
          var v = regions[r], k = AVAIL[v];
          return h('li', { key: r, className: cx('pv-avail__cell', k ? 'pv-avail--' + k : 'pv-avail--unknown'), title: r + ': ' + (v || 'Not in dataset') },
            h('span', { className: 'pv-avail__region' }, r),
            h('span', { className: 'pv-avail__state' }, k ? AVAIL_SHORT[k] : 'Not in dataset'));
        })),
      p.note && h('p', { className: 'pv-avail__note' }, p.note));
  }

  function Timeline(p) {
    var items = p.items || [];
    return h('ol', { className: cx('pv-tl', p.className) }, items.map(function (it, i) {
      var isStr = typeof it === 'string';
      var hi = p.highlight != null && (p.highlight === i || (!isStr && p.highlight === it.year));
      return h('li', { key: i, className: cx('pv-tl__item', hi && 'is-highlight'), 'aria-current': hi ? 'step' : undefined },
        !isStr && h('span', { className: 'pv-tl__year' }, it.year),
        h('span', { className: 'pv-tl__event' }, isStr ? it : it.event));
    }));
  }

  function Breadcrumb(p) {
    var items = p.items || [];
    return h('nav', { className: cx('pv-crumbs', p.className), 'aria-label': 'Breadcrumb' },
      h('ol', null, items.map(function (it, i) {
        var last = i === items.length - 1;
        return h('li', { key: i, className: it.domain ? 'pv-d-' + String(it.domain).toLowerCase() : undefined },
          last ? h('span', { 'aria-current': 'page' }, it.label)
               : h('a', { href: it.href || '#', onClick: it.onClick }, it.label));
      })));
  }

  function SearchField(p) {
    return h('label', { className: cx('pv-search', p.className) },
      h('svg', { className: 'pv-search__icon', viewBox: '0 0 20 20', width: 18, height: 18, 'aria-hidden': true },
        h('circle', { cx: 8.5, cy: 8.5, r: 5.5, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }),
        h('path', { d: 'M13 13l4.5 4.5', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' })),
      h('span', { className: 'pv-visually-hidden' }, p.label || 'Search'),
      h('input', Object.assign({ type: 'search', placeholder: 'Search types, brands, products' }, omit(p, ['label', 'className']), { className: 'pv-search__input' })));
  }

  window.Pujiverse = Object.assign(window.Pujiverse || {}, {
    Button: Button, FilterChip: FilterChip, StatusPill: StatusPill, ConfidenceBadge: ConfidenceBadge,
    MonogramBadge: MonogramBadge, Card: Card, AvailabilityGrid: AvailabilityGrid, Timeline: Timeline,
    Breadcrumb: Breadcrumb, SearchField: SearchField, inkOn: inkOn, statusTone: function (s) { return STATUS[s] || 'neutral'; }
  });
})();
