/* =============================================================
   STEAK MONDAY - the whole show
   Renders the form, validates it, sends it to the Google Form
   backend, prints a receipt, and remembers the guest's order in
   their own browser so they can come back and change it.
   ============================================================= */
(function () {
  'use strict';

  const CFG = window.STEAK_CONFIG;
  const $ = (id) => document.getElementById(id);
  const STORE_KEY = 'steakSunday.order.v1';
  const DEVICE_KEY = 'steakSunday.device.v1';

  /* ---------------- the words ---------------- */

  const DRINKS = [
    {
      name: 'Tallow Old Fashioned', emo: '\u{1F943}', tag: 'House special',
      desc: 'Bourbon fat-washed with Wagyu-cross beef tallow, a touch of demerara, Angostura and orange bitters, expressed orange peel. Built on the dry side, no cherry.',
      quip: 'Beef in the bourbon. You understand the assignment.'
    },
    {
      name: 'Grey Goose Cosmopolitan', emo: '\u{1F378}', tag: 'Classic',
      desc: 'The classic, made exactly as expected.',
      quip: 'Grey Goose, cranberry, lime, and zero apologies.'
    },
    {
      name: 'Daiquiri', emo: '\u{1F379}', tag: 'Not the frozen kind',
      desc: 'Rum, lime, and sugar, done properly.',
      quip: 'Hemingway would approve. Mostly of the rum.'
    },
    {
      name: 'Zero-proof', emo: '\u{1F34B}', tag: 'All flavor, no Monday',
      desc: 'Grapefruit, lime, honey, and soda.',
      quip: 'Clear-eyed and still fancy. Respect.'
    },
    {
      name: 'Just pour me a glass of wine', emo: '\u{1F377}', tag: 'Low maintenance legend',
      desc: 'No menu, no decisions, just a glass that stays full.',
      quip: 'Easiest order of the night. The bartender thanks you.'
    }
  ];

  const VERDICTS = {
    'Medium rare': 'Correct. You may proceed to the front of the line.',
    'Cooked further': 'We are still friends. This is simply a different relationship than the one we had before. Tell us how you want it and it will be handled with dignity.'
  };

  const GREETINGS = [
    'Welcome, {n}. Your place card is being hand lettered as we speak.',
    '{n}! The ribeye has been expecting you.',
    'Good to see you, {n}. Please keep your hands and forks inside the ride.',
    '{n}, excellent. The Primo XL has been told you are coming.',
    'Ah, {n}. The kitchen just stood up a little straighter.',
    '{n} is on the list. The list is very exclusive. It is also short.'
  ];

  const WIRE = [
    'Ribeye status: aging quietly in the basement fridge. It knows what it did.',
    'The sous vide has been told to expect company.',
    'Tallow has been rendered. The bourbon has been warned.',
    'Hilary has approved the cauliflower heat level. It is not up for discussion.',
    'Somebody asked for well done. The kitchen is processing its feelings.',
    'Armagnac inventory: adequate. Host restraint: to be determined.',
    'Primo XL preheat target: roughly the surface of a small star.',
    'Caesar croutons are on the side. Nobody gets hurt.',
    'The sommelier has opinions and is ready to share them unprompted.',
    'Reminder: the fat cap is the best part and you already knew that.'
  ];

  const CONFETTI = ['\u{1F969}', '\u{1F943}', '\u{1F377}', '\u{1F525}', '\u{1F9C8}', '\u{1F378}'];

  /* ---------------- helpers ---------------- */

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode, oh well */ } }
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function confetti() {
    const box = $('confetti');
    box.innerHTML = '';
    for (let i = 0; i < 34; i++) {
      const s = document.createElement('span');
      s.textContent = CONFETTI[i % CONFETTI.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDuration = 2.2 + Math.random() * 2 + 's';
      s.style.animationDelay = Math.random() * 0.6 + 's';
      s.style.fontSize = 18 + Math.random() * 18 + 'px';
      box.appendChild(s);
    }
    setTimeout(() => { box.innerHTML = ''; }, 5200);
  }

  function deviceId() {
    let id = store.get(DEVICE_KEY);
    if (!id) {
      id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      store.set(DEVICE_KEY, id);
    }
    return id;
  }

  /* ---------------- state ---------------- */

  const state = { cocktail: '', steak: '', som: false };

  /* ---------------- countdown ---------------- */

  function daysUntil() {
    const [y, m, d] = CFG.event.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  function renderCountdown() {
    const n = daysUntil();
    let txt;
    if (n > 1) txt = n + ' days to steak';
    else if (n === 1) txt = 'Tomorrow. Hydrate.';
    else if (n === 0) txt = 'Tonight. Forks up.';
    else txt = 'Steak Monday: complete';
    $('countChip').textContent = txt;
    if (n < 0) {
      $('kitchenChip').innerHTML = '<i></i> Kitchen is closed';
      $('kitchenChip').style.color = 'var(--muted2)';
    }
  }

  /* ---------------- build the form ---------------- */

  function buildGuests() {
    const sel = $('guest');
    CFG.guests.forEach((g) => sel.add(new Option(g, g)));
    sel.add(new Option('Other (I have a name too)', '__other'));
    sel.addEventListener('change', onGuestChange);
    $('guestOther').addEventListener('input', () => { clearErr('q-guest'); greet(); });
  }

  function onGuestChange() {
    const other = $('guest').value === '__other';
    $('guestOther').hidden = !other;
    if (other) $('guestOther').focus();
    clearErr('q-guest');
    greet();
  }

  function guestName() {
    const v = $('guest').value;
    if (v === '__other') return $('guestOther').value.trim();
    return v;
  }

  function greet() {
    const name = guestName();
    const q = $('guestQuip');
    if (!name) { q.hidden = true; return; }
    const first = name.split(/\s+/)[0];
    q.textContent = GREETINGS[hash(name) % GREETINGS.length].replace('{n}', first);
    q.hidden = false;
  }

  function buildDrinks() {
    const box = $('drinks');
    DRINKS.forEach((d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'drink';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.dataset.name = d.name;
      b.innerHTML =
        '<span class="emo" aria-hidden="true">' + d.emo + '</span>' +
        '<span><span class="d-name">' + esc(d.name) + ' <span class="d-tag">' + esc(d.tag) + '</span></span>' +
        '<span class="d-desc">' + esc(d.desc) + '</span></span>' +
        '<span class="d-check" aria-hidden="true"></span>';
      b.addEventListener('click', () => { setCocktail(d.name); toast(d.quip); });
      box.appendChild(b);
    });
  }

  function setCocktail(name) {
    state.cocktail = name;
    document.querySelectorAll('.drink').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.name === name)));
    clearErr('q-cocktail');
  }

  function buildTemps() {
    document.querySelectorAll('.temp').forEach((b) => {
      b.addEventListener('click', () => setSteak(b.dataset.temp, true));
    });
    $('steakNotes').addEventListener('input', () => clearErr('q-steak'));
  }

  function setSteak(temp, fromClick) {
    state.steak = temp;
    document.querySelectorAll('.temp').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.temp === temp)));
    const v = $('steakVerdict');
    v.textContent = VERDICTS[temp] || '';
    v.hidden = !temp;
    const further = temp === 'Cooked further';
    $('steakNotes').hidden = !further;
    if (further && fromClick) $('steakNotes').focus();
    clearErr('q-steak');
  }

  function buildWine() {
    $('somBtn').addEventListener('click', () => {
      setSom(!state.som);
      if (state.som) toast('The sommelier is flattered and slightly suspicious.');
    });
    $('wineText').addEventListener('input', () => {
      if ($('wineText').value.trim() && state.som) setSom(false);
      clearErr('q-wine');
    });
  }

  function setSom(on) {
    state.som = on;
    $('somBtn').setAttribute('aria-pressed', String(on));
    if (on) $('wineText').value = '';
    clearErr('q-wine');
  }

  /* ---------------- validation ---------------- */

  function clearErr(id) { $(id).classList.remove('invalid'); }

  function flag(id) {
    const el = $(id);
    el.classList.remove('invalid');
    void el.offsetWidth; // restart the shake
    el.classList.add('invalid');
  }

  function collect() {
    const wineText = $('wineText').value.trim();
    return {
      guest: guestName(),
      guestPick: $('guest').value,
      cocktail: state.cocktail,
      steak: state.steak,
      steakNotes: state.steak === 'Cooked further' ? $('steakNotes').value.trim() : '',
      dietary: $('dietary').value.trim(),
      som: state.som,
      wineText: wineText,
      wine: state.som ? 'Sommelier recommends' : wineText
    };
  }

  function validate(o) {
    const bad = [];
    if (!o.guest) bad.push('q-guest');
    if (!o.cocktail) bad.push('q-cocktail');
    if (!o.steak || (o.steak === 'Cooked further' && !o.steakNotes)) bad.push('q-steak');
    if (!o.wine) bad.push('q-wine');
    bad.forEach(flag);
    if (o.steak === 'Cooked further' && !o.steakNotes) {
      document.querySelector('[data-for="steak"]').textContent = 'Tell us how far to take it. Medium? Medium well? We need specifics.';
    } else {
      document.querySelector('[data-for="steak"]').textContent = 'Every steak needs a temperature. Even yours.';
    }
    if (bad.length) {
      $(bad[0]).scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('A few blanks left on the ticket.');
    }
    return bad.length === 0;
  }

  /* ---------------- submit ---------------- */

  async function send(o) {
    const B = CFG.backend;
    const body = new URLSearchParams();
    body.append(B.fields.guest, o.guest);
    body.append(B.fields.cocktail, o.cocktail);
    body.append(B.fields.steak, o.steak === 'Medium rare' ? 'Medium rare' : 'Cooked further');
    body.append(B.fields.steakNotes, o.steakNotes);
    body.append(B.fields.dietary, o.dietary);
    body.append(B.fields.wine, o.wine);
    body.append(B.fields.device, deviceId());

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      // Google Forms does not send CORS headers, so the response is opaque.
      // If the request goes out without a network error, the answer landed.
      await fetch(B.formAction, { method: 'POST', mode: 'no-cors', body: body, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const o = collect();
    if (!validate(o)) return;

    const btn = $('fireBtn');
    btn.disabled = true;
    btn.querySelector('.fire-label').textContent = 'Firing...';
    try {
      await send(o);
      o.submittedAt = new Date().toISOString();
      store.set(STORE_KEY, o);
      showReceipt(o, true);
    } catch (err) {
      toast('The ticket did not make it to the kitchen. Check your signal and try again.');
    } finally {
      btn.disabled = false;
      btn.querySelector('.fire-label').textContent = 'Fire the order';
    }
  }

  /* ---------------- receipt ---------------- */

  function ticketNo() {
    return 'Ticket #' + String(hash(deviceId()) % 10000).padStart(4, '0');
  }

  function showReceipt(o, fresh) {
    const when = o.submittedAt ? new Date(o.submittedAt) : new Date();
    $('rcptMeta').textContent = ticketNo().toUpperCase() + '  ·  ' +
      when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
      when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    const steak = o.steak === 'Medium rare' ? 'Medium rare (correct)' : 'Cooked further: ' + o.steakNotes;
    const rows = [
      ['Guest', o.guest],
      ['Pour', o.cocktail],
      ['Steak', steak],
      ['Notes', o.dietary || 'None. Legend.'],
      ['Bottle', o.som ? 'Trusting the som' : o.wine]
    ];
    $('rcptBody').innerHTML = rows.map((r) =>
      '<div class="r-row"><span>' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></div>').join('');

    const first = o.guest.split(/\s+/)[0];
    $('orderupMsg').textContent = fresh
      ? 'Your ticket is on the rail, ' + first + '. See you ' + CFG.event.dateLabel.replace(/, \d{4}$/, '') + '. Change your mind? Tap below and fire a new one. The newest ticket wins.'
      : 'Welcome back, ' + first + '. This is the order the kitchen has on file. Want to change something? Tap below.';

    $('rsvp').hidden = true;
    $('returning').hidden = true;
    $('orderup').hidden = false;
    // restart the print animation
    const r = $('receipt');
    r.style.animation = 'none'; void r.offsetWidth; r.style.animation = '';
    if (fresh) {
      confetti();
      toast('Order up!');
    }
    $('orderup').scrollIntoView({ behavior: fresh ? 'smooth' : 'auto', block: 'start' });
  }

  function editOrder() {
    const o = store.get(STORE_KEY);
    if (o) {
      prefill(o);
      $('returningText').textContent = 'Here is what you ordered last time. Change anything and fire it again. The newest ticket wins.';
      $('returning').hidden = false;
    }
    $('orderup').hidden = true;
    $('rsvp').hidden = false;
    $(o ? 'returning' : 'rsvp').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function prefill(o) {
    const sel = $('guest');
    if (o.guestPick && [...sel.options].some((op) => op.value === o.guestPick)) {
      sel.value = o.guestPick;
      if (o.guestPick === '__other') $('guestOther').value = o.guest;
    } else if (o.guest) {
      sel.value = '__other';
      $('guestOther').value = o.guest;
    }
    $('guestOther').hidden = sel.value !== '__other';
    greet();
    if (o.cocktail) setCocktail(o.cocktail);
    if (o.steak) setSteak(o.steak, false);
    $('steakNotes').value = o.steakNotes || '';
    $('dietary').value = o.dietary || '';
    setSom(!!o.som);
    $('wineText').value = o.som ? '' : (o.wineText || o.wine || '');
  }

  /* ---------------- kitchen wire ---------------- */

  function startWire() {
    let i = Math.floor(Math.random() * WIRE.length);
    const el = $('wire');
    const tick = () => {
      el.style.opacity = 0;
      setTimeout(() => { el.textContent = WIRE[i % WIRE.length]; el.style.opacity = 1; i++; }, 250);
    };
    el.style.transition = 'opacity .25s';
    tick();
    setInterval(tick, 5500);
  }

  /* ---------------- boot ---------------- */

  function boot() {
    const ev = CFG.event;
    $('kicker').textContent = ev.city + ' · ' + ev.where + ' · ' + ev.dateLabel.replace(/, \d{4}$/, '');
    $('ticketNo').textContent = ticketNo();
    $('trackerLink').href = CFG.meatTrackerUrl;
    $('footTracker').href = CFG.meatTrackerUrl;
    $('hostLink').href = CFG.backend.hostSheet;

    buildGuests();
    buildDrinks();
    buildTemps();
    buildWine();
    renderCountdown();
    startWire();

    $('rsvp').addEventListener('submit', onSubmit);
    $('editBtn').addEventListener('click', editOrder);

    // Personal links: ?guest=Heather%20Elliott preselects the name
    const params = new URLSearchParams(location.search);
    const invited = params.get('guest');
    const saved = store.get(STORE_KEY);

    if (saved && saved.guest) {
      prefill(saved);
      showReceipt(saved, false);
      window.scrollTo(0, 0);
    } else if (invited) {
      const match = CFG.guests.find((g) => g.toLowerCase() === invited.toLowerCase());
      if (match) { $('guest').value = match; }
      else { $('guest').value = '__other'; $('guestOther').hidden = false; $('guestOther').value = invited; }
      greet();
    }
  }

  boot();
})();
