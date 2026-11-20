/* =========================================================
   그랑쉐프몰 GRANDCHEF MALL — 1차 시안 앱 로직
   해시 라우팅 · 상품 카탈로그 · 장바구니(localStorage) · 주문서
   ※ 결제(PG) 미연동: 주문서 저장과 안내 모달까지만 동작합니다.
   ========================================================= */
(function () {
  'use strict';

  var D = window.GC_DATA;
  var P = D.products;
  var CO = D.company;
  var SHIP = D.shipping;

  var CART_KEY = 'gc_cart_v1';
  var ORDER_KEY = 'gc_orders_v1';
  var FORM_KEY = 'gc_checkout_v1';

  /* ── 유틸 ─────────────────────────────────────────── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '₩' + Number(n || 0).toLocaleString('ko-KR'); }
  function readJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function byId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function todayNo() {
    var d = new Date();
    return 'GC' + pad(d.getFullYear() % 100, 2) + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) +
      '-' + pad(Math.floor(Math.random() * 9000) + 1000, 4);
  }
  function dateStr(iso) {
    var d = new Date(iso);
    return d.getFullYear() + '.' + pad(d.getMonth() + 1, 2) + '.' + pad(d.getDate(), 2) + ' ' +
      pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2);
  }

  /* ── 상태 ─────────────────────────────────────────── */
  var cart = readJSON(CART_KEY, []).filter(function (it) {
    var p = byId(it.pid);
    return p && p.options[it.oi] && typeof p.options[it.oi].price === 'number' && it.qty > 0;
  });
  var orders = readJSON(ORDER_KEY, []);
  var savedForm = readJSON(FORM_KEY, {});
  var ui = { cat: 'all', q: '', sort: 'reco' };
  var pdpState = { id: null, oi: 0, qty: 1 };
  var shippingMethod = savedForm.shipping === 'parcel' ? 'parcel' : 'direct';

  function saveCart() { writeJSON(CART_KEY, cart); syncCartUI(); }
  function cartCount() { return cart.reduce(function (s, it) { return s + it.qty; }, 0); }
  function cartLines() {
    return cart.map(function (it) {
      var p = byId(it.pid);
      var op = p.options[it.oi];
      return { key: it.pid + '::' + it.oi, pid: it.pid, oi: it.oi, qty: it.qty, product: p, option: op, price: op.price, line: op.price * it.qty };
    });
  }
  function cartSubtotal() { return cartLines().reduce(function (s, l) { return s + l.line; }, 0); }
  function shipFee(subtotal, method) {
    var cfg = SHIP[method] || SHIP.direct;
    return subtotal >= SHIP.freeOver ? 0 : cfg.fee;
  }

  /* ── 공통 조각 ────────────────────────────────────── */
  function priceLabel(op) {
    return typeof op.price === 'number' ? money(op.price) : '회원/견적 협의';
  }
  function fromPrice(p) {
    var prices = p.options.map(function (o) { return o.price; }).filter(function (v) { return typeof v === 'number'; });
    if (!prices.length) return { html: '<b class="quote">회원/견적 협의</b><em>수량·규격 상담</em>' };
    var min = Math.min.apply(null, prices);
    var multi = p.options.length > 1;
    return { html: '<b>' + money(min) + '</b><em>' + (multi ? '시안 예시가 · 최저가 기준' : '시안 예시가') + '</em>' };
  }
  function catName(id) { return id === 'biz' ? '업소·식당용' : id === 'home' ? '가정·선물용' : '전체 상품'; }

  function productCard(p) {
    var f = fromPrice(p);
    return '' +
      '<article class="pcard">' +
        '<a class="pcard-media" href="#/p/' + p.id + '" aria-label="' + esc(p.name) + ' 상세보기">' +
          '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy" width="1100" height="1100">' +
          '<span class="badge ' + (p.cat === 'biz' ? 'biz' : '') + '">' + catName(p.cat) + '</span>' +
        '</a>' +
        '<div class="pcard-body">' +
          '<p class="pcard-sub">' + esc(p.sub) + '</p>' +
          '<h3 class="pcard-name"><a href="#/p/' + p.id + '">' + esc(p.name) + '</a></h3>' +
          '<p class="pcard-spec">' + esc(p.spec) + '</p>' +
          '<div class="pcard-foot">' +
            '<span class="price">' + f.html + '</span>' +
            '<button class="add-btn" data-act="add" data-pid="' + p.id + '" data-oi="0">장바구니 담기</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function filteredProducts() {
    var q = ui.q.trim().toLowerCase();
    var list = P.filter(function (p) {
      if (ui.cat !== 'all' && p.cat !== ui.cat) return false;
      if (!q) return true;
      var hay = (p.name + ' ' + p.spec + ' ' + p.sub + ' ' + p.tags).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (ui.sort === 'low') list.sort(function (a, b) { return minPrice(a) - minPrice(b); });
    else if (ui.sort === 'high') list.sort(function (a, b) { return minPrice(b) - minPrice(a); });
    else if (ui.sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ko'); });
    return list;
  }
  function minPrice(p) {
    var prices = p.options.map(function (o) { return o.price; }).filter(function (v) { return typeof v === 'number'; });
    return prices.length ? Math.min.apply(null, prices) : Infinity;
  }

  /* ── 홈 ───────────────────────────────────────────── */
  function renderHome() {
    var list = filteredProducts();
    var bizCount = P.filter(function (p) { return p.cat === 'biz'; }).length;
    var homeCount = P.filter(function (p) { return p.cat === 'home'; }).length;

    var hero = '' +
      '<section class="hero">' +
        '<div class="wrap hero-grid">' +
          '<div class="hero-copy">' +
            '<p class="kicker">GRANDCHEF MALL · 주방용품 공식 판매몰</p>' +
            '<h1>주방의 시작을,<br><span class="accent">그랑쉐프</span>에서.</h1>' +
            '<p class="hero-lead">식당·급식소의 대형 볶음솥부터 집에서 매일 쓰는 냄비까지. 2001년부터 부산에서 만들고 보내 온 주방용품을 이제 그랑쉐프몰에서 직접 주문하세요.</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-dark" href="#/c/biz">업소용 상품 보기</a>' +
              '<a class="btn btn-line" href="#/c/home">가정·선물용 보기</a>' +
            '</div>' +
            '<div class="hero-trust">' +
              '<span>부울경 화물 직배송</span><span>5만원 이상 무료배송</span>' +
              '<span>세금계산서 발행</span><span>업소 정기납품</span>' +
            '</div>' +
          '</div>' +
          '<div class="hero-visual">' +
            '<figure class="hv hv-main" style="margin:0"><img src="assets/products/pro-01-wok-griddle.jpg" alt="업소용 대형 스테인리스 볶음솥과 전판" width="1100" height="1100" fetchpriority="high"><figcaption class="hv-tag">업소용 대형 볶음솥 · 40~60cm</figcaption></figure>' +
            '<figure class="hv hv-sub" style="margin:0"><img src="assets/products/pro-02-coated-pan.jpg" alt="업소용 코팅 프라이팬과 웍" loading="lazy" width="1100" height="1100"></figure>' +
            '<div class="hv hv-card">' +
              '<small>FOR RESTAURANT</small>' +
              '<strong>업소용 조리기물<br>한 번에 갖추기</strong>' +
              '<span>볶음솥 · 코팅팬 · 밧드 · 뚝배기</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';

    var quick = '' +
      '<section class="quick">' +
        '<div class="wrap">' +
          '<div class="quick-head">' +
            '<div><p class="kicker" style="margin-bottom:8px">SHOP BY CATEGORY</p><h2 class="sec-title">무엇을 찾으시나요?</h2></div>' +
            '<a class="link-arrow" href="#/c/all">전체 상품 보기 <span aria-hidden="true">→</span></a>' +
          '</div>' +
          '<div class="quick-grid">' +
            qcard('assets/products/pro-01-wok-griddle.jpg', '업소 조리기물', '볶음솥·전판·국솥', bizCount, 'biz') +
            qcard('assets/products/pro-03-bat-fryer.jpg', '업소 밧드·식기', '밧드·튀김·뚝배기', bizCount, 'biz') +
            qcard('assets/products/cat-01-pot.jpg', '가정 냄비·팬', '냄비·압력솥·프라이팬', homeCount, 'home') +
            qcard('assets/products/cat-05-plate.jpg', '식기·선물', '그릇·머그·선물세트', homeCount, 'home') +
          '</div>' +
        '</div>' +
      '</section>';

    var catalog = '' +
      '<section class="catalog" id="catalog">' +
        '<div class="wrap">' +
          '<div class="catalog-head">' +
            '<h2 class="sec-title">' + catName(ui.cat) + ' <span class="count">' + list.length + '개</span></h2>' +
            '<p class="sec-lead">' +
              (ui.q ? '“' + esc(ui.q) + '” 검색 결과입니다. ' : '') +
              '규격·수량에 따라 가격이 달라지는 품목은 회원/견적 협의로 표시했습니다. 실제 판매가는 확정 후 반영됩니다.' +
            '</p>' +
          '</div>' +
          '<div class="toolbar">' +
            '<div class="chips" role="group" aria-label="카테고리 필터">' +
              chip('all', '전체') + chip('biz', '업소·식당용') + chip('home', '가정·선물용') +
            '</div>' +
            '<div class="toolbar-right">' +
              '<label for="sortSel">정렬</label>' +
              '<select id="sortSel" class="sort" data-act="sort">' +
                '<option value="reco"' + (ui.sort === 'reco' ? ' selected' : '') + '>추천순</option>' +
                '<option value="low"' + (ui.sort === 'low' ? ' selected' : '') + '>낮은 가격순</option>' +
                '<option value="high"' + (ui.sort === 'high' ? ' selected' : '') + '>높은 가격순</option>' +
                '<option value="name"' + (ui.sort === 'name' ? ' selected' : '') + '>이름순</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          (list.length
            ? '<div class="grid-products">' + list.map(productCard).join('') + '</div>'
            : '<div class="empty"><h3>찾으시는 상품이 없습니다</h3><p>다른 검색어로 찾아보시거나, 필요한 품목을 견적으로 문의해 주세요.</p><a class="btn btn-line" href="#/c/all">전체 상품 보기</a></div>') +
        '</div>' +
      '</section>';

    var b2b = '' +
      '<section class="b2b">' +
        '<div class="wrap b2b-grid">' +
          '<div>' +
            '<p class="kicker">FOR RESTAURANT &amp; FOODSERVICE</p>' +
            '<h2>식당·급식소 납품은<br>견적으로 한 번에 정리합니다.</h2>' +
            '<p>필요한 품목과 수량을 알려 주시면 규격·단가를 정리해 회신합니다. 부울경은 화물 직배송, 그 외 지역은 택배로 보내며 정기 납품 일정도 함께 맞춥니다.</p>' +
            '<dl class="b2b-list">' +
              '<div><dt>DELIVERY</dt><dd>부울경 화물 직배송<br>전국 택배</dd></div>' +
              '<div><dt>TAX</dt><dd>세금계산서 발행<br>무통장입금</dd></div>' +
              '<div><dt>STOCK</dt><dd>정기 납품<br>대량 견적</dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="b2b-card">' +
            '<h3>대량·정기납품 문의</h3>' +
            '<p>품목·수량을 메일로 보내 주시면 영업일 기준으로 회신드립니다.</p>' +
            '<a class="mail" href="mailto:' + CO.emails[0] + '">' + CO.emails[0] + '</a>' +
            '<a class="mail" href="mailto:' + CO.emails[1] + '">' + CO.emails[1] + '</a>' +
            '<p class="tel">' + CO.tel + '</p>' +
            '<p style="margin-bottom:14px">평일 08:30 – 17:30</p>' +
            '<button class="btn btn-bronze btn-block btn-sm" data-act="quote" data-pid="" data-oi="">견적 요청서 작성</button>' +
          '</div>' +
        '</div>' +
      '</section>';

    return hero + quick + catalog + b2b;
  }

  function qcard(img, title, sub, count, cat) {
    return '<a class="qcard" href="#/c/' + cat + '">' +
      '<div class="qcard-img"><img src="' + img + '" alt="' + esc(title) + '" loading="lazy" width="1100" height="1100"></div>' +
      '<div class="qcard-txt"><div><strong>' + title + '</strong><br><span>' + sub + '</span></div><em aria-hidden="true">→</em></div>' +
      '</a>';
  }
  function chip(id, label) {
    return '<button class="chip" data-act="filter" data-cat="' + id + '" aria-pressed="' + (ui.cat === id) + '">' + label + '</button>';
  }

  /* ── 상품 상세 ─────────────────────────────────────── */
  function renderPDP(id) {
    var p = byId(id);
    if (!p) return notFound();
    if (pdpState.id !== id) { pdpState = { id: id, oi: 0, qty: 1 }; }
    var op = p.options[pdpState.oi] || p.options[0];
    var isQuote = typeof op.price !== 'number';
    var total = isQuote ? null : op.price * pdpState.qty;

    var opts = p.options.map(function (o, i) {
      return '<button class="opt" data-act="opt" data-oi="' + i + '" aria-pressed="' + (i === pdpState.oi) + '">' +
        esc(o.label) + '<small>' + priceLabel(o) + '</small></button>';
    }).join('');

    var specs = p.specs.map(function (row) {
      return '<tr><th>' + esc(row[0]) + '</th><td>' + esc(row[1]) + '</td></tr>';
    }).join('');

    return '' +
      '<div class="wrap crumbs"><a href="#/">홈</a><span>/</span><a href="#/c/' + p.cat + '">' + catName(p.cat) + '</a><span>/</span><span>' + esc(p.name) + '</span></div>' +
      '<div class="wrap pdp">' +
        '<div class="pdp-grid">' +
          '<div class="pdp-media">' +
            '<img src="' + p.img + '" alt="' + esc(p.name) + '" width="1100" height="1100">' +
            '<div class="pdp-media-note"><span>이미지 예시 · 실제 상품과 다를 수 있습니다</span><span>' + esc(p.sub) + '</span></div>' +
          '</div>' +
          '<div class="pdp-info">' +
            '<p class="pdp-cat">' + catName(p.cat) + ' <span>' + esc(p.sub) + '</span></p>' +
            '<h1>' + esc(p.name) + '</h1>' +
            '<p class="pdp-spec">' + esc(p.spec) + '</p>' +
            '<div class="pdp-price">' +
              (isQuote
                ? '<div class="amount">회원/견적 협의</div><span class="unit">수량·규격 확인 후 안내</span>'
                : '<div class="amount" id="pdpAmount">' + money(op.price) + '</div><span class="unit">/ ' + esc(p.unit) + '</span>') +
              '<div class="note">※ 시안 예시가 — 실제 판매가 아님</div>' +
            '</div>' +
            '<p class="pdp-desc">' + esc(p.desc) + '</p>' +
            '<div class="opt-head"><strong>옵션 선택</strong><span>규격에 따라 가격이 다릅니다</span></div>' +
            '<div class="opts" role="group" aria-label="옵션">' + opts + '</div>' +
            '<div class="qty-row"><span>수량</span>' +
              '<div class="qty">' +
                '<button data-act="pdpqty" data-d="-1" aria-label="수량 줄이기">−</button>' +
                '<input type="number" id="pdpQty" value="' + pdpState.qty + '" min="1" max="99" inputmode="numeric" aria-label="수량">' +
                '<button data-act="pdpqty" data-d="1" aria-label="수량 늘리기">+</button>' +
              '</div>' +
              '<span class="muted" style="font-size:11.5px">최대 99' + esc(p.unit) + '</span>' +
            '</div>' +
            '<div class="pdp-total"><span>선택 금액</span><b id="pdpTotal">' + (isQuote ? '견적 협의' : money(total)) + '</b></div>' +
            '<div class="pdp-actions">' +
              (isQuote
                ? '<button class="btn btn-bronze" data-act="quote" data-pid="' + p.id + '" data-oi="' + pdpState.oi + '">견적 요청</button>' +
                  '<a class="btn btn-line" href="mailto:' + CO.emails[1] + '?subject=' + encodeURIComponent('[그랑쉐프몰] ' + p.name + ' 견적 문의') + '">메일로 문의</a>'
                : '<button class="btn btn-dark" data-act="add" data-pid="' + p.id + '" data-oi="' + pdpState.oi + '" data-qty="' + pdpState.qty + '">장바구니 담기</button>' +
                  '<button class="btn btn-bronze" data-act="buynow" data-pid="' + p.id + '" data-oi="' + pdpState.oi + '" data-qty="' + pdpState.qty + '">바로 주문</button>') +
            '</div>' +
            '<dl class="pdp-meta">' +
              '<div><dt>배송</dt><dd>부울경 화물 직배송 / 전국 택배 · 5만원 이상 무료</dd></div>' +
              '<div><dt>결제</dt><dd>신용카드 · 간편결제 · 무통장입금(세금계산서 발행)</dd></div>' +
              '<div><dt>문의</dt><dd>' + CO.tel + ' · ' + CO.emails[0] + '</dd></div>' +
            '</dl>' +
          '</div>' +
        '</div>' +
        '<div class="pdp-detail">' +
          '<div><h2>상품 정보</h2><table class="spec-table"><tbody>' + specs + '</tbody></table></div>' +
          '<div><h2>주문 전 확인</h2><ul>' +
            '<li>표시 금액은 1차 시안용 예시가이며, 실제 판매가는 확정 후 반영됩니다.</li>' +
            '<li>업소용 대형 품목(60cm 이상)은 수량·배송 지역에 따라 견적으로 안내합니다.</li>' +
            '<li>부울경 외 지역은 택배로 발송되며, 도서산간은 배송비가 추가될 수 있습니다.</li>' +
            '<li>세금계산서 발행이 필요한 경우 주문서에서 무통장입금을 선택하고 사업자 정보를 적어 주세요.</li>' +
            '<li>현재 결제(PG)는 연동 전이라 주문서 저장까지만 진행됩니다.</li>' +
          '</ul></div>' +
        '</div>' +
      '</div>';
  }

  function notFound() {
    return '<div class="page"><div class="wrap"><div class="empty"><h3>페이지를 찾을 수 없습니다</h3><p>주소가 바뀌었거나 없는 상품입니다.</p><a class="btn btn-dark" href="#/">홈으로</a></div></div></div>';
  }

  /* ── 장바구니 ─────────────────────────────────────── */
  function renderCart() {
    var lines = cartLines();
    if (!lines.length) {
      return '<div class="page"><div class="wrap">' +
        '<div class="page-head"><div><h1>장바구니</h1><p>담은 상품이 없습니다.</p></div></div>' +
        '<div class="empty"><h3>장바구니가 비어 있습니다</h3><p>업소용 조리기물부터 가정용 냄비까지, 필요한 품목을 담아 보세요.</p>' +
        '<a class="btn btn-dark" href="#/c/all">상품 둘러보기</a></div></div></div>';
    }
    var sub = cartSubtotal();
    var fee = shipFee(sub, 'parcel');
    var items = lines.map(function (l) {
      return '<div class="cart-item">' +
        '<a class="ci-img" href="#/p/' + l.pid + '"><img src="' + l.product.img + '" alt="' + esc(l.product.name) + '" loading="lazy"></a>' +
        '<div class="ci-main">' +
          '<p class="ci-sub">' + catName(l.product.cat) + ' · ' + esc(l.product.sub) + '</p>' +
          '<p class="ci-name"><a href="#/p/' + l.pid + '">' + esc(l.product.name) + '</a></p>' +
          '<p class="ci-opt">옵션 ' + esc(l.option.label) + ' · ' + priceLabel(l.option) + '</p>' +
          '<div class="ci-tools">' +
            '<div class="qty">' +
              '<button data-act="qty" data-key="' + l.key + '" data-d="-1" aria-label="수량 줄이기">−</button>' +
              '<input type="number" value="' + l.qty + '" min="1" max="99" data-act="qtyinput" data-key="' + l.key + '" aria-label="수량">' +
              '<button data-act="qty" data-key="' + l.key + '" data-d="1" aria-label="수량 늘리기">+</button>' +
            '</div>' +
            '<button class="ci-remove" data-act="remove" data-key="' + l.key + '">삭제</button>' +
          '</div>' +
        '</div>' +
        '<div class="ci-price">' + money(l.line) + '<small>' + money(l.price) + ' × ' + l.qty + '</small></div>' +
      '</div>';
    }).join('');

    return '<div class="page"><div class="wrap">' +
      '<div class="page-head">' +
        '<div><h1>장바구니</h1><p>담은 상품 ' + lines.length + '종 · 총 ' + cartCount() + '개</p></div>' +
        '<div class="steps"><b>01 장바구니</b><i>›</i><span>02 주문서</span><i>›</i><span>03 주문 확인</span></div>' +
      '</div>' +
      '<div class="cart-layout">' +
        '<div class="panel">' +
          '<div class="panel-head"><h2>담은 상품</h2><span>수량 변경 시 합계가 바로 반영됩니다</span></div>' +
          items +
          '<div class="cart-foot"><span>배송비는 주문서에서 배송 방법을 고르면 확정됩니다.</span><button data-act="clear">장바구니 비우기</button></div>' +
        '</div>' +
        '<aside class="summary"><div class="panel">' +
          '<div class="panel-head"><h2>결제 예정 금액</h2></div>' +
          '<div class="panel-body">' +
            '<div class="sum-line"><span>상품 합계</span><b>' + money(sub) + '</b></div>' +
            '<div class="sum-line"><span>배송비</span><b>' + (fee === 0 ? '<span class="free">무료</span>' : money(fee) + ' (택배 기준)') + '</b></div>' +
            '<div class="sum-total"><span>합계</span><strong>' + money(sub + fee) + '</strong></div>' +
            '<p class="sum-note">' + money(SHIP.freeOver) + ' 이상 주문 시 배송비가 무료입니다. 부울경 직배송을 선택하면 화물로 발송됩니다.</p>' +
            '<a class="btn btn-dark btn-block" href="#/checkout">주문서 작성</a>' +
            '<a class="btn btn-line btn-block" href="#/c/all" style="margin-top:8px">계속 쇼핑</a>' +
          '</div>' +
        '</div></aside>' +
      '</div></div></div>';
  }

  /* ── 주문서 ───────────────────────────────────────── */
  function renderCheckout() {
    var lines = cartLines();
    if (!lines.length) {
      return '<div class="page"><div class="wrap"><div class="empty"><h3>주문할 상품이 없습니다</h3><p>장바구니에 상품을 담은 뒤 주문서를 작성해 주세요.</p><a class="btn btn-dark" href="#/c/all">상품 보기</a></div></div></div>';
    }
    var f = savedForm;
    var sub = cartSubtotal();
    var directFee = shipFee(sub, 'direct');
    var parcelFee = shipFee(sub, 'parcel');
    var method = f.pay || 'card';
    var fee = shipFee(sub, shippingMethod);
    var items = lines.map(function (l) {
      return '<div class="sum-item"><span>' + esc(l.product.name) + '<br><span class="muted">' + esc(l.option.label) + ' × ' + l.qty + '</span></span><b>' + money(l.line) + '</b></div>';
    }).join('');

    return '<div class="page"><div class="wrap">' +
      '<div class="page-head">' +
        '<div><h1>주문서 작성</h1><p>배송지와 결제 수단을 확인해 주세요.</p></div>' +
        '<div class="steps"><span>01 장바구니</span><i>›</i><b>02 주문서</b><i>›</i><span>03 주문 확인</span></div>' +
      '</div>' +
      '<div class="co-layout">' +
        '<form class="panel" id="checkoutForm" novalidate>' +
          '<div class="form-sec">' +
            '<h2><span class="num">01</span> 주문자 정보</h2>' +
            '<div class="fgrid">' +
              field('name', '주문자 이름', 'text', f.name, true, '홍길동') +
              field('phone', '휴대폰 번호', 'tel', f.phone, true, '010-0000-0000') +
              field('email', '이메일', 'email', f.email, false, 'order@example.com', true) +
            '</div>' +
          '</div>' +

          '<div class="form-sec">' +
            '<h2><span class="num">02</span> 배송지 <span class="must">필수</span></h2>' +
            '<label class="agree" style="margin-bottom:12px"><input type="checkbox" id="sameAs" ' + (f.sameAs ? 'checked' : '') + '><span>주문자와 동일 (이름·연락처를 그대로 사용)</span></label>' +
            '<div class="fgrid">' +
              field('rname', '받는 분', 'text', f.rname, true, '홍길동') +
              field('rphone', '받는 분 연락처', 'tel', f.rphone, true, '010-0000-0000') +
              '<div class="field full"><label for="zip">우편번호</label><input type="text" id="zip" name="zip" value="' + esc(f.zip || '') + '" inputmode="numeric" placeholder="46700" autocomplete="postal-code"><span class="hint">주소 검색 없이 직접 입력하는 시안입니다.</span></div>' +
              field('addr', '주소', 'text', f.addr, true, '부산광역시 강서구 평강로345번길 45', false, 'full') +
              field('addr2', '상세주소', 'text', f.addr2, false, '동·호수', false, 'full') +
              '<div class="field full"><label for="memo">배송 요청사항</label><textarea id="memo" name="memo" rows="2" placeholder="예: 오전 중 배송, 경비실에 맡겨 주세요">' + esc(f.memo || '') + '</textarea></div>' +
            '</div>' +
          '</div>' +

          '<div class="form-sec">' +
            '<h2><span class="num">03</span> 배송 방법</h2>' +
            '<div class="choices" role="radiogroup" aria-label="배송 방법">' +
              choice('shipping', 'direct', '부울경 직배송', '부산·울산·경남 화물 직배송 · ' + (directFee === 0 ? '무료' : money(directFee)), shippingMethod === 'direct') +
              choice('shipping', 'parcel', '택배 배송', '전국 택배 · 5만원 이상 무료 (제주·도서산간 별도)', shippingMethod === 'parcel') +
            '</div>' +
          '</div>' +

          '<div class="form-sec">' +
            '<h2><span class="num">04</span> 결제 수단</h2>' +
            '<div class="choices" role="radiogroup" aria-label="결제 수단">' +
              choice('pay', 'card', '신용카드', '국내 모든 카드 · PG 연동 예정 (토스페이먼츠/포트원)', method === 'card') +
              choice('pay', 'easy', '간편결제', '카카오페이 · 네이버페이 · 토스페이', method === 'easy') +
              choice('pay', 'bank', '무통장입금 · 세금계산서', '입금 확인 후 발송 · 사업자 세금계산서 발행 요청', method === 'bank') +
            '</div>' +
            '<div class="tax-box" id="taxBox"' + (method === 'bank' ? '' : ' hidden') + '>' +
              '<p>세금계산서 발행을 원하시면 사업자 정보를 적어 주세요. 담당자 이메일로 발행됩니다.</p>' +
              '<div class="fgrid cols-3">' +
                field('bizName', '상호', 'text', f.bizName, false, '(주)그랑푸드') +
                field('bizNo', '사업자등록번호', 'text', f.bizNo, false, '000-00-00000') +
                field('bizCeo', '대표자', 'text', f.bizCeo, false, '홍길동') +
              '</div>' +
            '</div>' +
            '<p class="pay-note"><b>시안 안내</b> — 결제 버튼을 누르면 주문서가 저장되고, PG 실결제 연동 대기 안내가 표시됩니다. 실제 카드 청구·입금 요청은 없습니다.</p>' +
          '</div>' +

          '<div class="form-sec">' +
            '<label class="agree"><input type="checkbox" id="agree" ' + (f.agree ? 'checked' : '') + '><span>주문 내용과 결제 조건을 확인했으며, 시안 환경으로 실제 결제가 이루어지지 않음을 이해했습니다. <em style="color:var(--bronze-dp);font-style:normal">(필수)</em></span></label>' +
          '</div>' +
        '</form>' +

        '<aside class="summary"><div class="panel">' +
          '<div class="panel-head"><h2>주문 요약</h2><a href="#/cart" style="font-size:11.5px;text-decoration:underline;color:var(--ink-mute)">수정</a></div>' +
          '<div class="panel-body">' +
            '<div class="sum-items">' + items + '</div>' +
            '<div class="sum-line"><span>상품 합계</span><b>' + money(sub) + '</b></div>' +
            '<div class="sum-line"><span>배송비 <span class="muted" id="feeMode">(' + (shippingMethod === 'direct' ? '직배송' : '택배') + ')</span></span><b id="coFee">' + (fee === 0 ? '<span class="free">무료</span>' : money(fee)) + '</b></div>' +
            '<div class="sum-total"><span>결제 예정 금액</span><strong id="coTotal">' + money(sub + fee) + '</strong></div>' +
            '<button type="button" class="btn btn-bronze btn-block" id="payBtn" style="margin-top:16px" data-act="pay">결제하기</button>' +
            '<p class="co-aside-note">실제 결제는 이루어지지 않습니다.<br>PG(토스페이먼츠/포트원) 연동 대기</p>' +
          '</div>' +
        '</div></aside>' +
      '</div></div></div>';
  }

  function field(name, label, type, value, required, ph, full, cls) {
    return '<div class="field ' + (cls || '') + (full ? ' full' : '') + '" data-field="' + name + '">' +
      '<label for="' + name + '">' + label + (required ? ' <em>*</em>' : '') + '</label>' +
      '<input type="' + type + '" id="' + name + '" name="' + name + '" value="' + esc(value || '') + '" placeholder="' + esc(ph || '') + '"' + (required ? ' required' : '') + '>' +
      '<span class="err"></span></div>';
  }
  function choice(group, value, title, desc, checked) {
    return '<label class="choice"><input type="radio" name="' + group + '" value="' + value + '"' + (checked ? ' checked' : '') + '>' +
      '<span class="choice-txt"><span class="choice-row"><strong>' + title + '</strong></span><span>' + desc + '</span></span></label>';
  }

  /* ── 주문 완료 ─────────────────────────────────────── */
  function renderComplete(no) {
    var o = null;
    for (var i = 0; i < orders.length; i++) if (orders[i].no === no) o = orders[i];
    if (!o) {
      return '<div class="page"><div class="wrap"><div class="empty"><h3>주문 내역을 찾을 수 없습니다</h3><p>주문내역 페이지에서 접수한 주문을 확인할 수 있습니다.</p><a class="btn btn-dark" href="#/orders">주문내역 보기</a></div></div></div>';
    }
    var items = o.items.map(function (l) {
      return '<div class="done-item"><img src="' + l.img + '" alt=""><div class="n"><b>' + esc(l.name) + '</b><span>' + esc(l.option) + ' × ' + l.qty + '</span></div><span class="p">' + money(l.line) + '</span></div>';
    }).join('');

    return '<div class="page"><div class="wrap done">' +
      '<div class="done-card">' +
        '<div class="done-mark"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12.5l5 5L20 6.5"/></svg></div>' +
        '<h1>주문서가 접수되었습니다</h1>' +
        '<p class="sub">시안 환경이라 실제 결제와 배송은 진행되지 않습니다. 주문번호와 내용을 확인해 주세요.</p>' +
        '<div class="done-no">' + esc(o.no) + '</div>' +
        '<dl class="done-grid">' +
          '<div><dt>주문일시</dt><dd>' + dateStr(o.at) + '</dd></div>' +
          '<div><dt>결제수단</dt><dd>' + esc(o.payLabel) + '</dd></div>' +
          '<div><dt>받는 분</dt><dd>' + esc(o.customer.rname) + ' · ' + esc(o.customer.rphone) + '</dd></div>' +
          '<div><dt>배송 방법</dt><dd>' + esc(o.shipLabel) + '</dd></div>' +
          '<div style="grid-column:1/-1"><dt>주소</dt><dd>' + esc((o.customer.zip ? '(' + o.customer.zip + ') ' : '') + o.customer.addr + ' ' + (o.customer.addr2 || '')) + '</dd></div>' +
        '</dl>' +
        '<div class="done-items">' + items + '</div>' +
        '<div class="sum-line" style="margin-top:12px"><span>상품 합계</span><b>' + money(o.subtotal) + '</b></div>' +
        '<div class="sum-line"><span>배송비</span><b>' + (o.fee === 0 ? '무료' : money(o.fee)) + '</b></div>' +
        '<div class="sum-total"><span>결제 예정 금액</span><strong>' + money(o.total) + '</strong></div>' +
        '<p class="done-hint">※ 표시 금액은 시안 예시가 기준입니다. 실제 결제는 PG(토스페이먼츠/포트원) 연동 후 진행되며, 지금은 카드 청구나 입금 요청이 발생하지 않습니다.</p>' +
        '<div class="done-actions">' +
          '<button class="btn btn-dark" data-act="print">주문내역서 인쇄</button>' +
          '<a class="btn btn-line" href="#/orders">주문내역 보기</a>' +
          '<a class="btn btn-line" href="#/c/all">계속 쇼핑</a>' +
        '</div>' +
      '</div>' +
    '</div></div>';
  }

  function renderOrders() {
    if (!orders.length) {
      return '<div class="page"><div class="wrap"><div class="page-head"><div><h1>주문내역</h1><p>이 브라우저에 저장된 주문서입니다.</p></div></div>' +
        '<div class="empty"><h3>아직 주문내역이 없습니다</h3><p>상품을 담고 주문서를 작성하면 여기에 저장됩니다.</p><a class="btn btn-dark" href="#/c/all">상품 보기</a></div></div></div>';
    }
    var list = orders.slice().reverse().map(function (o) {
      var lines = o.items.map(function (l) {
        return '<div class="order-line"><span>' + esc(l.name) + ' · ' + esc(l.option) + ' × ' + l.qty + '</span><b>' + money(l.line) + '</b></div>';
      }).join('');
      return '<div class="order-card">' +
        '<div class="order-top"><span class="no">' + esc(o.no) + '</span><span class="date">' + dateStr(o.at) + '</span><span class="status">시안 접수 (실결제 전)</span></div>' +
        '<div class="order-body">' + lines +
          '<div class="order-line" style="border-top:1px solid var(--line-soft);padding-top:8px"><span>' + esc(o.payLabel) + ' · ' + esc(o.shipLabel) + '</span><b>' + money(o.total) + '</b></div>' +
          '<div class="order-line"><span class="muted">' + esc(o.customer.rname) + ' · ' + esc(o.customer.rphone) + ' · ' + esc(o.customer.addr) + '</span></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">' +
            '<a class="btn btn-line btn-sm" href="#/complete/' + encodeURIComponent(o.no) + '">주문내역서 보기</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    return '<div class="page"><div class="wrap"><div class="page-head"><div><h1>주문내역</h1><p>이 브라우저에 저장된 시안 주문서 · 최근 ' + orders.length + '건</p></div>' +
      '<button class="btn btn-line btn-sm" data-act="clear-orders">내역 비우기</button></div>' +
      '<div class="orders">' + list + '</div></div></div>';
  }

  /* ── 안내 ─────────────────────────────────────────── */
  function renderGuide() {
    return '<div class="guide">' +
      '<h1>배송·결제·납품 안내</h1>' +
      '<p class="lead">그랑쉐프몰 1차 시안의 기준입니다. 실제 운영 정책은 확정 후 다시 안내드립니다.</p>' +

      '<section class="gsec"><h2><span class="num">01</span> 배송</h2>' +
        '<table><tbody>' +
          '<tr><th>부울경 직배송</th><td>부산·울산·경남 지역은 화물 직배송 · 5만원 이상 무료, 미만 ' + money(SHIP.direct.fee) + '</td></tr>' +
          '<tr><th>택배</th><td>전국 택배 · 5만원 이상 무료, 미만 ' + money(SHIP.parcel.fee) + ' (제주·도서산간 별도)</td></tr>' +
          '<tr><th>출고</th><td>평일 오후 2시 이전 결제 확인분 당일 출고 (재고 상황에 따라 다를 수 있음)</td></tr>' +
          '<tr><th>대형 품목</th><td>60cm 이상 볶음솥·전판 등은 화물 착불 또는 별도 운임으로 안내</td></tr>' +
        '</tbody></table></section>' +

      '<section class="gsec"><h2><span class="num">02</span> 교환·반품</h2>' +
        '<ul><li>수령 후 7일 이내 신청 가능하며, 미사용·포장 훼손 없음이 기준입니다.</li>' +
        '<li>상품 불량·오배송은 왕복 배송비를 그랑쉐프가 부담합니다.</li>' +
        '<li>업소용 대형 품목은 설치·사용 흔적이 있으면 반품이 제한될 수 있습니다.</li>' +
        '<li>교환·반품 문의: ' + CO.tel + ' · ' + CO.emails[0] + '</li></ul></section>' +

      '<section class="gsec" id="tax"><h2><span class="num">03</span> 세금계산서·결제</h2>' +
        '<ul><li>신용카드·간편결제·무통장입금을 지원할 예정입니다.</li>' +
        '<li>세금계산서는 무통장입금 주문 시 사업자 정보를 적어 요청하시면 담당자 이메일로 발행됩니다.</li>' +
        '<li>현금영수증·세금계산서 발행 문의: ' + CO.emails[1] + '</li>' +
        '<li><strong>1차 시안에서는 PG가 연동되지 않아 실제 결제가 이루어지지 않습니다.</strong></li></ul></section>' +

      '<section class="gsec" id="b2b"><h2><span class="num">04</span> 업소 정기납품·대량 견적</h2>' +
        '<p>식당·급식소·프랜차이즈에 필요한 품목을 규격·수량별로 정리해 견적을 드립니다. 정기 납품은 배송 주기와 품목을 정해 월 단위로 운영합니다.</p>' +
        '<table><tbody>' +
          '<tr><th>이메일</th><td><a class="mail" href="mailto:' + CO.emails[0] + '">' + CO.emails[0] + '</a><br><a class="mail" href="mailto:' + CO.emails[1] + '">' + CO.emails[1] + '</a></td></tr>' +
          '<tr><th>전화</th><td>' + CO.tel + ' · 팩스 ' + CO.fax + '</td></tr>' +
          '<tr><th>상담 시간</th><td>' + CO.hours + '</td></tr>' +
          '<tr><th>회사</th><td>' + CO.name + ' · ' + CO.addr + '</td></tr>' +
        '</tbody></table>' +
        '<p style="margin-top:14px"><button class="btn btn-dark btn-sm" data-act="quote" data-pid="" data-oi="">견적 요청서 작성</button></p></section>' +

      '<section class="gsec" id="notice"><h2><span class="num">05</span> 시안 안내</h2>' +
        '<div class="demo">이 사이트는 <strong>그랑쉐프몰 1차 시안(demo)</strong>입니다. 상품 이미지는 회사소개 홈페이지의 예시 이미지를 사용했고, 표시 금액은 실제 판매가가 아닌 <strong>시안 예시가</strong>입니다. 주문서는 이 브라우저에만 저장되며 서버로 전송되지 않고, 카드 청구·입금 요청도 발생하지 않습니다.</div></section>' +
    '</div>';
  }

  /* ── 헤더/장바구니 동기화 ──────────────────────────── */
  function syncCartUI() {
    var n = cartCount();
    var el = $('#cartCount');
    if (el) { el.textContent = n; el.dataset.empty = n === 0 ? 'true' : 'false'; }
    var bar = $('#cartBar');
    if (bar) {
      var show = n > 0 && !/^#\/(cart|checkout|complete)/.test(location.hash);
      bar.hidden = !show;
      var bc = $('#barCount'), bt = $('#barTotal');
      if (bc) bc.textContent = n;
      if (bt) bt.textContent = money(cartSubtotal());
    }
  }

  /* ── 토스트 ───────────────────────────────────────── */
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  /* ── 모달 ─────────────────────────────────────────── */
  var modalRoot = $('#modalRoot');
  var modalReturn = null;
  function openModal(html, opts) {
    opts = opts || {};
    modalRoot.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.label || '안내') + '">' + html + '</div>';
    modalRoot.hidden = false;
    modalReturn = opts.onClose || null;
    document.body.style.overflow = 'hidden';
    var focusEl = modalRoot.querySelector('[data-autofocus]') || modalRoot.querySelector('button, a, input');
    if (focusEl) focusEl.focus();
  }
  function closeModal(runReturn) {
    modalRoot.hidden = true;
    modalRoot.innerHTML = '';
    document.body.style.overflow = '';
    var fn = modalReturn;
    modalReturn = null;
    if (runReturn !== false && fn) fn();
  }
  modalRoot.addEventListener('click', function (e) {
    if (e.target === modalRoot) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modalRoot.hidden) closeModal();
  });

  /* ── 장바구니 조작 ────────────────────────────────── */
  function addToCart(pid, oi, qty) {
    var p = byId(pid);
    if (!p) return;
    var op = p.options[oi] || p.options[0];
    if (typeof op.price !== 'number') { openQuote(pid, oi); return; }
    qty = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    var key = pid + '::' + oi;
    var found = null;
    cart.forEach(function (it) { if (it.pid + '::' + it.oi === key) found = it; });
    if (found) found.qty = Math.min(99, found.qty + qty);
    else cart.push({ pid: pid, oi: Number(oi) || 0, qty: qty });
    saveCart();
    toast('<span><b>' + esc(p.name) + '</b> ' + esc(op.label) + ' ' + qty + '개를 담았습니다</span>');
  }
  function changeQty(key, d) {
    cart.forEach(function (it) {
      if (it.pid + '::' + it.oi === key) it.qty = Math.max(1, Math.min(99, it.qty + d));
    });
    saveCart();
    rerenderCartArea();
  }
  function setQty(key, val) {
    var q = Math.max(1, Math.min(99, parseInt(val, 10) || 1));
    cart.forEach(function (it) { if (it.pid + '::' + it.oi === key) it.qty = q; });
    saveCart();
    rerenderCartArea();
  }
  function removeItem(key) {
    cart = cart.filter(function (it) { return it.pid + '::' + it.oi !== key; });
    saveCart();
    rerenderCartArea();
  }
  function rerenderCartArea() {
    if (/^#\/cart/.test(location.hash) || location.hash === '' || location.hash === '#/') render(true);
    else if (/^#\/checkout/.test(location.hash)) render(true);
    else syncCartUI();
  }

  /* ── 견적 요청 모달 ───────────────────────────────── */
  function openQuote(pid, oi) {
    var p = pid ? byId(pid) : null;
    var op = p ? (p.options[oi] || p.options[0]) : null;
    var title = p ? esc(p.name) + (op ? ' · ' + esc(op.label) : '') : '대량·정기납품 견적';
    openModal('' +
      '<div class="modal-head"><h2>견적 요청</h2><button class="modal-x" data-act="close-modal" aria-label="닫기">×</button></div>' +
      '<div class="modal-body">' +
        '<p style="margin-top:0"><strong>' + title + '</strong>의 견적을 요청합니다. 수량과 납품 지역을 적어 주세요.</p>' +
        '<div class="fgrid">' +
          '<div class="field"><label for="qName">업체·성함 <em>*</em></label><input id="qName" type="text" placeholder="(주)그랑푸드 / 홍길동"></div>' +
          '<div class="field"><label for="qPhone">연락처 <em>*</em></label><input id="qPhone" type="tel" placeholder="010-0000-0000"></div>' +
        '</div>' +
        '<div class="fgrid" style="margin-top:10px">' +
          '<div class="field"><label for="qQty">수량</label><input id="qQty" type="text" placeholder="예: 20개"></div>' +
          '<div class="field"><label for="qArea">납품 지역</label><input id="qArea" type="text" placeholder="예: 부산 강서구"></div>' +
        '</div>' +
        '<div class="field" style="margin-top:10px"><label for="qMemo">요청사항</label><textarea id="qMemo" rows="3" placeholder="규격·희망 납기·정기납품 주기 등"></textarea></div>' +
        '<p class="pay-note">시안 환경이라 이 요청서는 실제로 전송되지 않습니다. 아래 연락처로 직접 보내 주시면 담당자가 확인합니다.<br><b>' + CO.emails[0] + ' · ' + CO.emails[1] + ' · ' + CO.tel + '</b></p>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-line" data-act="close-modal">닫기</button>' +
        '<button class="btn btn-dark" data-act="quote-submit" data-title="' + esc(title) + '">요청서 정리</button>' +
      '</div>', { label: '견적 요청' });
  }

  /* ── 주문 처리 ────────────────────────────────────── */
  function collectForm() {
    var form = $('#checkoutForm');
    if (!form) return null;
    var data = {};
    $$('input, textarea', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else if (el.type === 'checkbox') data[el.id] = el.checked;
      else data[el.name] = el.value.trim();
    });
    return data;
  }
  function persistForm() {
    var d = collectForm();
    if (d) writeJSON(FORM_KEY, d);
  }
  function validate(d) {
    var errors = [];
    function mark(name, msg) {
      var wrap = $('[data-field="' + name + '"]');
      if (wrap) {
        wrap.classList.add('has-err');
        var err = $('.err', wrap);
        var inp = $('input, textarea', wrap);
        if (err) err.textContent = msg;
        if (inp) inp.setAttribute('aria-invalid', 'true');
      }
      errors.push(name);
    }
    $$('.field').forEach(function (w) { w.classList.remove('has-err'); var i = $('input, textarea', w); if (i) i.removeAttribute('aria-invalid'); });

    if (!d.name) mark('name', '주문자 이름을 입력해 주세요.');
    if (!d.phone) mark('phone', '연락처를 입력해 주세요.');
    else if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(d.phone.replace(/\s/g, ''))) mark('phone', '전화번호 형식을 확인해 주세요.');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) mark('email', '이메일 형식을 확인해 주세요.');
    if (!d.rname) mark('rname', '받는 분 이름을 입력해 주세요.');
    if (!d.rphone) mark('rphone', '받는 분 연락처를 입력해 주세요.');
    else if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(d.rphone.replace(/\s/g, ''))) mark('rphone', '전화번호 형식을 확인해 주세요.');
    if (!d.addr) mark('addr', '주소를 입력해 주세요.');
    if (!d.agree) {
      var box = $('#agree');
      if (box) box.focus();
      toast('<span>주문 내용 확인에 동의해 주세요.</span>');
      errors.push('agree');
    }
    return errors;
  }

  function placeOrder() {
    var d = collectForm();
    if (!d) return;
    persistForm();
    var errs = validate(d);
    if (errs.length) {
      var first = $('[data-field="' + errs[0] + '"] input, [data-field="' + errs[0] + '"] textarea');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    var lines = cartLines();
    if (!lines.length) { toast('장바구니가 비어 있습니다.'); return; }
    var sub = cartSubtotal();
    var fee = shipFee(sub, shippingMethod);
    var payLabel = d.pay === 'card' ? '신용카드' : d.pay === 'easy' ? '간편결제' : '무통장입금(세금계산서)';
    var shipLabel = SHIP[shippingMethod].label;
    var order = {
      no: todayNo(),
      at: new Date().toISOString(),
      items: lines.map(function (l) {
        return { pid: l.pid, name: l.product.name, option: l.option.label, qty: l.qty, price: l.price, line: l.line, img: l.product.img };
      }),
      subtotal: sub, fee: fee, total: sub + fee,
      pay: d.pay || 'card', payLabel: payLabel, ship: shippingMethod, shipLabel: shipLabel,
      tax: d.pay === 'bank' ? { bizName: d.bizName || '', bizNo: d.bizNo || '', bizCeo: d.bizCeo || '' } : null,
      customer: {
        name: d.name, phone: d.phone, email: d.email || '',
        rname: d.rname, rphone: d.rphone, zip: d.zip || '', addr: d.addr, addr2: d.addr2 || '', memo: d.memo || ''
      },
      status: '시안 접수 (실결제 전)'
    };
    orders.push(order);
    writeJSON(ORDER_KEY, orders);
    cart = [];
    saveCart();
    try { sessionStorage.setItem('gc_last_order', order.no); } catch (e) {}

    openModal('' +
      '<div class="modal-head"><h2>주문서가 접수되었습니다</h2><button class="modal-x" data-act="close-modal" aria-label="닫기">×</button></div>' +
      '<div class="modal-body">' +
        '<div class="alert">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.4" r=".9" fill="currentColor" stroke="none"/></svg>' +
          '<span><b>시안 주문서 확인 · PG 실결제 연동 대기</b><br>토스페이먼츠/포트원 연동 전이라 실제 결제(카드 청구·입금 요청)는 이루어지지 않았습니다.</span>' +
        '</div>' +
        '<dl class="order-brief">' +
          '<div><dt>주문번호</dt><dd>' + order.no + '</dd></div>' +
          '<div><dt>주문 상품</dt><dd>' + order.items.length + '종 ' + order.items.reduce(function (s, i) { return s + i.qty; }, 0) + '개</dd></div>' +
          '<div><dt>결제 수단</dt><dd>' + order.payLabel + '</dd></div>' +
          '<div><dt>배송 방법</dt><dd>' + order.shipLabel + '</dd></div>' +
          '<div><dt>받는 분</dt><dd>' + esc(order.customer.rname) + '</dd></div>' +
          '<div class="grand"><dt>결제 예정 금액</dt><dd>' + money(order.total) + '</dd></div>' +
        '</dl>' +
        '<p style="margin:0;font-size:12px">주문서는 이 브라우저의 주문내역에 저장되었습니다.</p>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-line" data-act="close-modal">닫기</button>' +
        '<button class="btn btn-dark" data-act="go-complete" data-no="' + order.no + '">주문내역서 보기</button>' +
      '</div>', { label: '주문 접수 안내', onClose: function () { go('#/complete/' + order.no); } });
  }

  /* ── 라우터 ───────────────────────────────────────── */
  function parseHash() {
    var h = location.hash || '#/';
    var raw = h.replace(/^#\/?/, '');
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var qs = qi >= 0 ? raw.slice(qi + 1) : '';
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      params[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = decodeURIComponent(i < 0 ? '' : kv.slice(i + 1));
    });
    return { parts: path.split('/').filter(Boolean), params: params };
  }

  function render(isRerender) {
    var r = parseHash();
    var parts = r.parts;
    var view = $('#view');
    var scrollTarget = null;

    if (!parts.length) {
      if (r.params.cat) ui.cat = r.params.cat;
      if (r.params.q != null) ui.q = r.params.q;
      view.innerHTML = renderHome();
      syncSearchInputs();
    } else if (parts[0] === 'c') {
      ui.cat = parts[1] || 'all';
      if (['all', 'biz', 'home'].indexOf(ui.cat) < 0) ui.cat = 'all';
      ui.q = r.params.q || '';
      ui.sort = r.params.sort || ui.sort;
      view.innerHTML = renderHome();
      syncSearchInputs();
      scrollTarget = '#catalog';
    } else if (parts[0] === 'p') {
      view.innerHTML = renderPDP(parts[1]);
    } else if (parts[0] === 'cart') {
      view.innerHTML = renderCart();
    } else if (parts[0] === 'checkout') {
      view.innerHTML = renderCheckout();
      bindCheckout();
    } else if (parts[0] === 'complete') {
      view.innerHTML = renderComplete(decodeURIComponent(parts[1] || ''));
    } else if (parts[0] === 'orders') {
      view.innerHTML = renderOrders();
    } else if (parts[0] === 'guide') {
      view.innerHTML = renderGuide();
      if (r.params.sec) scrollTarget = '#' + r.params.sec;
    } else {
      view.innerHTML = notFound();
    }

    syncCartUI();
    if (!isRerender) {
      if (scrollTarget) {
        var el = $(scrollTarget);
        if (el) { setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 40); }
        else window.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
    document.title = titleFor(parts) + ' | 그랑쉐프몰';
  }

  function titleFor(parts) {
    if (!parts.length) return '업소용·가정용 주방용품 공식 판매몰';
    if (parts[0] === 'p') { var p = byId(parts[1]); return p ? p.name : '상품'; }
    if (parts[0] === 'c') return catName(parts[1]);
    if (parts[0] === 'cart') return '장바구니';
    if (parts[0] === 'checkout') return '주문서 작성';
    if (parts[0] === 'complete') return '주문 완료';
    if (parts[0] === 'orders') return '주문내역';
    if (parts[0] === 'guide') return '배송·결제·납품 안내';
    return '그랑쉐프몰';
  }

  function go(hash) {
    if (location.hash === hash) { render(); return; }
    location.hash = hash;
  }

  function syncSearchInputs() {
    var a = $('#searchInput'), b = $('#searchInputMobile');
    if (a) a.value = ui.q;
    if (b) b.value = ui.q;
  }

  /* ── 주문서 동작 ──────────────────────────────────── */
  function bindCheckout() {
    var form = $('#checkoutForm');
    if (!form) return;
    form.addEventListener('input', function () {
      persistForm();
      var d = collectForm();
      if (d && d.sameAs) {
        if (d.name !== undefined && $('#rname') && document.activeElement !== $('#rname')) $('#rname').value = d.name;
        if ($('#rphone') && document.activeElement !== $('#rphone')) $('#rphone').value = d.phone;
        persistForm();
      }
    });
    form.addEventListener('change', function (e) {
      var t = e.target;
      if (t.name === 'shipping') {
        shippingMethod = t.value;
        refreshTotals();
      }
      if (t.name === 'pay') {
        var tax = $('#taxBox');
        if (tax) tax.hidden = t.value !== 'bank';
      }
      if (t.id === 'sameAs' && t.checked) {
        if ($('#name')) $('#rname').value = $('#name').value;
        if ($('#phone')) $('#rphone').value = $('#phone').value;
      }
      persistForm();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  function refreshTotals() {
    var sub = cartSubtotal();
    var fee = shipFee(sub, shippingMethod);
    var fEl = $('#coFee'), tEl = $('#coTotal'), mEl = $('#feeMode');
    if (fEl) fEl.innerHTML = fee === 0 ? '<span class="free">무료</span>' : money(fee);
    if (tEl) tEl.textContent = money(sub + fee);
    if (mEl) mEl.textContent = '(' + (shippingMethod === 'direct' ? '직배송' : '택배') + ')';
  }

  /* ── 이벤트 ───────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.dataset.act;

    if (act === 'add') {
      e.preventDefault();
      addToCart(t.dataset.pid, Number(t.dataset.oi || 0), Number(t.dataset.qty || 1));
    } else if (act === 'buynow') {
      e.preventDefault();
      var pid = t.dataset.pid, oi = Number(t.dataset.oi || 0), qty = Number(t.dataset.qty || 1);
      addToCart(pid, oi, qty);
      go('#/checkout');
    } else if (act === 'qty') {
      changeQty(t.dataset.key, Number(t.dataset.d));
    } else if (act === 'remove') {
      removeItem(t.dataset.key);
    } else if (act === 'clear') {
      if (confirm('장바구니를 비울까요?')) { cart = []; saveCart(); rerenderCartArea(); }
    } else if (act === 'clear-orders') {
      if (confirm('이 브라우저에 저장된 주문내역을 모두 지울까요?')) { orders = []; writeJSON(ORDER_KEY, orders); render(); }
    } else if (act === 'opt') {
      var y0 = window.scrollY;
      pdpState.oi = Number(t.dataset.oi);
      pdpState.qty = 1;
      render(true);
      window.scrollTo(0, y0);
    } else if (act === 'pdpqty') {
      var y1 = window.scrollY;
      pdpState.qty = Math.max(1, Math.min(99, pdpState.qty + Number(t.dataset.d)));
      render(true);
      window.scrollTo(0, y1);
    } else if (act === 'filter') {
      ui.cat = t.dataset.cat;
      ui.q = '';
      go('#/c/' + ui.cat);
    } else if (act === 'quote') {
      openQuote(t.dataset.pid || '', Number(t.dataset.oi || 0));
    } else if (act === 'quote-submit') {
      var name = $('#qName'), phone = $('#qPhone');
      if (!name.value.trim() || !phone.value.trim()) {
        toast('<span>업체·성함과 연락처를 입력해 주세요.</span>');
        (!name.value.trim() ? name : phone).focus();
        return;
      }
      var summary = '<strong>' + esc(t.dataset.title) + '</strong><br>' +
        esc(name.value.trim()) + ' · ' + esc(phone.value.trim()) +
        ($('#qQty').value ? '<br>수량 ' + esc($('#qQty').value) : '') +
        ($('#qArea').value ? ' · ' + esc($('#qArea').value) : '');
      openModal('' +
        '<div class="modal-head"><h2>견적 요청서를 정리했습니다</h2><button class="modal-x" data-act="close-modal" aria-label="닫기">×</button></div>' +
        '<div class="modal-body">' +
          '<div class="alert"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.4" r=".9" fill="currentColor" stroke="none"/></svg>' +
          '<span>시안 환경이라 요청서는 실제로 전송되지 않았습니다. 아래 연락처로 보내 주시면 담당자가 확인합니다.</span></div>' +
          '<p style="margin-bottom:8px;font-size:12.5px">' + summary + '</p>' +
          '<p style="font-size:12px;margin:0"><b>' + CO.emails[0] + '</b><br><b>' + CO.emails[1] + '</b><br>' + CO.tel + ' · ' + CO.hours + '</p>' +
        '</div>' +
        '<div class="modal-foot"><a class="btn btn-line" href="mailto:' + CO.emails[0] + '?subject=' + encodeURIComponent('[그랑쉐프몰] 견적 요청') + '">메일 열기</a>' +
        '<button class="btn btn-dark" data-act="close-modal">닫기</button></div>', { label: '견적 요청 정리' });
    } else if (act === 'pay') {
      placeOrder();
    } else if (act === 'close-modal') {
      closeModal();
    } else if (act === 'go-complete') {
      var no = t.dataset.no;
      closeModal(false);
      go('#/complete/' + no);
    } else if (act === 'print') {
      window.print();
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.act === 'sort') {
      ui.sort = t.value;
      var list = filteredProducts();
      var grid = $('.grid-products');
      var count = $('.catalog-head .count');
      if (grid) grid.outerHTML = '<div class="grid-products">' + list.map(productCard).join('') + '</div>';
      if (count) count.textContent = list.length + '개';
    }
    if (t.dataset && t.dataset.act === 'qtyinput') { setQty(t.dataset.key, t.value); }
    if (t.id === 'pdpQty') {
      pdpState.qty = Math.max(1, Math.min(99, parseInt(t.value, 10) || 1));
      var op = byId(pdpState.id).options[pdpState.oi];
      if (typeof op.price === 'number') {
        var tot = $('#pdpTotal');
        if (tot) tot.textContent = money(op.price * pdpState.qty);
      }
    }
  });

  /* 검색 */
  function doSearch(val) {
    ui.q = val.trim();
    ui.cat = 'all';
    go('#/c/all' + (ui.q ? '?q=' + encodeURIComponent(ui.q) : ''));
    closeMobilePanels();
  }
  var sf = $('#searchForm'), sfm = $('#searchFormMobile');
  if (sf) sf.addEventListener('submit', function (e) { e.preventDefault(); doSearch($('#searchInput').value); });
  if (sfm) sfm.addEventListener('submit', function (e) { e.preventDefault(); doSearch($('#searchInputMobile').value); });

  function closeMobilePanels() {
    var sp = $('#searchPanel'), mn = $('#mobileNav'), tg = $('#searchToggle'), bg = $('#burger');
    if (sp) sp.hidden = true;
    if (mn) mn.hidden = true;
    if (tg) tg.setAttribute('aria-expanded', 'false');
    if (bg) { bg.setAttribute('aria-expanded', 'false'); bg.classList.remove('open'); }
  }
  var st = $('#searchToggle');
  if (st) st.addEventListener('click', function () {
    var sp = $('#searchPanel');
    var open = sp.hidden;
    closeMobilePanels();
    sp.hidden = !open;
    st.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(function () { $('#searchInputMobile').focus(); }, 30);
  });
  var bg = $('#burger');
  if (bg) bg.addEventListener('click', function () {
    var mn = $('#mobileNav');
    var open = mn.hidden;
    closeMobilePanels();
    mn.hidden = !open;
    bg.setAttribute('aria-expanded', String(open));
  });
  $('#mobileNav').addEventListener('click', function (e) { if (e.target.closest('a')) closeMobilePanels(); });

  /* 헤더 그림자 */
  window.addEventListener('scroll', function () {
    var h = $('#shopHeader');
    if (h) h.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  /* 라우팅 시작 */
  window.addEventListener('hashchange', function () { render(); closeMobilePanels(); });
  render();
  syncCartUI();
})();
