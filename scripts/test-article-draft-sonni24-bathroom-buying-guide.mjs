/**
 * Task 64 local-draft integrity gate. No network, DB, environment files or writes.
 * Tests real serialization, metadata helpers, InlineText and sponsored CTA components.
 * Run: node scripts/test-article-draft-sonni24-bathroom-buying-guide.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const ROOT = process.cwd();
const SLUG = 'sonni24-bathroom-buying-guide';
const DATE = '2026-11-26';
const HUMAN_DATE = 'November 26, 2026';
const STORE = 'https://sonni24.de/?ref=NGUYENTHIDUYAN';
const HERO = `/images/articles/${SLUG}/hero-sonni24-composite.jpg`;
const ALT = 'Sonni24 walk-in shower glass, GLM04XL LED mirror, three-door mirror cabinet and white towel radiator';
const CREDIT = 'Official Sonni24 product photography; composite by Duyan Blog.';
const PICKS = [
  { label: 'Walk-In Duschwand', name: 'SONNI Walk-In Duschwand, 70cm / 8mm', handle: 'walk-in-duschabtrennung-duschwand-nano-duschkabine-milchglas-ohne-seitenteil', sku: 'GWR70H', id: 40065799520392, variant: '70cm / 8mm', price: '149.99', job: 'For an open-entry shower partition', image: 'main1_29b19b24-c991-409d-86fc-c5c7fedcda7f.jpg?v=1715932228', html: '7bf29c1b5f69e5d157a7efbcfe15ba2fb9f792846a6d5edf0834e721a9bcf2fa', json: '31b9629e0df20b3029e7e08a61f065482bea2350c72fab0f440705a3e2511b66' },
  { label: 'Corner sliding enclosure', name: 'SONNI Duschkabine Eckeinstieg, 70×70cm / 185cm', handle: 'duschkabine-eckeinstieg-schiebetur-185cm-hoch', sku: 'GCR70+GCR70+GCRF', id: 33989685313672, variant: '70*70cm / 185cm', price: '257.99', job: 'For a closing corner shower entrance', image: '616s0VWk_jL_1.png?v=1715850835', html: '01a7ba3851888f26546c26ca6d9be306e1ab3c91e316088f640cb62964314983', json: '6892fc5c8a77bf443c35011023d2b7ae55435dbe819fffb1d6d0d702612b2443' },
  { label: 'LED Badspiegel', name: 'SONNI LED Badspiegel GLM04XL, 120×60cm', handle: 'sonni-badspiegel-mit-led-beleuchtung-120-60-cm-beschlagfrei-dimmbar-lichtfarbe-einstellbar-mit-led-uhr-temperaturanzeige-wandspiegel-touch-schalter', sku: 'GLM04XL', id: 34461814456456, variant: 'Default Title', price: '149.99', job: 'For illuminated reflection without storage', image: 'main2-W.jpg?v=1716540216', html: '3c05ffaa79e37641e859a4383569bf1cdbcf3d54c0fb0b99fe6b1f93fb45e523', json: 'f6fc88d9379065409adb91a1679a4cdc3a7d6b6cc46c60dafe493606bf3eaac8' },
  { label: 'LED Spiegelschrank', name: 'SONNI LED Spiegelschrank GTBC001T-1, three doors', handle: 'sonni-spiegelschrank-mit-beleuchtung-led-edelstahl-3tuerig-spiegelschrank-bad-mit-touchschalter-und-steckdose', sku: 'GTBC001T-1', id: 34658085175432, variant: 'Default Title', price: '269.99', job: 'For recessed mirror storage above the basin', image: '81jXnRlF5kL._AC_SL1500.jpg?v=1722934997', html: '8ba29c924c66344edeea811ce666cb1598671855aa9db90ff552bffa8b7c31dc', json: '4e833d67758e93b1a9d4305e55e1474e03c28a67942210e8869904e11090eb52' },
  { label: 'Badheizkörper', name: 'SONNI Badheizkörper GTRSF1350W, 500×1314mm / ohne', handle: 'sonni-badheizkorper-design-heizkorper-paneelheizkorper-handtuchwarmer-multiblock', sku: 'GTRSF1350W', id: 44870277431563, variant: '500*1314mm / ohne', price: '164.99', job: 'For towel warming after heat-source confirmation', image: 'main1_1_af6415bd-960b-4d4d-b59c-ad85fb440e1e.jpg?v=1719562671', html: '3645faa0e5d3f6464dd946a903cf4ff093bcb7eedaf6896aa0aee392e6a72a98', json: '2dc91ffdffc0b5ed0143956c4ba865eababe8ab57ea01f03e6a57d74ea164954' },
];
const INTERNAL = ['/methodology', '/affiliate-disclosure', '/guides', '/tech', '/best/best-protoarc-ergonomic-gear'];
const POLICIES = ['/policies/shipping-policy', '/pages/versand', '/pages/lieferung', '/policies/refund-policy', '/pages/widerrufsrecht', '/policies/terms-of-service', '/pages/impressum'];
const PRIOR_PATTERNS = [['fanttik.com','/cdn/shop/files/**'],['www.ottocast.com','/cdn/shop/files/**'],['phomemo.com','/cdn/shop/files/**'],['www.cmycubes.com','/cdn/shop/files/**'],['www.cmycubes.com','/cdn/shop/products/**'],['www.protoarc.com','/cdn/shop/files/**'],['www.aosulife.com','/cdn/shop/files/**']];
const AOSU_HASHES = {
  'content/drafts/aosu-claim-ledger.md': 'e941c2af48c4654f4af92e574e2669b2fc52dd03',
  'content/drafts/how-to-choose-aosu-security-cameras.json': 'd41db2a981aef2ccc2c9ec69ac8ad9bb6bb01642',
  'scripts/test-article-draft-how-to-choose-aosu-security-cameras.mjs': '3d56cb23a72a2c950724126a804c1b2c3c6aab21',
  'public/images/articles/how-to-choose-aosu-security-cameras/hero-aosu-composite.jpg': '60a1c73f73c06fd8ba2d8df2838730fb3fa2930f',
};
let checks = 0, failures = 0;
function check(name, ok, detail = '') { checks++; if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); }
const text = file => readFileSync(path.join(ROOT,file),'utf8');
const digest = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
function strings(v) { return typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []; }
function asURL(v) { try { return new URL(v); } catch { return null; } }
function exactRef(v) {
  const u = asURL(v);
  return !!u && u.protocol === 'https:' && u.hostname === 'sonni24.de' && !u.port && !u.username && !u.password && !u.hash && u.search === '?ref=NGUYENTHIDUYAN' && [...u.searchParams].length === 1 && u.searchParams.get('ref') === 'NGUYENTHIDUYAN';
}
function officialImage(v) {
  const u = asURL(v);
  return !!u && u.protocol === 'https:' && u.hostname === 'sonni24.de' && !u.port && !u.username && !u.password && !u.hash && /^\/cdn\/shop\/files\/.+\.(?:png|jpe?g|webp|avif)$/i.test(u.pathname) && !u.searchParams.has('ref');
}
function badNavigation(value) {
  return strings(value).flatMap(s => {
    const absolute = /(?:https?:)?\/\/[^\s<>"'`)\]]+/gi;
    const found = [...s.matchAll(absolute)].map(m=>m[0]).filter(u=>/sonni24\.de/i.test(u));
    found.push(...[...s.replace(absolute,'').matchAll(/(?:[a-z0-9-]+\.)*sonni24\.de(?:[/?#][^\s<>"'`)\]]*)?/gi)].map(m=>m[0]));
    return found.map(u=>u.replace(/[.,;!]+$/,'')).filter(u=>!officialImage(u) && !exactRef(u));
  });
}
const exactPicks = picks => picks.length === 5 && new Set(picks.map(p=>p.name)).size === 5 && picks.every((p,i)=>p.name === PICKS[i].name && p.rank === i+1 && p.badge === PICKS[i].job);
function affirmativeHits(value, patterns) {
  return value.replace(/\s+/g,' ').split(/(?<=[.!?])\s+/).filter(s=>!s.endsWith('?')).flatMap(sentence => patterns.flatMap(pattern => [...sentence.matchAll(new RegExp(pattern.source,'gi'))].filter(m=>{
    const last = [...sentence.matchAll(/[,;:]|\b(?:but|however|yet|while)\b|\b(?:and|or)\s+(?=(?:we|I|Duyan|our team|it|they|this fixture|the mirror)\b)/gi)].filter(b=>b.index+b[0].length<=m.index).at(-1);
    const prefix = sentence.slice(last ? last.index+last[0].length : 0,m.index).replace(/\bnot only\b/gi,'');
    const suffix = sentence.slice(m.index+m[0].length);
    return !/\b(?:no|not|nor|never|without|unverified|unproven|cannot|can't|didn't|haven't)\b/i.test(prefix.slice(-48)) && !/^\s*(?:neither|no|nothing)\b/i.test(suffix);
  }).map(m=>m[0])));
}
const HANDS_ON = [/\b(?:we|I|Duyan|our team)\s+(?:personally\s+|actually\s+)?(?:tested|handled|bought|measured|experienced|used|ordered|assembled|tried|installed|wired|pressure-tested|water-tested)\b/, /\bin our (?:tests|testing|lab)\b/, /\bour (?:benchmark|hands-on testing|test results|installation test)\b/];
const GUARANTEES = [/\b(?:referral|affiliate)(?: code| links?)?[^.!?;]{0,90}\b(?:does not|do not|doesn't|don't|won't|will not|never) (?:change|affect|increase|raise|alter)s?\b[^.!?;]{0,60}\b(?:price|prices|cost|costs)\b/, /\b(?:at )?no (?:extra|additional) (?:cost|charge)\b/, /\b(?:the )?price (?:you pay )?(?:is|will be|stays|remains) (?:the )?(?:same|unchanged)\b/];
const hasDollar = s=>/\$|\bUSD\b|\bUS dollars?\b/i.test(s);
function forbiddenSchema(v) { return !!v && typeof v === 'object' && Object.entries(v).some(([k,item])=>/^(?:aggregateRating|review)$/i.test(k) || (k==='@type' && [item].flat().some(t=>/^(?:Product|Review|AggregateRating|FAQPage)$/i.test(String(t)))) || forbiddenSchema(item)); }
function exported(mod, predicate) { let v=mod; for(let i=0;i<4;i++){if(predicate(v))return v;v=v?.default;} throw Error('Missing expected TypeScript export'); }
function anchors(markup) { return [...markup.matchAll(/<a\b([^>]*)>/g)].map(m=>{const attrs=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2].replaceAll('&amp;','&')]));return {...attrs,rel:(attrs.rel??'').split(/\s+/)};}); }
function readingEstimate(v) { const skip=new Set(['url','href','src','alt','credit','id','image']);const visit=n=>typeof n==='string'?n.split(/\s+/).filter(Boolean).length:Array.isArray(n)?n.reduce((s,x)=>s+visit(x),0):n&&typeof n==='object'?Object.entries(n).reduce((s,[k,x])=>s+(skip.has(k)?0:visit(x)),0):0;const words=visit(v);return {words,minutes:Math.max(1,Math.min(600,Math.round(words/200)))}; }
function visibleBody(blocks) { return blocks.filter(b=>b.type!=='sources').map(b=>[b.text,b.title,b.blurb,b.name,b.badge,b.caption,...(b.items??[]).flatMap(x=>typeof x==='string'?[x]:[x.q,x.a]),...(b.head??[]),...(b.rows??[]).flat()].filter(Boolean).join(' ')).join(' '); }

async function main() {
  const draft=JSON.parse(text(`content/drafts/${SLUG}.json`));
  const ledger=text('content/drafts/sonni24-claim-ledger.md');
  const blocks=draft.blocks;
  const picks=blocks.filter(b=>b.type==='pick');
  const sources=blocks.filter(b=>b.type==='sources').flatMap(b=>b.items);
  const prose=strings(blocks.filter(b=>['paragraph','list','callout','faq'].includes(b.type)));
  const body=visibleBody(blocks);
  const editorial=[draft.title,draft.deck,draft.tldr,body].join('\n');
  const firstPick=blocks.findIndex(b=>b.type==='pick');
  const before=strings(blocks.slice(0,firstPick)).join('\n');
  check('unpublished non-demo guide/tech with exact slug', draft.type==='guide' && draft.slug===SLUG && draft.categoryId==='tech' && draft.status==='draft' && draft.publishedAt===null && draft.isDemo===false);
  check('exact review date and existing author identity', draft.lastReviewedAt===`${DATE}T00:00:00.000Z` && draft.authorSlug==='duyan' && draft.authorByline==='Duy An Tran');
  check('title 50–60 chars; primary topic first', draft.title.startsWith('Sonni24 buying guide:') && draft.title.length>=50 && draft.title.length<=60,`${draft.title.length} characters`);
  check('active deck 130–155 chars, EUR/region/date', draft.deck.startsWith('Choose Sonni24') && draft.deck.length>=130 && draft.deck.length<=155 && ['Germany/EU','EUR',HUMAN_DATE].every(s=>draft.deck.includes(s)),`${draft.deck.length} characters`);
  check('concise metadata TLDR, four exact tags', draft.tldr.length>=80 && draft.tldr.length<=450 && isDeepStrictEqual(draft.tags,['Sonni24','Bathroom fixtures','Installation planning','European shopping']));
  const reading=readingEstimate(blocks), words=body.split(/\s+/).filter(Boolean).length;
  check('reading time matches repository 200-wpm estimator',draft.readingMinutes===reading.minutes,`${reading.words} block words → ${reading.minutes} minutes`);
  check('high-signal editorial body 2200–2800 words',words>=2200 && words<=2800,`${words} visible body words, excluding sources`);
  const allowed=new Set(['paragraph','heading','list','callout','table','pick','faq','sources']);
  check('supported blocks only; no DB offers/embeds',blocks.length>0 && blocks.every(b=>allowed.has(b.type) && !b.offerId) && !/go:|\/go\//.test(editorial));
  check('warning with honest research limits before any CTA',blocks[0].type==='callout' && blocks[0].variant==='warning' && /commission/.test(blocks[0].text) && ['did not install','wire','glass flatness','water tightness','heating output'].every(s=>blocks[0].text.includes(s)));
  check('intro names merchant and buying framework, not tested winners',blocks[1].type==='paragraph' && /Sonni24 buying guide/.test(blocks[1].text) && /Sonni Sanitär GmbH/.test(blocks[1].text) && /heat source/.test(blocks[1].text));
  check('short version, complete checklist and region precede picks', ['The short version','Check region, measurements and installation first'].every(s=>blocks.slice(0,firstPick).some(b=>b.type==='heading' && b.level===2 && b.text===s)) && /Verstellbereich/.test(before) && /ohne Duschtasse/i.test(before));
  check('upfront German storefront/contract disclosure and unverified manual/support caveat', /storefront and contract language are German/i.test(before) && /Manual and support languages were not verified; confirm them before ordering/i.test(before) && !/German-language storefront, checkout, manuals and support|Expect German checkout, manuals and support/i.test(body) && /all amounts are EUR/.test(before) && /VAT\/MwSt/.test(before));
  check('Germany confirmed; other EU addresses conditional; no US domestic framing', /Germany is documented/.test(before) && /other EU destinations need address-specific confirmation/.test(before) && /not a US domestic store/.test(before));
  check('European 230V/IP44 context does not claim US wiring or per-SKU input', /European 230V/.test(before) && /120V US wiring/.test(before) && /IP44/.test(before) && /Exact SKU input ratings and plug-versus-hardwire arrangements were not verified/.test(before) && /qualified electrician\/plumber/.test(before));
  check('measurement/load/glass/tray/freight checklist present', ['finished tiled','15mm','20mm','ESG','6mm','8mm','5mm','without a shower tray','loaded cabinet','filled radiator','Spedition','14-day'].every(s=>before.includes(s)));
  check('final single in-body sources block compensates for guide architecture',blocks.at(-1).type==='sources' && blocks.filter(b=>b.type==='sources').length===1 && sources.length>=11);
  const {tsImport}=await import('tsx/esm/api');
  const schema=exported(await tsImport('../src/lib/content-schema.ts',import.meta.url),m=>typeof m?.serializeBlocks==='function');
  try { const serialized=schema.serializeBlocks(blocks),parsed=schema.parseBlocks(serialized);check('actual serializeBlocks roundtrip retains all fields',isDeepStrictEqual(parsed,blocks) && schema.serializeBlocks(parsed)===serialized,`${parsed.length}/${blocks.length} blocks`); } catch(e){check('schema strict write validation',false,e.message);}
  const valid={type:'paragraph',text:'Schema positive control.'},invalid={type:'pick',rank:0,name:'Invalid',blurb:'Invalid rank.'};let rejected=false;try{schema.serializeBlocks([invalid]);}catch{rejected=true;}
  check('schema positive/negative parse-drop controls',rejected && isDeepStrictEqual(schema.parseBlocks(JSON.stringify([valid,invalid])),[valid]) && schema.parseBlocks('bad JSON').length===0);
  const badRefs=['https://sonni24.de/?Ref=NGUYENTHIDUYAN','https://sonni24.de/?REF=NGUYENTHIDUYAN','https://sonni24.de/?ref=nguyenthiduyan','https://sonni24.de/?ref=Nguyenthiduyan','https://sonni24.de/','https://sonni24.de/?ref=NGUYENTHIDUYANx','https://sonni24.de/?next=ref=NGUYENTHIDUYAN','https://sonni24.de/#ref=NGUYENTHIDUYAN','https://sonni24.de/?%72ef=NGUYENTHIDUYAN','https://sonni24.de/?ref=NGUYENTHIDUYAN&ref=NGUYENTHIDUYAN','https://sonni24.de/?ref=NGUYENTHIDUYAN&Ref=NGUYENTHIDUYAN','https://sonni24.de.evil.example/?ref=NGUYENTHIDUYAN','https://www.sonni24.de/?ref=NGUYENTHIDUYAN','http://sonni24.de/?ref=NGUYENTHIDUYAN','not a URL'];
  check('exact uppercase ref positives and wrong-case/key/spoof negatives',exactRef(STORE) && exactRef('https://sonni24.de/pages/versand?ref=NGUYENTHIDUYAN') && badRefs.every(u=>!exactRef(u)));
  check('all five CTAs use exact canonical storefront, not deep links',picks.length===5 && picks.every(p=>p.url===STORE));
  check('all sources specific, dated, canonical and exact-ref suffixed',sources.length>=11 && sources.every(s=>s.label.includes(HUMAN_DATE) && exactRef(s.url) && /^\/(?:products|pages|policies)\//.test(asURL(s.url).pathname)));
  check('recursive navigation controls reject raw/hidden/spoofed merchant links',badNavigation({hidden:badRefs[0]}).length===1 && badNavigation({hidden:'sonni24.de/products/raw'}).length===1 && badNavigation({hidden:badRefs[11]}).length===1 && badNavigation({hidden:STORE}).length===0);
  check('no invalid merchant navigation in any field',badNavigation(draft).length===0);
  check('zero raw merchant domains in paragraph/list/callout/FAQ prose',prose.every(s=>!/sonni24\.de/i.test(s)));
  check('five exact distinct in-stock fixtures with nonoverlapping jobs',exactPicks(picks) && new Set(picks.map(p=>p.badge)).size===5);
  check('selection controls reject duplicates and unverified substitutions',!exactPicks(picks.map((p,i)=>i===1?picks[0]:p)) && !exactPicks(picks.map((p,i)=>i===3?{...p,name:'Surface-mount universal cabinet'}:p)));
  check('five exact official og-image resources with width=240',picks.every((p,i)=>officialImage(p.imageUrl) && p.imageUrl===`https://sonni24.de/cdn/shop/files/${PICKS[i].image}&width=240` && asURL(p.imageUrl).searchParams.getAll('width').join()==='240'));
  check('image host/path/spoof negative controls',officialImage(picks[0].imageUrl) && !officialImage('https://sonni24.de/products/x.jpg') && !officialImage('https://www.sonni24.de/cdn/shop/files/x.jpg') && !officialImage('https://sonni24.de.evil.example/cdn/shop/files/x.jpg'));
  for(const [i,p] of PICKS.entries()) {
    const pick=picks[i],line=ledger.split(/\r?\n/).find(s=>s.startsWith(`| ${p.label} |`)),cells=line?.split('|').map(s=>s.trim());
    check(`${p.sku}: exact dated EUR price/SKU/stock in blurb`,pick.blurb.includes(`€${p.price} EUR`) && pick.blurb.includes(p.sku) && pick.blurb.includes(HUMAN_DATE) && /stock available in both saved variant records/.test(pick.blurb));
    check(`${p.sku}: ledger displayed/JSON/variant/availability parity`,cells?.[2]===`€${p.price} EUR` && cells?.[3]===`€${p.price} EUR` && cells?.[4].includes(p.variant) && cells?.[4].includes(p.sku) && cells?.[4].includes(String(p.id)) && cells?.[5].includes('available=true') && cells?.[5].includes('cartEnabled=true'));
    check(`${p.sku}: source/image/raw-cache hashes pinned in ledger`,sources.some(s=>asURL(s.url)?.pathname===`/products/${p.handle}`) && ledger.includes(pick.imageUrl) && ledger.includes(pick.imageUrl.replace('&width=240','')) && ledger.includes(p.html) && ledger.includes(p.json));
    const file=`tmp/task-sonni24/downloads/${p.handle}`;
    if(existsSync(`${file}.html`) && existsSync(`${file}.js.json`)) {
      const html=text(`${file}.html`),js=JSON.parse(text(`${file}.js.json`)),hv=JSON.parse(html.match(/first_load_selected_variant:\s*(\{[^\n]+\}),inventoryQuantityByVariantId:/)?.[1]??'null'),v=js.variants.find(x=>x.id===p.id);
      const display=html.match(/<div class="price-list" data-product-price-list>([\s\S]*?)<\/div>/)?.[1]??'';
      const button=html.match(/<button\b([^>]*\bid="AddToCart"[^>]*)>/);
      check(`${p.sku}: raw HTML + JSON stock, exact cents, selected price and enabled cart`,digest(readFileSync(`${file}.html`))===p.html && digest(readFileSync(`${file}.js.json`))===p.json && js.available===true && v?.available===true && v?.sku===p.sku && v?.title===p.variant && (v.price/100).toFixed(2)===p.price && hv?.available===true && hv?.id===p.id && hv?.price===v?.price && display.includes(`${p.price.replace('.',',')}€`) && !!button && !/\bdisabled\b/.test(button[1]) && /lang="de"/.test(html));
    }
  }
  const tables=blocks.filter(b=>b.type==='table');
  check('one dated five-column/five-row exact EUR comparison table',tables.length===1 && tables[0].caption.includes(HUMAN_DATE) && tables[0].head.length===5 && tables[0].rows.length===5 && tables[0].rows.every((r,i)=>r.length===5 && r[0].includes(PICKS[i].sku) && r[4]===`€${PICKS[i].price} EUR`));
  check('no invented dollars or USD conversion; positive/negative currency controls',!hasDollar(editorial) && hasDollar('$149.99 USD') && hasDollar('149 US dollars') && !hasDollar('€149.99 EUR'));
  check('clear walk-in specification and misleading old handle handled honestly', ['200cm','8mm ESG','Nano coating','100cm stainless','685–700mm','clear Klarglas','Tray and drain inclusion is not established'].every(s=>picks[0].blurb.includes(s)));
  check('corner 5mm/EN12150/height/adjustment/tray exclusions scoped', ['5mm ESG to EN 12150','680–700mm','185/195cm','Ohne Duschtasse','tray is excluded'].every(s=>picks[1].blurb.includes(s)) && !/6mm ESG|8mm ESG/.test(picks[1].blurb));
  check('mirror dimensions/IP44/three colours/anti-fog; unknown electrics explicit', ['1200×600×35mm','IP44','three adjustable light colours','two touch controls','anti-fog','input voltage','plug-versus-hardwire','not verified'].every(s=>picks[2].blurb.includes(s)));
  check('cabinet stainless/recess/9W/shaver socket/shelves and loads explicit', ['recessed','not a conventional surface-mounted','105cm','65cm','13cm','stainless steel','IP44','9W','unsuitable for hair dryers','Shelf count/adjustability','fixing-load rating'].every(s=>picks[3].blurb.includes(s)));
  check('radiator electric/hydronic contradiction not hidden by headline', ['500×1314mm','RAL 9016','SPCC','thermostat and Heizstab','hot-water heating','555/634/770W','does not establish an electric element','Anschlussarmatur','€209.99 EUR','Do not buy it as a verified plug-in heater'].every(s=>picks[4].blurb.includes(s)));
  check('no borrowed radiator BTU/IP44/230V element rating or universal connection spec', ['no verified BTU figure','230V element rating or IP44 rating','Mittelanschluss','connection centres','thread dimensions','rating conditions'].every(s=>body.includes(s)));
  check('three technical deep dives, methodology and policy headings retained', ['Glass: adjustment is not an extra opening allowance','Mirrors: settle the recess and electrical supply together','Radiators: a Heizstab and a Mittelanschluss do different work','How we chose','Before you buy from Sonni24'].every(s=>blocks.some(b=>b.type==='heading' && b.text===s)));
  check('all seven official policies sourced and ledger parity',POLICIES.every(p=>sources.some(s=>asURL(s.url)?.pathname===p)) && sources.every(s=>ledger.includes(s.url)));
  check('shipping contradictions and exact EUR fee figures, not blanket free delivery', ['€0.00 EUR','€10.00 EUR','€20.00 EUR','€199.00 EUR','€60.00 EUR','Shipping costs conflict','3–15 working days','Packstation'].every(s=>body.includes(s)));
  check('ground-floor/no-stairs and curbside uncertainty retained', /ground-floor door/.test(body) && /no stairs, carrying inside or assembly/.test(body) && /does not expressly promise frei Bordsteinkante/.test(body));
  check('14-day statutory withdrawal/buyer return freight/refund hold/page conflict', ['14-day Widerrufsrecht','within 14 days after notice','Buyers pay direct change-of-mind return costs','€30.00 EUR','not a guaranteed bulky-freight cap','withheld pending goods or dispatch proof','one month and 15-day return dispatch','Defective-goods rights are separate'].every(s=>body.includes(s)));
  check('damage reports do not become a statutory seven-day cutoff', /seven working days/.test(body) && /missed consumer damage reporting does not remove statutory rights/.test(body) && /not a seven-day legal claim cutoff/.test(body));
  check('no affirmative hands-on claims',affirmativeHits(editorial,HANDS_ON).length===0);
  const allowedHands='We did not install the mirror. We measured neither flatness nor output. We tested no fixtures. Did we wire it? We never ordered it.';
  const badHands='We installed the mirror. We wired it. No shipping fee, we tested the glass. We did not install glass, but we wired the mirror. Not only that, we measured output. We did not test water tightness and we tested heating. We did not wire it; we installed it. Our test results prove it.';
  check('clause-scoped hands-on controls catch unrelated-negation escapes',affirmativeHits(allowedHands,HANDS_ON).length===0 && affirmativeHits(badHands,HANDS_ON).length>=8);
  check('zero banned list-price wording',!/\blist price\b/i.test(editorial));
  check('no unconditional affiliate-price promise or unverified coupon saving',affirmativeHits(editorial,GUARANTEES).length===0 && /Sonni24 controls checkout prices/.test(body) && /no coupon discount value was specified/.test(body));
  check('price-guarantee positive/negative controls',affirmativeHits('A referral code does not change the store price. At no extra cost to you.',GUARANTEES).length===2 && affirmativeHits('We do not promise the price you pay is the same. No price guarantee is made.',GUARANTEES).length===0);
  const dashes=(editorial.match(/—/g)??[]).length;
  check('em-dash density <=2 per 500 words',dashes/editorial.split(/\s+/).length*500<=2,`${dashes} em dashes`);
  check('eight FAQs; no FAQPage schema',blocks.filter(b=>b.type==='faq').length===1 && blocks.find(b=>b.type==='faq').items.length===8 && !forbiddenSchema(draft));
  const affiliate=exported(await tsImport('../src/components/affiliate/affiliate-link.tsx',import.meta.url),m=>typeof m?.isReferralUrl==='function');
  const inline=exported(await tsImport('../src/components/editorial/inline-text.tsx',import.meta.url),m=>typeof m?.InlineText==='function');
  const {createElement}=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
  check('actual isReferralUrl positive/wrong-key negative pins',affiliate.isReferralUrl(STORE) && !affiliate.isReferralUrl(badRefs[0]) && !affiliate.isReferralUrl('https://sonni24.de/pages/versand') && !affiliate.isReferralUrl('not a URL'));
  check('marking helper is not mistaken for exact commission-code validation',affiliate.isReferralUrl(badRefs[2]) && !exactRef(badRefs[2]) && sources.every(s=>affiliate.isReferralUrl(s.url)));
  const marked=anchors(renderToStaticMarkup(createElement(inline.InlineText,{text:`[Commercial](${STORE}) [Ordinary](https://example.com/research)`})));
  check('real inline renderer sponsors commercial links only',marked.length===2 && marked[0].rel.includes('sponsored') && marked[0].rel.includes('noopener') && marked[0].target==='_blank' && !marked[1].rel.includes('sponsored') && marked[1].rel.includes('nofollow'));
  const cta=anchors(renderToStaticMarkup(createElement(affiliate.DirectAffiliateButton,{url:STORE},'Visit merchant store'))),disclosure=renderToStaticMarkup(createElement(affiliate.AffiliateDisclosure));
  check('real direct CTA + self-contained commission disclosure',cta.length===1 && cta[0].href===STORE && cta[0].rel.includes('sponsored') && cta[0].rel.includes('noopener') && cta[0].target==='_blank' && /may earn a commission/.test(disclosure) && /affiliate-disclosure/.test(disclosure));
  const links=[...new Set(anchors(prose.map(s=>renderToStaticMarkup(createElement(inline.InlineText,{text:s}))).join('')).map(a=>a.href).filter(u=>u.startsWith('/')&&!u.startsWith('//')))];
  check('five verified-live internal prose links actually render, no extra route',links.length===5 && INTERNAL.every(u=>links.includes(u)),links.join(', '));
  check('all five HTTP/canonical observations retained in ledger',INTERNAL.every(u=>ledger.includes(`| ${u} | 200 | true |`)));
  check('no unpublished aosu link or fake offer IDs in draft',!strings(draft).some(s=>/how-to-choose-aosu-security-cameras|go:|\/go\//.test(s)));
  const renderer=text('src/components/editorial/article-renderer.tsx'),sourceBranch=renderer.slice(renderer.indexOf('case "sources":'),renderer.indexOf('case "divider":')),pickBranch=renderer.slice(renderer.indexOf('case "pick":'),renderer.indexOf('case "comparisonEmbed":'));
  check('sources preserve actual isReferralUrl sponsored/noopener branch',/href=\{s\.url\}/.test(sourceBranch) && /rel=\{isReferralUrl\(s\.url\)\s*\?\s*"sponsored noopener"\s*:\s*"noopener nofollow"\}/.test(sourceBranch));
  check('pick branch retains generic CTA/plain heading/adjacent disclosure',/<DirectAffiliateButton url=\{block\.url\}>Visit merchant store<\/DirectAffiliateButton>/.test(pickBranch) && /<AffiliateDisclosure/.test(pickBranch) && /\{block\.name\}/.test(pickBranch) && !/href=\{block\.url\}/.test(pickBranch));
  const guide=text('src/app/guides/[slug]/page.tsx');
  check('GuidePage keeps TOC/body sources architecture without new schema',/<TableOfContents blocks=\{blocks\}/.test(guide) && /<ArticleRenderer blocks=\{blocks\}/.test(guide) && !/<TldrBox|<SourcesList/.test(guide) && !/aggregateRating|\b(?:productJsonLd|reviewJsonLd|faqJsonLd)\s*\(/i.test(guide));
  check('forbidden-schema controls catch nested/Product/Review/FAQPage types',forbiddenSchema({nested:{'@type':'Product'}}) && forbiddenSchema({aggregateRating:{}}) && forbiddenSchema({'@type':['Article','FAQPage']}) && forbiddenSchema({'@type':'Review'}) && !forbiddenSchema({'@type':'Article'}));
  const seoText=text('src/lib/seo.ts');
  check('shared SEO retains no aggregateRating policy pin',/aggregateRating/.test(seoText) && !/["']aggregateRating["']\s*:|\baggregateRating\s*:\s*\{/.test(seoText));
  // Public-origin fixture only; never read or print inherited configuration values.
  process.env.NEXT_PUBLIC_SITE_URL = 'https://duyanblog.com';
  const seo=exported(await tsImport('../src/lib/seo.ts',import.meta.url),m=>typeof m?.articleJsonLd==='function');
  const article=seo.articleJsonLd({type:'guide',title:draft.title,deck:draft.deck,slug:SLUG,path:`/guides/${SLUG}`,image:HERO,authorName:draft.authorByline,authorSlug:draft.authorSlug,publishedAt:null,updatedAt:new Date(`${DATE}T00:00:00.000Z`),section:'Tech'}),crumbs=seo.breadcrumbJsonLd([{label:'Home',href:'/'},{label:'Guides',href:'/guides'},{label:draft.title,href:`/guides/${SLUG}`}]);
  check('actual Article/BreadcrumbList only with no draft publication date',article['@type']==='Article' && crumbs['@type']==='BreadcrumbList' && article.datePublished===undefined && article.url===`https://duyanblog.com/guides/${SLUG}` && !forbiddenSchema([article,crumbs]));
  const config=exported(await tsImport('../next.config.ts',import.meta.url),m=>!!m?.images),patterns=config.images.remotePatterns,sonni=patterns.filter(p=>/sonni24/i.test(p.hostname??''));
  check('one exact narrow HTTPS sonni24.de image pattern',sonni.length===1 && sonni[0].protocol==='https' && sonni[0].hostname==='sonni24.de' && sonni[0].pathname==='/cdn/shop/files/**' && !sonni[0].port && !(config.images.domains??[]).some(h=>/sonni24/.test(h)));
  check('all seven prior patterns including Task 63 preserved; no wildcard host',PRIOR_PATTERNS.every(([hostname,pathname])=>patterns.some(p=>p.protocol==='https'&&p.hostname===hostname&&p.pathname===pathname)) && patterns.every(p=>p.hostname&&!p.hostname.includes('*')) && patterns.length===8);
  check('Task 63 draft/ledger/test/hero byte hashes preserved',Object.entries(AOSU_HASHES).every(([file,hash])=>existsSync(file)&&digest(readFileSync(file),'sha1')===hash));
  check('exact hero path/alt/credit, four pictured fixtures and <=125-char alt',draft.heroImage===HERO && draft.heroAlt===ALT && draft.heroAlt.length<=125 && draft.heroCredit===CREDIT && !/corner|Eckeinstieg/.test(draft.heroAlt));
  check('hero not duplicated in any body block; composite note honest',!strings(blocks).some(s=>s.includes(HERO)) && /not our product shoot/.test(body) && /not pictured/.test(body) && /multiple widths/.test(body));
  const bytes=readFileSync(path.join(ROOT,'public',HERO));
  check('hero JPEG FF D8 FF <=200KB and ledger SHA256 parity',bytes.subarray(0,3).equals(Buffer.from([255,216,255])) && bytes.length<=200000 && ledger.includes(digest(bytes)),`${bytes.length} bytes`);
  const {default:sharp}=await import('sharp'),meta=await sharp(bytes).metadata(),decoded=await sharp(bytes).raw().toBuffer({resolveWithObject:true});
  check('hero fully decodes as 1600x1000 JPEG',meta.format==='jpeg' && meta.width===1600 && meta.height===1000 && decoded.info.width===1600 && decoded.info.height===1000);
  const pixel=[...decoded.data.subarray(0,3)];
  check('flat warm paper #F6F3EC corner within JPEG tolerance',pixel.every((n,i)=>Math.abs(n-[246,243,236][i])<=3),pixel.join(','));
  const manifest=JSON.parse(text('public/images/.media-manifest.json'));
  check('manifest hero/Task63 parity',manifest[HERO]?.width===1600 && manifest[HERO]?.height===1000 && manifest['/images/articles/how-to-choose-aosu-security-cameras/hero-aosu-composite.jpg']?.width===1600 && manifest['/images/articles/how-to-choose-aosu-security-cameras/hero-aosu-composite.jpg']?.height===1000);
  check('ledger exact date/approved Store ID/EUR/owner-reported rights',ledger.includes(HUMAN_DATE) && ledger.includes(DATE) && /Store ID 7175646/.test(ledger.replaceAll('**','')) && /approved/.test(ledger) && /currency \*\*EUR/.test(ledger) && /OWNER-REPORTED AUTHORIZATION/.test(ledger) && /No written license or signer/.test(ledger));
  check('ledger hero alt/credit/path and deep-link limits match',ledger.includes(HERO) && ledger.includes(ALT) && ledger.includes(CREDIT) && /deep-link commission attribution is \*\*unverified/.test(ledger));
  check('ledger explicit uncertainty and DB/render skip, no DB rows', ['UNRESOLVED','not conventional surface mounting','5mm, not 6mm','one month','VAT inclusion not established','local_mysql_tcp_reachable=false','database_target_is_local_duyanblog_dev=false','rendered_route_qa_performed=false','No Article/Merchant/AffiliateOffer'].every(s=>ledger.includes(s)));
  const proofFile='tmp/task-sonni24/asset-and-link-verification.json';
  if(existsSync(proofFile)) {
    const proof=JSON.parse(text(proofFile));
    check('saved bounded live proof: five HTTP 200 exact canonical routes',proof.checkedDate===DATE && proof.links.length===5 && INTERNAL.every(route=>proof.links.some(r=>r.route===route&&r.status===200&&r.canonical===`https://duyanblog.com${route}`&&r.notFound===false)));
    check('saved bounded live proof: five exact 240px thumbnail decodes',proof.thumbs.length===5 && PICKS.every((p,i)=>proof.thumbs.some(t=>t.handle===p.handle&&t.url===picks[i].imageUrl&&t.status===200&&t.width===240&&t.height===240&&t.bytes<50000)));
    check('www redirects to canonical non-www host',proof.www.some(r=>r.url==='https://www.sonni24.de/'&&r.status===301&&r.location==='https://sonni24.de/'));
  }
  const baselineFile='tmp/task-sonni24/preservation-baseline.json';
  if(existsSync(baselineFile)) {
    const baseline=JSON.parse(text(baselineFile));
    check('all baseline manifest entries and complete previous worklog preserved',Object.entries(baseline.manifest).every(([k,v])=>isDeepStrictEqual(manifest[k],v)) && text('worklog.md').startsWith(baseline.worklog));
    check('protected untracked SHA1 files unchanged',Object.entries(baseline.hashes).every(([file,hash])=>digest(readFileSync(file),'sha1')===hash));
  }
}
try { await main(); } catch(e) { check('gate execution completed',false,e instanceof Error?e.stack:String(e)); }
console.log(`\n${failures ? `${failures} failure(s) in ${checks} Sonni24 checks.` : `All ${checks} Sonni24 guide draft integrity checks passed.`}`);
process.exitCode=failures?1:0;
