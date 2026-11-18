// build-quotes.mjs — run once: node build-quotes.mjs
import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BUZZ_URL = 'https://www.buzzfeed.com/evelinamedina/funny-movie-quotes';

// 1990s is verified working. uncomment any others that exist — the script prints
// a count per page, so a 0 or a 404 tells you immediately.
const FILM_URLS = [
  'https://www.filmsite.org/1950squotes.html',
  'https://www.filmsite.org/1980squotes.html',
  'https://www.filmsite.org/1990squotes.html',
  'https://www.filmsite.org/2000squotes.html',
  'https://www.filmsite.org/2010squotes.html',
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const decodeEntities = (v) => String(v || '')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
  .replace(/&#0?39;|&apos;/gi, "'").replace(/&(?:rsquo|lsquo);/gi, "'")
  .replace(/&(?:rdquo|ldquo);/gi, '"').replace(/&mdash;|&ndash;/gi, '-')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const stripHtml = (v) => decodeEntities(String(v || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const clean = (v) => (typeof v === 'string'
  ? v.replace(/\s{2,}/g, ' ').trim().replace(/^["'“”‘’]+/, '').replace(/["'“”‘’]+$/, '').trim()
  : '');

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept': 'text/html' } });
  if (!res.ok) { console.warn(`  ! HTTP ${res.status} for ${url}`); return ''; }
  return await res.text();
}

function parseBuzz(html) {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  const json = JSON.parse(m[1]);
  const subs = (json.props?.pageProps?.buzz?.sub_buzzes) || [];
  const out = [];

  for (const s of subs) {
    const text = stripHtml(s.header);
    const mm = text.match(/^["“]([\s\S]*)["”]\s*[-–—]\s*(.+)$/);
    if (!mm) continue;

    const quote = clean(mm[1]);
    if (quote.length < 4 || quote.length > 300) continue;

    let rest = mm[2].trim();
    let actor = '';
    let character = '';
    let film = rest;

    const asIdx = rest.indexOf(' as ');
    if (asIdx !== -1) { actor = clean(rest.slice(0, asIdx)); rest = rest.slice(asIdx + 4).trim(); }

    const inIdx = rest.indexOf(' in ');
    if (inIdx !== -1) { character = clean(rest.slice(0, inIdx)); film = rest.slice(inIdx + 4).trim(); }
    else { character = actor ? '' : clean(rest); film = ''; }

    film = clean(film.replace(/\s*\((?:19|20)\d{2}\)\s*$/, ''));
    if (!film) continue;

    out.push({ quote, film, character, actor, source: 'buzzfeed' });
  }

  return out;
}

function parseFilmsite(html) {
  const blocks = html.split(/images\/quote_sm\.gif/).slice(1);
  const out = [];

  for (const block of blocks) {
    const filmM = block.match(/<i>([\s\S]*?)<\/i>/);
    const head = filmM ? block.slice(0, filmM.index) : block;

    const first = head.indexOf('&quot;');
    const last = head.lastIndexOf('&quot;');
    if (first === -1 || last <= first) continue;

    const quote = clean(stripHtml(head.slice(first + 6, last)));
    if (quote.length < 4 || quote.length > 300) continue;

    let film = filmM ? stripHtml(filmM[1]) : '';
    film = clean(film.replace(/\s*\((?:19|20)\d{2}\)\s*$/, ''));
    if (!film) continue;

    out.push({ quote, film, character: '', actor: '', source: 'filmsite' });
  }

  return out;
}

async function main() {
  const pool = [];

  console.log('buzzfeed...');
  const buzz = parseBuzz(await get(BUZZ_URL));
  console.log(`  ${buzz.length}`);
  pool.push(...buzz);

  for (const url of FILM_URLS) {
    console.log(`filmsite ${url.split('/').pop()}...`);
    const film = parseFilmsite(await get(url));
    console.log(`  ${film.length}`);
    pool.push(...film);
  }

  // optional: your classic pool exported from Render, as an array of {quote, film, character}
  if (existsSync('classic.json')) {
    const raw = JSON.parse(await readFile('classic.json', 'utf8'));
    const list = Array.isArray(raw) ? raw : (raw.quotes || []);
    console.log(`classic.json... ${list.length}`);
    for (const c of list) {
      const quote = clean(c.quote);
      const film = clean(c.film);
      if (!quote || !film) continue;
      pool.push({ quote, film, character: clean(c.character), actor: clean(c.actor), source: 'classic' });
    }
  }

  const seen = new Set();
  const quotes = pool.filter((q) => {
    const key = q.quote.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const json = JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: quotes.length, quotes }, null, 2) + '\n';
  await writeFile('quotes.json', json, 'utf8');

  const by = quotes.reduce((a, q) => ((a[q.source] = (a[q.source] || 0) + 1), a), {});
  console.log(`\nwrote quotes.json — ${quotes.length} quotes, ${(json.length / 1024).toFixed(1)} KB`);
  console.log('by source:', by);
}

main().catch((e) => { console.error(e); process.exit(1); });
