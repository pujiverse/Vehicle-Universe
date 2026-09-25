function VU_BOOT(D, TILES) {
  var R = React, h = R.createElement, P = window.Pujiverse;
  var useState = R.useState, useEffect = R.useEffect, useMemo = R.useMemo, useRef = R.useRef;
  var DOMAINS = D.meta.domains; // Land, Rail, Water, Air, Space
  var REGIONS = D.meta.regions;

  // ---------- indexes ----------
  var T = {}, B = {}, PR = {};
  D.vehicle_types.forEach(function (t) { T[t.id] = t; });
  D.brands.forEach(function (b) { B[b.id] = b; });
  // products load per vehicle type (data/p/<type>.json)
  var PRODUCTS = {}, TYPE_LOAD = {}, typeListeners = [];
  function loadType(id) {
    if (!id || PRODUCTS[id] || TYPE_LOAD[id]) return TYPE_LOAD[id];
    TYPE_LOAD[id] = fetch('data/p/' + id + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (ps) { PRODUCTS[id] = ps; ps.forEach(function (p) { PR[p.id] = p; }); typeListeners.forEach(function (f) { f(); }); })
      .catch(function () { delete TYPE_LOAD[id]; typeListeners.forEach(function (f) { f(); }); });
    return TYPE_LOAD[id];
  }
  var BYTB = {};
  function productsOf(typeId, brandId) {
    var ps = PRODUCTS[typeId] || []; if (!brandId) return ps;
    var k = typeId + '/' + brandId;
    if (!BYTB[k] || BYTB[k].src !== ps) BYTB[k] = { src: ps, list: ps.filter(function (p) { return p.brand_id === brandId; }) };
    return BYTB[k].list;
  }
  function brandCount(typeId, brandId) { var s = T[typeId].stats; return (s && s.brand_counts && s.brand_counts[brandId]) || 0; }
  var typeStats = {}, BRAND_TOTAL = {};
  D.vehicle_types.forEach(function (t) { typeStats[t.id] = t.stats; var bc = (t.stats && t.stats.brand_counts) || {}; Object.keys(bc).forEach(function (k) { BRAND_TOTAL[k] = (BRAND_TOTAL[k] || 0) + bc[k]; }); });
  function brandTypes(id) { return D.vehicle_types.filter(function (t) { return brandCount(t.id, id) > 0; }).map(function (t) { return t.id; }); }

  // ---------- formatting ----------
  var nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function usd(v) { return v == null ? null : nf.format(v); }
  function usdShort(v) {
    if (v == null) return null;
    var a = Math.abs(v);
    function t(n, s) { var x = (v / n); return '$' + (Math.abs(x) >= 100 ? Math.round(x) : +x.toFixed(1)) + s; }
    if (a >= 1e9) return t(1e9, 'B'); if (a >= 1e6) return t(1e6, 'M'); return usd(v);
  }
  function range(min, max, short) { var f = short ? usdShort : usd; if (min == null) return null; return min === max ? f(min) : f(min) + ' – ' + f(max); }
  function country(hq) { return (hq || '').replace(/\s*\(.*\)\s*$/, '') || 'Not in dataset'; }
  function dcls(domain) { return 'pv-d-' + String(domain).toLowerCase(); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function nul(text) { return h('span', { className: 'null' }, text); }

  // ---------- routing ----------
  function parse(hash) {
    var s = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean), r = { level: 1 };
    if (s[0] === 'brand' && B[s[1]]) return { level: 5, brand: s[1] };
    if (s[0] === 'type' && T[s[1]]) { r.level = 2; r.type = s[1];
      if (s[2] === 'brand' && B[s[3]] && T[s[1]].brand_ids.indexOf(s[3]) >= 0) { r.level = 3; r.brand = s[3];
        if (s[4] === 'product' && s[5] && (!PRODUCTS[s[1]] || (PR[s[5]] && PR[s[5]].brand_id === s[3] && PR[s[5]].type_id === s[1]))) { r.level = 4; r.product = s[5];
          if (s[6] === 'year' && s[7]) r.year = decodeURIComponent(s[7]); } } }
    return r;
  }
  function href(type, brand, product, year) {
    var s = '#/';
    if (type) s += 'type/' + type;
    if (brand) s += '/brand/' + brand;
    if (product) s += '/product/' + product;
    if (year) s += '/year/' + encodeURIComponent(year);
    return s;
  }
  function go(to) { if (location.hash !== to) location.hash = to; }
  function productHref(p, year) { return href(p.type_id, p.brand_id, p.id, year); }
  function brandHref(id) { return '#/brand/' + id; }

  // ---------- search ----------
  var INDEX = [].concat(
    D.vehicle_types.map(function (t) { return { kind: 'Types', label: t.name, sub: t.domain + ' · ' + t.category, to: href(t.id), key: t.name.toLowerCase() }; }),
    D.brands.map(function (b) { var n = BRAND_TOTAL[b.id] || 0, nt = brandTypes(b.id).length; return { kind: 'Brands', label: b.name, sub: 'All ' + n.toLocaleString('en-US') + ' model' + (n === 1 ? '' : 's') + (nt > 1 ? ' in ' + nt + ' types' : ''), to: brandHref(b.id), key: b.name.toLowerCase() }; }),
    []
  );
  var SEARCH_LOADED = false, SEARCH_READY = false, searchListeners = [];
  function loadSearch() {
    if (SEARCH_LOADED) return; SEARCH_LOADED = true;
    fetch('data/search.json').then(function (r) { return r.json(); }).then(function (rows) {
      SEARCH_READY = true; setTimeout(function () { searchListeners.forEach(function (f) { f(); }); }, 0);
      rows.forEach(function (x) { var b = B[x[2]], t = T[x[3]]; INDEX.push({ kind: 'Products', label: x[1], sub: (b ? b.name : '') + ' · ' + (t ? t.name : ''), to: href(x[3], x[2], x[0]), key: (x[1] + ' ' + (b ? b.name : '')).toLowerCase() }); });
    }).catch(function () { SEARCH_LOADED = false; });
  }
  function score(key, q) {
    var i = key.indexOf(q);
    if (i === 0) return 100 - key.length / 100;
    if (i > 0) return (/[\s\/(-]/.test(key[i - 1]) ? 80 : 60) - key.length / 100;
    var k = 0, gaps = 0, last = -1;
    for (var j = 0; j < key.length && k < q.length; j++) if (key[j] === q[k]) { if (last >= 0) gaps += j - last - 1; last = j; k++; }
    return k === q.length && gaps <= q.length * 2 ? 30 - gaps : -1;
  }
  function search(q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    var out = { Types: [], Brands: [], Products: [] };
    INDEX.forEach(function (it) { var s = score(it.key, q); if (s >= 0) out[it.kind].push({ it: it, s: s }); });
    return ['Types', 'Brands', 'Products'].map(function (k) {
      var strong = out[k].some(function (x) { return x.s >= 60; });
      if (strong) out[k] = out[k].filter(function (x) { return x.s >= 60; });
      return { kind: k, items: out[k].sort(function (a, b) { return b.s - a.s; }).slice(0, k === 'Products' ? 8 : k === 'Brands' ? 8 : 5).map(function (x) { return x.it; }) };
    }).filter(function (g) { return g.items.length; });
  }

  // ---------- images (Wikimedia Commons, packed in chunk files) ----------
  var IMG = {}, CHUNKS = {}, imgListeners = [];
  function loadChunk(name) {
    if (!name || CHUNKS[name]) return CHUNKS[name];
    CHUNKS[name] = fetch('img/' + name + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (m) { Object.assign(IMG, m); imgListeners.forEach(function (f) { f(); }); })
      .catch(function () { delete CHUNKS[name]; });
    return CHUNKS[name];
  }
  function useChunks(names) {
    var st = useState(0), bump = st[1];
    useEffect(function () {
      var f = function () { bump(function (x) { return x + 1; }); };
      imgListeners.push(f); names.forEach(loadChunk);
      return function () { imgListeners = imgListeners.filter(function (g) { return g !== f; }); };
    }, [names.join(',')]);
  }
  function chunksFor(ps) { var s = {}; ps.forEach(function (p) { if (p.img_chunk) s[p.img_chunk] = 1; }); return Object.keys(s); }
  function yearOf(p) { return p.first_launched || null; }
  function sortProducts(ps, how) {
    var a = ps.slice();
    function y(p) { var m = /\d{4}/.exec(p.first_launched || ''); return m ? +m[0] : 99999; }
    if (how === 'name') a.sort(function (x, z) { return x.name.localeCompare(z.name); });
    else if (how === 'newest') a.sort(function (x, z) { return (y(z) === 99999 ? -1 : y(z)) - (y(x) === 99999 ? -1 : y(x)) || x.name.localeCompare(z.name); });
    else if (how === 'oldest') a.sort(function (x, z) { return y(x) - y(z) || x.name.localeCompare(z.name); });
    else if (how === 'photo') a.sort(function (x, z) { return (z.img_chunk ? 1 : 0) - (x.img_chunk ? 1 : 0); });
    return a;
  }
  function filterProducts(ps, q) {
    q = (q || '').trim().toLowerCase(); if (!q) return ps;
    return ps.filter(function (p) { return (p.name + ' ' + (p.first_launched || '')).toLowerCase().indexOf(q) >= 0; });
  }

  // ---------- small views ----------
  function Icon(name) {
    var p = { sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4',
      moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z', back: 'M15 18l-6-6 6-6', chev: 'M6 9l6 6 6-6', next: 'M9 18l6-6-6-6' }[name];
    return h('svg', { viewBox: '0 0 24 24', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className: name === 'chev' ? 'chev' : undefined },
      name === 'sun' && h('circle', { cx: 12, cy: 12, r: 4 }), h('path', { d: p }));
  }
  function Emoji(t) { return h('span', { className: 'emoji-disc', 'aria-hidden': true }, t.icon_emoji); }
  function TypeMedia(t) { var tl = TILES[t.id]; return t.image_url ? h('img', { className: 'photo', src: t.image_url, alt: '' }) : tl ? h('img', { className: 'photo', src: tl.src, alt: '', loading: 'lazy' }) : Emoji(t); }
  function ProductMedia(p) {
    var t = T[p.type_id];
    if (IMG[p.id]) return h('img', { className: 'photo', src: IMG[p.id], alt: p.name, loading: 'lazy' });
    return h('div', { className: 'swatch-well' }, h('span', { className: 'body', style: { background: p.model_3d.body_color || 'var(--surface-100)' }, 'aria-hidden': true }, t.icon_emoji),
      h('span', { className: 'nophoto' }, p.img_chunk ? 'Loading photo' : p.image ? 'Photo being added' : 'No free photo yet'));
  }
  function twinProps(key, hover, setHover) {
    return { onMouseEnter: function () { setHover(key); }, onMouseLeave: function () { setHover(null); }, onFocus: function () { setHover(key); }, onBlur: function () { setHover(null); } };
  }

  // ---------- Level 1 ----------
  function visibleTypes(filter, sort) {
    var list = D.vehicle_types.filter(function (t) { return filter === 'All' || t.domain === filter; });
    var s = list.slice();
    if (sort === 'name') s.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sort === 'brands') s.sort(function (a, b) { return typeStats[b.id].brands - typeStats[a.id].brands || a.name.localeCompare(b.name); });
    else if (sort === 'price') s.sort(function (a, b) { return (typeStats[b.id].max || 0) - (typeStats[a.id].max || 0); });
    var groups = DOMAINS.filter(function (d) { return filter === 'All' || d === filter; }).map(function (d) { return { domain: d, items: s.filter(function (t) { return t.domain === d; }) }; });
    return groups;
  }
  function HomeStage(props) {
    return h('div', null, props.groups.map(function (g) {
      return h('section', { key: g.domain, className: 'dgroup ' + dcls(g.domain), 'aria-label': g.domain },
        h('div', { className: 'dhead' }, h('h2', null, g.domain), h('span', { className: 'muted small' }, plural(g.items.length, 'type'))),
        h('div', { className: 'grid' }, g.items.map(function (t) {
          var k = 't:' + t.id;
          return h(P.Card, Object.assign({ key: t.id, domain: t.domain, href: href(t.id), media: TypeMedia(t), title: t.name, meta: t.category,
            className: props.hover === k ? 'is-twin' : '', 'aria-label': t.name + ', ' + plural(typeStats[t.id].brands, 'brand') },
            twinProps(k, props.hover, props.setHover)), h('div', { className: 'card-foot' }, h('span', { className: 'pv-card__badge' }, plural(typeStats[t.id].brands, 'brand'))));
        })));
    }));
  }
  function HomeNav(props) {
    var total = D.vehicle_types.length;
    return h(R.Fragment, null,
      h('div', null,
        h('p', { className: 'eyebrow' }, 'Explore'),
        h('h1', { className: 'h1' }, 'Every kind of vehicle'),
        h('p', { className: 'stats small', style: { margin: '8px 0 0' } },
          h('span', null, h('b', null, total), ' types'), '·', h('span', null, h('b', null, D.brands.length.toLocaleString('en-US')), ' brands'), '·', h('span', null, h('b', null, D.meta.counts.products.toLocaleString('en-US')), ' models'))),
      h('div', { className: 'section' },
        h('div', { className: 'controls', role: 'group', 'aria-label': 'Filter by domain' },
          ['All'].concat(DOMAINS).map(function (d) {
            var n = d === 'All' ? total : D.vehicle_types.filter(function (t) { return t.domain === d; }).length;
            return h(P.FilterChip, { key: d, domain: d === 'All' ? undefined : d, selected: props.filter === d, count: n, onClick: function () { props.setFilter(d); } }, d);
          })),
        h('label', { className: 'sort', htmlFor: 'sort' }, 'Sort by',
          h('select', { id: 'sort', value: props.sort, onChange: function (e) { props.setSort(e.target.value); } },
            h('option', { value: 'data' }, 'Dataset order'), h('option', { value: 'name' }, 'Name'), h('option', { value: 'brands' }, '# Brands'), h('option', { value: 'price' }, 'Price range (highest first)')))),
      h('div', null, props.groups.map(function (g) {
        return h('details', { key: g.domain, className: 'lgroup ' + dcls(g.domain), open: true },
          h('summary', null, h('span', { className: 'eyebrow' }, g.domain + ' · ' + plural(g.items.length, 'type')), Icon('chev')),
          h('ul', { className: 'rows' }, g.items.map(function (t) {
            var k = 't:' + t.id, st = typeStats[t.id];
            return h('li', { key: t.id }, h('button', Object.assign({ className: 'row' + (props.hover === k ? ' is-twin' : ''), onClick: function () { go(href(t.id)); } }, twinProps(k, props.hover, props.setHover)),
              h('span', { className: 'name' }, t.name), h('span', { className: 'cat' }, t.category),
              h('span', { className: 'count' }, plural(st.brands, 'brand'), h('br'), plural(st.products, 'product'))));
          })));
      })));
  }

  // ---------- Level 2 ----------
  function brandList(props) {
    var t = T[props.r.type], l2 = props.l2, q = (l2.q || '').trim().toLowerCase();
    var ids = t.brand_ids.filter(function (id) { return !q || B[id].name.toLowerCase().indexOf(q) >= 0 || String(B[id].headquarters || '').toLowerCase().indexOf(q) >= 0; });
    if (l2.sort === 'models') ids = ids.slice().sort(function (a, b) { return brandCount(t.id, b) - brandCount(t.id, a); });
    else if (l2.sort === 'name') ids = ids.slice().sort(function (a, b) { return B[a].name.localeCompare(B[b].name); });
    return { all: t.brand_ids, filtered: ids, shown: ids.slice(0, l2.limit) };
  }
  function BrandTools(props) {
    var l2 = props.l2, set = props.setL2, L = brandList(props);
    if (L.all.length <= 12) return null;
    return h('div', { className: 'listtools' },
      h('label', { className: 'mini-field', htmlFor: props.idp + 'bf' }, h('span', { className: 'sr' }, 'Filter brands'),
        h('input', { id: props.idp + 'bf', type: 'search', placeholder: 'Filter ' + L.all.length.toLocaleString('en-US') + ' brands by name or country', value: l2.q, onChange: function (e) { set({ q: e.target.value, sort: l2.sort, limit: 60 }); } })),
      h('label', { className: 'sort', htmlFor: props.idp + 'bs' }, 'Sort',
        h('select', { id: props.idp + 'bs', value: l2.sort, onChange: function (e) { set({ q: l2.q, sort: e.target.value, limit: 60 }); } },
          h('option', { value: 'data' }, 'Featured first'), h('option', { value: 'models' }, 'Most models'), h('option', { value: 'name' }, 'Name A–Z'))),
      h('span', { className: 'muted small' }, 'Showing ' + L.shown.length + ' of ' + L.filtered.length.toLocaleString('en-US')));
  }
  function BrandMore(props) {
    var L = brandList(props), l2 = props.l2;
    if (L.shown.length >= L.filtered.length) return null;
    return h('div', { className: 'more' }, h(P.Button, { onClick: function () { props.setL2({ q: l2.q, sort: l2.sort, limit: l2.limit + 120 }); } }, 'Show ' + Math.min(120, L.filtered.length - L.shown.length) + ' more brands'));
  }
  function TypeStage(props) {
    var t = T[props.r.type], L = brandList(props);
    return h('div', { className: dcls(t.domain) },
      h('div', { className: 'dhead' }, h('h2', null, t.name), h('span', { className: 'muted small' }, plural(t.brand_ids.length, 'brand'))),
      h(BrandTools, Object.assign({ idp: 's' }, props)),
      h('div', { className: 'grid grid--wide' }, L.shown.map(function (id) {
        var b = B[id], k = 'b:' + id, n = brandCount(t.id, id);
        return h(P.Card, Object.assign({ key: id, domain: t.domain, href: href(t.id, id), className: props.hover === k ? 'is-twin' : '',
          media: h(P.MonogramBadge, { name: b.name, monogram: b.logo.monogram, color: b.logo.monogram_color, imageUrl: b.logo.image_url, size: 72, showName: false }),
          title: b.name, meta: (b.founded_year ? 'Founded ' + b.founded_year + ' · ' : '') + country(b.headquarters) },
          twinProps(k, props.hover, props.setHover)), h('div', { className: 'card-foot' }, h('span', { className: 'pv-card__badge' }, plural(n, 'model') + ' in this type')));
      })),
      h(BrandMore, props));
  }
  function TypeNav(props) {
    var t = T[props.r.type], st = typeStats[t.id], off = st.products - st.onSale;
    return h(R.Fragment, null,
      h('div', { className: dcls(t.domain) },
        h('p', { className: 'eyebrow' }, t.domain + ' · ' + t.category),
        h('h1', { className: 'h1' }, t.name),
        h('p', { className: 'lede' }, t.description)),
      h('dl', { className: 'facts' },
        h('div', null, h('dt', null, 'Propulsion'), h('dd', null, t.propulsion || nul('Not in dataset'))),
        h('div', null, h('dt', null, 'Primary application'), h('dd', null, t.primary_application || nul('Not in dataset'))),
        h('div', null, h('dt', null, 'Price range (reference)'), h('dd', null, range(st.min, st.max, true) || nul('Not published'))),
        h('div', null, h('dt', null, 'Models in dataset'), h('dd', null, st.products.toLocaleString('en-US'), h('span', { className: 'muted small' }, ' · ' + st.photos.toLocaleString('en-US') + ' with photos; ' + st.onSale + ' confirmed on sale today')))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Brands'),
        h(BrandTools, Object.assign({ idp: 'n' }, props)),
        h('ul', { className: 'rows ' + dcls(t.domain) }, brandList(props).shown.map(function (id) {
          var b = B[id], k = 'b:' + id;
          return h('li', { key: id }, h('button', Object.assign({ className: 'row' + (props.hover === k ? ' is-twin' : ''), onClick: function () { go(href(t.id, id)); } }, twinProps(k, props.hover, props.setHover)),
            h('span', { className: 'name' }, b.name), h('span', { className: 'cat' }, country(b.headquarters) + (b.founded_year ? ' · since ' + b.founded_year : '')),
            h('span', { className: 'count' }, plural(brandCount(t.id, id), 'model'))));
        })),
        h(BrandMore, props)));
  }

  // ---------- websites ----------
  var SOCIAL = { x: 'X', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', youtube_handle: 'YouTube', linkedin: 'LinkedIn', tiktok: 'TikTok', weibo: 'Weibo', flickr: 'Flickr', telegram: 'Telegram', blog: 'Blog', mastodon: 'Mastodon' };
  function host(u) { try { return new URL(u).host.replace(/^www\./, ''); } catch (e) { return u; } }
  function ext(u, label) { return h('a', { className: 'extlink', href: u, target: '_blank', rel: 'noopener noreferrer' }, label || host(u)); }
  function Websites(props) {
    var w = props.b.websites || {}, soc = w.social || {};
    var os = useState(false), open = os[0], setOpen = os[1];
    var rows = [];
    (w.official || []).forEach(function (s, i) { rows.push(['Official website' + ((w.official.length > 1 && s.lang) ? ' (' + s.lang + ')' : ''), ext(s.url), s.note]); });
    if (!rows.length) rows.push(['Official website', nul('Not in dataset')]);
    rows.push(['Newsroom', w.newsroom ? ext(w.newsroom) : nul('Not found')]);
    rows.push(['Investor relations', w.investors ? ext(w.investors) : nul('Not found')]);
    rows.push(['Careers', w.careers ? ext(w.careers) : nul('Not found')]);
    if (w.wikipedia) rows.push(['Wikipedia', ext(w.wikipedia, 'Wikipedia article')]);
    var socKeys = Object.keys(SOCIAL).filter(function (k) { return soc[k] && soc[k].length; });
    var groups = w.group_sites || [];
    return h('div', { className: 'section' },
      h('h2', { className: 'h2' }, 'Websites and channels'),
      h('dl', { className: 'kv' }, rows.map(function (r, i) { return h(R.Fragment, { key: i }, h('dt', null, r[0]), h('dd', null, r[1], r[2] && h('span', { className: 'muted small' }, ' · ' + r[2]))); })),
      socKeys.length ? h('div', { className: 'social' }, socKeys.map(function (k) {
        var list = soc[k], first = list[0];
        return h('div', { key: k, className: 'soc' }, h('span', { className: 'soc-name' }, SOCIAL[k]),
          h('span', { className: 'soc-links' }, (open ? list : list.slice(0, 3)).map(function (u, i) { return h(R.Fragment, { key: i }, i ? ' · ' : '', ext(u, u.replace(/^https?:\/\/(www\.)?[^/]+\/(channel\/|company\/|@)?/, '').replace(/\/$/, '') || host(u))); }),
            !open && list.length > 3 && h('button', { className: 'linkbtn', onClick: function () { setOpen(true); } }, ' +' + (list.length - 3) + ' regional accounts')));
      })) : h('p', { className: 'muted small', style: { margin: 0 } }, 'No official social channels in dataset.'),
      groups.length ? h('details', { className: 'groupsites' }, h('summary', null, 'Group companies and regional sites (' + (w.group_sites_total || groups.length) + ')'),
        h('ul', null, groups.map(function (g, i) { return h('li', { key: i }, h('span', null, g.name), g.country && h('span', { className: 'muted small' }, ' · ' + g.country), ' ', ext(g.url)); })),
        (w.group_sites_total || 0) > groups.length && h('p', { className: 'muted small' }, 'Showing the first ' + groups.length + '.')) : null,
      h('p', { className: 'muted small', style: { margin: 0 } }, 'From Wikidata; newsroom, investor and careers pages found by checking the official site. Links open in a new tab.'));
  }

  // ---------- Level 3 ----------
  function listFor(props) {
    var all = productsOf(props.r.type, props.r.brand), l3 = props.l3;
    var f = sortProducts(filterProducts(all, l3.q), l3.sort);
    return { all: all, filtered: f, shown: f.slice(0, l3.limit) };
  }
  function ListTools(props) {
    var l3 = props.l3, set = props.setL3, L = listFor(props);
    return h('div', { className: 'listtools' },
      h('label', { className: 'mini-field', htmlFor: 'pf' }, h('span', { className: 'sr' }, 'Filter models'),
        h('input', { id: 'pf', type: 'search', placeholder: 'Filter ' + L.all.length.toLocaleString('en-US') + ' models by name or year', value: l3.q, onChange: function (e) { set({ q: e.target.value, sort: l3.sort, limit: 48 }); } })),
      h('label', { className: 'sort', htmlFor: 'ps' }, 'Sort',
        h('select', { id: 'ps', value: l3.sort, onChange: function (e) { set({ q: l3.q, sort: e.target.value, limit: 48 }); } },
          h('option', { value: 'data' }, 'Featured first'), h('option', { value: 'oldest' }, 'Oldest first'), h('option', { value: 'newest' }, 'Newest first'), h('option', { value: 'name' }, 'Name A–Z'), h('option', { value: 'photo' }, 'With photo first'))),
      h('span', { className: 'muted small' }, 'Showing ' + L.shown.length + ' of ' + L.filtered.length.toLocaleString('en-US')));
  }
  function MoreButton(props) {
    var L = listFor(props), l3 = props.l3;
    if (L.shown.length >= L.filtered.length) return null;
    return h('div', { className: 'more' }, h(P.Button, { onClick: function () { props.setL3({ q: l3.q, sort: l3.sort, limit: l3.limit + 96 }); } }, 'Show ' + Math.min(96, L.filtered.length - L.shown.length) + ' more'));
  }
  function BrandStage(props) {
    var t = T[props.r.type], b = B[props.r.brand], L = listFor(props), ps = L.shown;
    useChunks(chunksFor(ps));
    return h('div', { className: dcls(t.domain) },
      h('div', { className: 'dhead' }, h('h2', null, b.name), h('span', { className: 'muted small' }, plural(L.all.length, 'model') + ' · ' + t.name)),
      h(ListTools, props),
      !ps.length && h('p', { className: 'muted' }, 'No models match \u201c' + props.l3.q + '\u201d.'),
      h('div', { className: 'grid grid--wide' }, ps.map(function (p) {
        var k = 'p:' + p.id;
        return h(P.Card, Object.assign({ key: p.id, domain: t.domain, href: productHref(p), className: props.hover === k ? 'is-twin' : '',
          media: ProductMedia(p), title: p.name, meta: p.first_launched ? 'First launched ' + p.first_launched : 'Launch year not in dataset' }, twinProps(k, props.hover, props.setHover)),
          h('div', { className: 'card-foot' }, p.market_status ? h(P.StatusPill, { status: p.market_status }) : h('span', { className: 'muted small' }, 'Status not in dataset'),
            p.current_price_usd != null ? h('span', { className: 'price-sm' }, usdShort(p.current_price_usd)) : h('span', { className: 'muted small' }, p.source === 'curated' ? 'Not sold new' : 'Price not in dataset')));
      })),
      h(MoreButton, props));
  }
  function BrandNav(props) {
    var t = T[props.r.type], b = B[props.r.brand], L = listFor(props), ps = L.shown;
    function v(x) { return x || nul('Not in dataset'); }
    return h(R.Fragment, null,
      h('div', { className: dcls(t.domain) },
        h('p', { className: 'eyebrow' }, t.name),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 } },
          h(P.MonogramBadge, { name: b.name, monogram: b.logo.monogram, color: b.logo.monogram_color, imageUrl: b.logo.image_url, size: 48, showName: false }),
          h('h1', { className: 'h1', style: { margin: 0 } }, b.name)),
        brandTypes(b.id).length > 1 && h('p', { style: { margin: '12px 0 0' } }, h('a', { className: 'extlink', href: brandHref(b.id) }, 'See all ' + (BRAND_TOTAL[b.id] || 0).toLocaleString('en-US') + ' ' + b.name + ' models across ' + brandTypes(b.id).length + ' vehicle types \u2192'))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Models in ' + t.name),
        h(ListTools, props),
        ps.map(function (p) {
          var k = 'p:' + p.id;
          return h('div', Object.assign({ key: p.id, className: 'prod' + (props.hover === k ? ' is-twin' : '') }, twinProps(k, props.hover, props.setHover)),
            h('button', { className: 'prod-name', onClick: function () { go(productHref(p)); } }, p.name, Icon('next')),
            h('div', { className: 'chips', role: 'group', 'aria-label': p.name + ' timeline years' }, (p.timeline || []).map(function (e, i) {
              return h(P.FilterChip, { key: i, title: e.year + ': ' + e.event, 'aria-label': e.year + ': ' + e.event + '. Open ' + p.name, onClick: function () { go(productHref(p, e.year)); } }, e.year);
            })));
        }),
        h(MoreButton, props)),
      h(Websites, { b: b }),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Brand profile'),
        h('dl', { className: 'kv' },
          h('dt', null, 'Parent company'), h('dd', null, v(b.parent_company)),
          h('dt', null, 'Founded'), h('dd', null, v(b.founded_detail)),
          h('dt', null, 'Founders'), h('dd', null, v(b.founders)),
          h('dt', null, 'Headquarters'), h('dd', null, v(b.headquarters)),
          h('dt', null, 'First vehicle'), h('dd', null, v(b.first_vehicle_or_product)),
          h('dt', null, 'Company status'), h('dd', null, v(b.company_status)))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Brand evolution'),
        b.evolution_milestones && b.evolution_milestones.length ? h(P.Timeline, { items: b.evolution_milestones }) : nul('No milestones in dataset')),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Availability by region'),
        h(P.AvailabilityGrid, { regions: b.availability_by_region || {}, order: REGIONS, note: b.key_markets_note })));
  }

  // ---------- Brand: every model across all types ----------
  function allFor(props) {
    var id = props.r.brand, l3 = props.l3, types = brandTypes(id), all = [];
    types.forEach(function (tid) { all = all.concat(productsOf(tid, id)); });
    var f = filterProducts(all, l3.q);
    if (l3.tf) f = f.filter(function (p) { return p.type_id === l3.tf; });
    if (l3.sort !== 'data') f = sortProducts(f, l3.sort);
    return { types: types, all: all, filtered: f, shown: l3.limit === Infinity ? f : f.slice(0, l3.limit) };
  }
  function AllTools(props) {
    var l3 = props.l3, set = props.setL3, L = allFor(props), b = B[props.r.brand];
    function upd(o) { set(Object.assign({ q: l3.q, sort: l3.sort, limit: 96, tf: l3.tf }, o)); }
    return h('div', { className: 'listtools' },
      h('label', { className: 'mini-field', htmlFor: props.idp + 'af' }, h('span', { className: 'sr' }, 'Filter ' + b.name + ' models'),
        h('input', { id: props.idp + 'af', type: 'search', placeholder: 'Filter all ' + L.all.length.toLocaleString('en-US') + ' ' + b.name + ' models', value: l3.q, onChange: function (e) { upd({ q: e.target.value }); } })),
      L.types.length > 1 && h('label', { className: 'sort', htmlFor: props.idp + 'at' }, 'Type',
        h('select', { id: props.idp + 'at', value: l3.tf || '', onChange: function (e) { upd({ tf: e.target.value || null }); } },
          h('option', { value: '' }, 'All types'), L.types.map(function (tid) { return h('option', { key: tid, value: tid }, T[tid].name + ' (' + brandCount(tid, props.r.brand) + ')'); }))),
      h('label', { className: 'sort', htmlFor: props.idp + 'as' }, 'Sort',
        h('select', { id: props.idp + 'as', value: l3.sort, onChange: function (e) { upd({ sort: e.target.value }); } },
          h('option', { value: 'data' }, 'By vehicle type'), h('option', { value: 'oldest' }, 'Oldest first'), h('option', { value: 'newest' }, 'Newest first'), h('option', { value: 'name' }, 'Name A–Z'), h('option', { value: 'photo' }, 'With photo first'))),
      h('span', { className: 'muted small' }, 'Showing ' + L.shown.length.toLocaleString('en-US') + ' of ' + L.filtered.length.toLocaleString('en-US')));
  }
  function AllMore(props) {
    var L = allFor(props), l3 = props.l3;
    if (L.shown.length >= L.filtered.length) return null;
    var base = { q: l3.q, sort: l3.sort, tf: l3.tf };
    return h('div', { className: 'more' },
      h(P.Button, { onClick: function () { props.setL3(Object.assign({}, base, { limit: l3.limit + 192 })); } }, 'Show ' + Math.min(192, L.filtered.length - L.shown.length) + ' more'),
      h(P.Button, { variant: 'ghost', onClick: function () { props.setL3(Object.assign({}, base, { limit: Infinity })); } }, 'Show all ' + L.filtered.length.toLocaleString('en-US')));
  }
  function BrandAllStage(props) {
    var b = B[props.r.brand], L = allFor(props), ps = L.shown;
    useChunks(chunksFor(ps));
    var out = [], lastT = null, grouped = props.l3.sort === 'data';
    ps.forEach(function (p) {
      var t = T[p.type_id];
      if (grouped && p.type_id !== lastT) { lastT = p.type_id; out.push(h('h3', { key: 'h' + p.type_id, className: 'grouphead ' + dcls(t.domain) }, h('span', null, t.name), h('a', { className: 'extlink small', href: href(t.id, b.id) }, brandCount(t.id, b.id).toLocaleString('en-US') + ' models \u2192'))); }
      var k = 'p:' + p.id;
      out.push(h(P.Card, Object.assign({ key: p.id, domain: t.domain, href: productHref(p), className: props.hover === k ? 'is-twin' : '',
        media: ProductMedia(p), title: p.name, meta: (grouped ? '' : t.name + ' \u00b7 ') + (p.first_launched ? 'First launched ' + p.first_launched : 'Launch year not in dataset') }, twinProps(k, props.hover, props.setHover)),
        h('div', { className: 'card-foot' }, p.market_status ? h(P.StatusPill, { status: p.market_status }) : h('span', { className: 'muted small' }, 'Status not in dataset'),
          p.current_price_usd != null ? h('span', { className: 'price-sm' }, usdShort(p.current_price_usd)) : null)));
    });
    return h('div', null,
      h('div', { className: 'dhead' }, h('h2', null, b.name), h('span', { className: 'muted small' }, 'All ' + L.all.length.toLocaleString('en-US') + ' models \u00b7 ' + plural(L.types.length, 'vehicle type'))),
      h(AllTools, Object.assign({ idp: 's' }, props)),
      !ps.length && h('p', { className: 'muted' }, 'No models match.'),
      h('div', { className: 'grid grid--wide' }, out),
      h(AllMore, props));
  }
  function BrandAllNav(props) {
    var b = B[props.r.brand], L = allFor(props);
    function v(x) { return x || nul('Not in dataset'); }
    return h(R.Fragment, null,
      h('div', null,
        h('p', { className: 'eyebrow' }, 'Brand \u00b7 every model'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 } },
          h(P.MonogramBadge, { name: b.name, monogram: b.logo.monogram, color: b.logo.monogram_color, imageUrl: b.logo.image_url, size: 48, showName: false }),
          h('h1', { className: 'h1', style: { margin: 0 } }, b.name)),
        h('p', { className: 'lede muted' }, L.all.length.toLocaleString('en-US') + ' models across ' + plural(L.types.length, 'vehicle type') + (b.headquarters ? ' \u00b7 ' + b.headquarters : ''))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'By vehicle type'),
        h('ul', { className: 'rows' }, L.types.map(function (tid) {
          var t = T[tid];
          return h('li', { key: tid }, h('button', { className: 'row ' + dcls(t.domain), onClick: function () { go(href(tid, b.id)); } },
            h('span', { className: 'name' }, t.name), h('span', { className: 'cat' }, t.domain + ' \u00b7 ' + t.category), h('span', { className: 'count' }, plural(brandCount(tid, b.id), 'model'))));
        }))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'All models'),
        h(AllTools, Object.assign({ idp: 'n' }, props)),
        h('ul', { className: 'rows' }, L.shown.map(function (p) {
          var k = 'p:' + p.id;
          return h('li', { key: p.id }, h('button', Object.assign({ className: 'row' + (props.hover === k ? ' is-twin' : ''), onClick: function () { go(productHref(p)); } }, twinProps(k, props.hover, props.setHover)),
            h('span', { className: 'name' }, p.name), h('span', { className: 'cat' }, T[p.type_id].name + (p.first_launched ? ' \u00b7 ' + p.first_launched : '')), h('span', { className: 'count' }, p.img_chunk ? 'Photo' : '')));
        })),
        h(AllMore, props)),
      b.parent_company || b.founded_detail ? h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Brand profile'),
        h('dl', { className: 'kv' },
          h('dt', null, 'Parent company'), h('dd', null, v(b.parent_company)),
          h('dt', null, 'Founded'), h('dd', null, v(b.founded_detail)),
          h('dt', null, 'Headquarters'), h('dd', null, v(b.headquarters)),
          h('dt', null, 'Company status'), h('dd', null, v(b.company_status)))) : null,
      h(Websites, { b: b }));
  }

  // ---------- Level 4 ----------
  function ProductStage(props) {
    var p = PR[props.r.product], t = T[p.type_id];
    useChunks(p.img_chunk ? [p.img_chunk] : []);
    var cr = p.image_credit, file = p.image;
    var fileUrl = file ? 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file.replace(/ /g, '_')) : null;
    return h('div', { className: 'viewer ' + dcls(t.domain) },
      IMG[p.id] ? h('figure', { className: 'photo-frame' },
        h('img', { src: IMG[p.id], alt: p.name + ' (' + t.name + ')' }),
        h('figcaption', { className: 'credit' }, 'Photo: ', cr && cr.artist ? cr.artist : 'see file page', cr && cr.license ? ' · ' + cr.license : '', ' · ', ext(fileUrl, 'Wikimedia Commons')))
      : h('div', { className: 'viewer-box' }, h('div', null,
        h('div', { className: 'body', style: { background: p.model_3d.body_color || 'var(--surface-200)' }, 'aria-hidden': true }, t.icon_emoji),
        h('p', { className: 'soon' }, p.img_chunk ? 'Loading photo' : p.image ? 'Photo being added' : 'No free photo yet'),
        h('p', { className: 'muted small' }, file && !p.img_chunk ? 'A Commons photo exists and is still being added.' : 'No freely licensed photo of this model on Wikimedia Commons yet.'))),
      h('p', { className: 'muted small', style: { margin: 0 } }, '3D viewer coming next: a representative model of a ' + t.name + ', not an exact replica of ' + p.name + '.'));
  }
  function ProductNav(props) {
    var p = PR[props.r.product], t = T[p.type_id], b = B[p.brand_id];
    var sib = productsOf(t.id, b.id), i = sib.findIndex(function (x) { return x.id === p.id; });
    var hasBoth = p.launch_price_usd != null && p.current_price_usd != null;
    var diff = hasBoth ? p.current_price_usd - p.launch_price_usd : 0;
    var hi = props.r.year != null ? props.r.year : null;
    var spec = p.specs || {};
    function sv(x) { return x || nul('Not in dataset'); }
    return h(R.Fragment, null,
      h('div', { className: dcls(t.domain) },
        h('p', { className: 'eyebrow' }, b.name + ' · ' + t.name),
        h('h1', { className: 'h1' }, p.name),
        h('div', { style: { marginTop: 12 } }, p.market_status ? h(P.StatusPill, { status: p.market_status }) : h('span', { className: 'muted small' }, 'Sale status not in dataset'))),
      h('dl', { className: 'facts' },
        h('div', null, h('dt', null, 'First launched'), h('dd', null, p.first_launched || nul('Not in dataset'))),
        h('div', null, h('dt', null, 'Latest generation'), h('dd', null, sv(p.latest_generation))),
        h('div', null, h('dt', null, 'Market status'), h('dd', null, sv(p.market_status))),
        h('div', null, h('dt', null, 'Available new today'), h('dd', null, p.available_new_today == null ? nul('Not in dataset') : p.available_new_today ? 'Yes' : 'No'))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Price'),
        h('div', { className: 'prices' },
          h('div', { className: 'price' }, h('span', { className: 'lbl' }, 'Launch price'),
            p.launch_price_usd != null ? h('span', { className: 'val' }, usd(p.launch_price_usd)) : h('span', { className: 'val null' }, 'Launch price not published'),
            p.launch_price_note && h('span', { className: 'muted small' }, p.launch_price_note)),
          h('div', { className: 'price' }, h('span', { className: 'lbl' }, 'Current price'),
            p.current_price_usd != null ? h('span', { className: 'val' }, usd(p.current_price_usd)) : h('span', { className: 'val null' }, p.source === 'curated' ? 'Not sold new today' : 'Not in dataset'),
            p.current_price_note && h('span', { className: 'muted small' }, p.current_price_note)),
          hasBoth ? h('div', { className: 'delta' }, h('span', null, 'Price change since launch'),
            h('b', null, (diff >= 0 ? '+' : '−') + usd(Math.abs(diff)) + ' (' + (diff >= 0 ? '+' : '−') + Math.abs(diff / p.launch_price_usd * 100).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '%)'),
            h('span', { className: 'muted small' }, 'nominal, not inflation-adjusted'))
            : h('div', { className: 'delta' }, h('span', { className: 'muted small' }, 'Price change since launch: not available, because the launch and current prices are not both published.')),
          p.recorded_price && h('div', { className: 'delta ref' }, h('span', null, 'Recorded price'),
            h('b', null, Number(p.recorded_price.amount).toLocaleString('en-US') + ' ' + (p.recorded_price.unit || '')),
            h('span', { className: 'muted small' }, 'as recorded in Wikidata, in its original currency; not converted')),
          p.current_price_usd == null && h('div', { className: 'delta ref' }, h('span', null, 'Reference price'),
            p.reference_price_usd != null ? h('b', null, usd(p.reference_price_usd)) : nul('Not published'),
            h('span', { className: 'muted small' }, 'latest known base or unit price, not a current sale price')))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Specifications'),
        h('dl', { className: 'kv' },
          h('dt', null, 'Powertrain / engine'), h('dd', null, sv(spec.powertrain)),
          h('dt', null, 'Performance'), h('dd', null, sv(spec.performance)),
          h('dt', null, 'Capacity / size'), h('dd', null, sv(spec.capacity_size)),
          h('dt', null, 'Key features'), h('dd', null, sv(spec.key_features)))),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Evolution'),
        p.timeline && p.timeline.length ? h(P.Timeline, { items: p.timeline, highlight: hi }) : nul('No timeline in dataset')),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Where it’s available'),
        h('p', { className: 'muted small', style: { margin: 0 } }, 'Brand-level availability for ' + b.name + '.'),
        h(P.AvailabilityGrid, { regions: b.availability_by_region || {}, order: REGIONS, note: b.key_markets_note })),
      h('div', { className: 'section' },
        h('h2', { className: 'h2' }, 'Sources'),
        h('ul', { className: 'srcs' },
          h('li', null, p.source === 'curated' ? 'Prices, status and specs: original Vehicle Universe dataset.' : p.source === 'spreadsheet' ? 'Model facts: your Vehicle Brands & Models spreadsheets (Wikidata export). Prices and sale status are rarely recorded there.' : 'Model facts: Wikidata (CC0). Prices and sale status are not recorded there.'),
          p.model_website && h('li', null, 'Model website: ', ext(p.model_website)),
          p.manufacturers && h('li', null, 'Manufacturer(s) recorded: ' + p.manufacturers),
          p.wikipedia && h('li', null, ext(p.wikipedia, 'Wikipedia article')),
          p.wikidata && h('li', null, ext('https://www.wikidata.org/wiki/' + p.wikidata, 'Wikidata item ' + p.wikidata)),
          p.image && h('li', null, 'Photo: ', ext('https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(p.image.replace(/ /g, '_')), p.image)))),
      h('div', null, h(P.ConfidenceBadge, { level: p.data_confidence })),
      h('div', { className: 'pager' },
        h(P.Button, { disabled: i <= 0, onClick: function () { go(productHref(sib[i - 1])); }, 'aria-label': i > 0 ? 'Previous: ' + sib[i - 1].name : 'No previous product' }, Icon('back'), 'Previous'),
        h('span', { className: 'muted small' }, (i + 1) + ' of ' + sib.length + ' from ' + b.name),
        h(P.Button, { disabled: i >= sib.length - 1, onClick: function () { go(productHref(sib[i + 1])); }, 'aria-label': i < sib.length - 1 ? 'Next: ' + sib[i + 1].name : 'No next product' }, 'Next', Icon('next'))));
  }

  // ---------- Search box ----------
  function Search() {
    var s = useState(''), q = s[0], setQ = s[1];
    var o = useState(false), open = o[0], setOpen = o[1];
    var a = useState(0), act = a[0], setAct = a[1];
    var sv = useState(0), sver = sv[0], bumpS = sv[1];
    useEffect(function () { var f = function () { bumpS(function (x) { return x + 1; }); }; searchListeners.push(f); return function () { searchListeners = searchListeners.filter(function (g) { return g !== f; }); }; }, []);
    var groups = useMemo(function () { return search(q); }, [q, sver]);
    var flat = []; groups.forEach(function (g) { g.items.forEach(function (it) { flat.push(it); }); });
    var wrap = useRef(null);
    useEffect(function () {
      function f(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); }
      document.addEventListener('mousedown', f); return function () { document.removeEventListener('mousedown', f); };
    }, []);
    function pick(it) { go(it.to); setQ(''); setOpen(false); }
    var n = -1;
    return h('div', { className: 'search-wrap', ref: wrap },
      h(P.SearchField, { id: 'q', label: 'Search types, brands and products', value: q, autoComplete: 'off', role: 'combobox', 'aria-expanded': open && !!q, 'aria-controls': 'results',
        onChange: function (e) { setQ(e.target.value); setOpen(true); setAct(0); },
        onFocus: function () { setOpen(true); loadSearch(); },
        onKeyDown: function (e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAct(Math.min(act + 1, flat.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(Math.max(act - 1, 0)); }
          else if (e.key === 'Enter' && flat[act]) pick(flat[act]);
          else if (e.key === 'Escape') setOpen(false);
        } }),
      open && q.trim() && h('div', { className: 'results', id: 'results', role: 'listbox' },
        groups.length ? groups.map(function (g) {
          return h('div', { key: g.kind }, h('h3', null, g.kind), g.items.map(function (it) {
            n++; var mine = n;
            return h('button', { key: it.to + it.label, role: 'option', 'aria-selected': mine === act, className: mine === act ? 'is-active' : '', onMouseDown: function (e) { e.preventDefault(); }, onClick: function () { pick(it); } },
              h('span', null, it.label), h('span', null, it.sub));
          }));
        }) : h('p', { className: 'empty' }, 'Nothing matches “' + q + '”. Try a type (“rocket”), a brand or a model name.')));
  }

  // ---------- theme ----------
  function initialTheme() {
    try { var s = localStorage.getItem('vu-theme'); if (s === 'light' || s === 'dark') return s; } catch (e) {}
    var stamped = document.documentElement.getAttribute('data-theme');
    if (stamped === 'light' || stamped === 'dark') return stamped;
    return 'dark';
  }

  // ---------- App ----------
  function App() {
    var rs = useState(parse(location.hash)), r = rs[0], setR = rs[1];
    var hs = useState(null), hover = hs[0], setHover = hs[1];
    var fs = useState('All'), filter = fs[0], setFilter = fs[1];
    var ss = useState('data'), sort = ss[0], setSort = ss[1];
    var ts = useState(initialTheme), theme = ts[0], setTheme = ts[1];
    var stage = useRef(null), nav = useRef(null);
    useEffect(function () {
      function f() { setR(parse(location.hash)); setHover(null); if (stage.current) stage.current.scrollTop = 0; if (nav.current) nav.current.scrollTop = 0; }
      window.addEventListener('hashchange', f); return function () { window.removeEventListener('hashchange', f); };
    }, []);
    var tl = useState(0), bumpT = tl[1];
    useEffect(function () { var f = function () { bumpT(function (x) { return x + 1; }); setR(parse(location.hash)); }; typeListeners.push(f); return function () { typeListeners = typeListeners.filter(function (g) { return g !== f; }); }; }, []);
    useEffect(function () { if (r.type) loadType(r.type); if (r.level === 5) brandTypes(r.brand).forEach(loadType); }, [r.type, r.level, r.brand]);
    useEffect(function () { var id = setTimeout(loadSearch, 1500); return function () { clearTimeout(id); }; }, []);
    useEffect(function () { document.documentElement.setAttribute('data-theme', theme); try { localStorage.setItem('vu-theme', theme); } catch (e) {} }, [theme]);

    var groups = useMemo(function () { return visibleTypes(filter, sort); }, [filter, sort]);
    var t = r.type && T[r.type], b = r.brand && B[r.brand], p = r.product && PR[r.product];
    var crumbs = [{ label: 'Home', href: '#/', onClick: function () { setFilter('All'); } }];
    if (t) {
      crumbs.push({ label: t.domain, href: '#/', domain: t.domain, onClick: function () { setFilter(t.domain); } });
      crumbs.push({ label: t.name, href: href(t.id), domain: t.domain });
    }
    if (b && r.level === 5) crumbs.push({ label: b.name + ' \u2014 all models', href: brandHref(b.id) });
    else if (b) crumbs.push({ label: b.name, href: href(t.id, b.id), domain: t.domain });
    if (p) crumbs.push({ label: p.name, href: productHref(p), domain: t.domain });
    if (crumbs.length === 1) crumbs[0] = { label: 'Home' };
    var parent = r.level === 4 ? href(r.type, r.brand) : r.level === 3 ? href(r.type) : '#/';
    function back() { go(parent); }

    var l3s = useState({ q: '', sort: 'data', limit: 48, key: '' }), l3 = l3s[0], setL3raw = l3s[1];
    var l3key = (r.level === 5 ? 'all' : r.type) + '/' + r.brand;
    if (l3.key !== l3key) { l3 = { q: '', sort: 'data', limit: r.level === 5 ? 96 : 48, key: l3key, tf: null }; }
    function setL3(v) { setL3raw(Object.assign({ key: l3key }, v)); }
    var l2s = useState({ q: '', sort: 'data', limit: 60, key: '' }), l2 = l2s[0], setL2raw = l2s[1];
    if (l2.key !== r.type) { l2 = { q: '', sort: 'data', limit: 60, key: r.type }; }
    function setL2(v) { setL2raw(Object.assign({ key: r.type }, v)); }
    var sp = { r: r, hover: hover, setHover: setHover, l3: l3, setL3: setL3, l2: l2, setL2: setL2 };
    var pending = r.level === 5 ? brandTypes(r.brand).filter(function (x) { return !PRODUCTS[x]; }) : (r.level >= 3 && !PRODUCTS[r.type] ? [r.type] : []);
    var needs = pending.length > 0;
    var failed = pending.some(function (x) { return !TYPE_LOAD[x]; });
    function Loading() { return h('div', { className: 'boot' }, h('div', null, h('b', null, 'Loading'), failed ? 'Could not load this section. Reload to try again.' : r.level === 5 ? 'Collecting every ' + B[r.brand].name + ' model from ' + plural(brandTypes(r.brand).length, 'vehicle type') + '\u2026' : 'Fetching every ' + T[r.type].name.toLowerCase() + ' model\u2026')); }
    var Stage = needs ? Loading : [null, HomeStage, TypeStage, BrandStage, ProductStage, BrandAllStage][r.level];
    var Nav = needs ? function () { return null; } : [null, HomeNav, TypeNav, BrandNav, ProductNav, BrandAllNav][r.level];
    var key = location.hash || '#/';
    document.title = 'Vehicle Universe';

    return h(R.Fragment, null,
      h('header', { className: 'top' },
        h('a', { className: 'brand', href: '#/', 'aria-label': 'Vehicle Universe by Pujiverse, home' },
          h('span', { className: 'logo-chip' }, h('img', { className: 'lockup', src: window.VU_LOCKUP, alt: '' }), h('img', { className: 'mark', src: window.VU_MARK, alt: '' })),
          h('span', { className: 'site-title' }, h('b', null, 'Vehicle Universe'), h('span', null, 'by Pujiverse'))),
        h(Search),
        h('div', { className: 'tools' },
          h(P.Button, { className: 'icon-btn', 'aria-label': theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', title: theme === 'dark' ? 'Light theme' : 'Dark theme', onClick: function () { setTheme(theme === 'dark' ? 'light' : 'dark'); } }, Icon(theme === 'dark' ? 'sun' : 'moon')))),
      h('div', { className: 'navrow' },
        h(P.Button, { variant: 'ghost', size: 'sm', disabled: r.level === 1, onClick: back, 'aria-label': 'Back' }, Icon('back'), 'Back'),
        h(P.Breadcrumb, { items: crumbs })),
      h('main', { className: 'split' },
        h('section', { className: 'stage', ref: stage, 'aria-label': 'Visual stage' }, h('div', { className: 'fade', key: 's' + key }, h(Stage, Object.assign({ groups: groups }, sp)))),
        h('section', { className: 'nav', ref: nav, 'aria-label': 'Navigator' },
          h(R.Fragment, { key: 'n' + key }, h(Nav, Object.assign({ groups: groups, filter: filter, setFilter: setFilter, sort: sort, setSort: setSort }, sp))),
          h('p', { className: 'foot' }, 'Data snapshot mid-2026. Curated prices are approximate and converted to USD; launch prices are nominal. The full model catalogue comes from Wikidata (CC0) and the owner\u2019s Vehicle Brands & Models spreadsheets, which list individual vessels, locomotives and museum exhibits where Wikidata records them; photos come from Wikimedia Commons under their own free licences, credited on each photo. Brand names and logos belong to their owners, and monogram colours are generated, not brand colours. Informational use only.'))));
  }

  ReactDOM.createRoot(document.getElementById('app')).render(h(App));
}
