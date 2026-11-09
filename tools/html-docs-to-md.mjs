// docs/ 配下の解説 HTML を GitHub 表示用の Markdown に変換する。
//
// HTML 側は一切変更しない。各 HTML と同じディレクトリに同名の .md を書き出す
// （docs/index.html だけは docs/README.md — GitHub で docs/ を開いたとき自動表示されるため）。
//
// 使い方: node tools/html-docs-to-md.mjs
//
// このスクリプトは `generate-code-docs` スキルが生成する HTML の構造
// （doc-header / doc-section / doc-chunk / doc-structure / arch-diagram / callout /
//   index-grid / doc-footer）だけを前提にした、専用の変換器である。

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'

const DOCS_DIR = 'docs'

// ---------------------------------------------------------------- ユーティリティ

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  times: '×',
  divide: '÷',
  middot: '・',
  bull: '•',
  deg: '°',
  plusmn: '±',
  minus: '−',
  le: '≤',
  ge: '≥',
  ne: '≠',
  rarr: '→',
  larr: '←',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  copy: '©',
  reg: '®',
  trade: '™',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  laquo: '«',
  raquo: '»',
}

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, body) ? ENTITIES[body] : whole
  })
}

function stripTags(html) {
  return html.replace(/<\/?[a-zA-Z][^>]*>/g, '')
}

function collapseWs(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function collapse(text) {
  return collapseWs(text)
}

// HTML ソースの折り返し改行をそのまま空白にすると
// 「です。 車検の」のように和文の途中に隙間が残る。
// 和文の文字同士をつなぐ
// 改行だけを落とす。同じ行に書かれた空白（コード片の前後など）は意図したものなので残す。
const CJK = '\\u3000-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef'
const JA_WRAP = new RegExp(`([${CJK}])[ \\t]*\\n\\s*(?=[${CJK}])`, 'gu')

function joinJaWrap(html) {
  return html.replace(JA_WRAP, '$1')
}

// GitHub（github-slugger）の見出しアンカー生成の近似。
// 小文字化 → 記号・句読点を削除（CJK は残る） → 空白をハイフンに。
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\p{Pc}\-\s]/gu, '')
    .replace(/\s/g, '-')
}

// -------------------------------------------------------------- インライン変換

const MD_ESCAPE = /[\\`*_[\]<>]/g

function escapeText(text, cell) {
  const escaped = text.replace(MD_ESCAPE, (ch) => {
    if (ch === '<') return '&lt;'
    if (ch === '>') return '&gt;'
    return `\\${ch}`
  })
  return cell ? escaped.replace(/\|/g, '\\|') : escaped
}

function codeSpan(text, cell) {
  const body = cell ? text.replace(/\|/g, '\\|') : text
  const fence = body.includes('`') ? '``' : '`'
  const pad = body.startsWith('`') || body.endsWith('`') ? ' ' : ''
  return `${fence}${pad}${body}${pad}${fence}`
}

function makeInline(rewriteHref) {
  const scan = (html, cell) => {
    let out = ''
    let i = 0
    while (i < html.length) {
      if (html[i] === '<') {
        const rest = html.slice(i)
        let m
        if ((m = /^<code>([\s\S]*?)<\/code>/.exec(rest))) {
          out += codeSpan(collapseWs(decodeEntities(stripTags(m[1]))), cell)
          i += m[0].length
          continue
        }
        if ((m = /^<strong>([\s\S]*?)<\/strong>/.exec(rest))) {
          const inner = scan(m[1], cell).trim()
          out += inner ? `**${inner}**` : ''
          i += m[0].length
          continue
        }
        if ((m = /^<em>([\s\S]*?)<\/em>/.exec(rest))) {
          const inner = scan(m[1], cell).trim()
          out += inner ? `*${inner}*` : ''
          i += m[0].length
          continue
        }
        if ((m = /^<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(rest))) {
          const label = scan(m[2], cell).trim()
          out += `[${label}](${rewriteHref(m[1])})`
          i += m[0].length
          continue
        }
        if ((m = /^<\/?[a-zA-Z][^>]*>/.exec(rest))) {
          i += m[0].length
          continue
        }
      }
      const next = html.indexOf('<', i)
      const chunk = next === -1 ? html.slice(i) : html.slice(i, next)
      out += escapeText(decodeEntities(chunk), cell)
      i += chunk.length || 1
    }
    return out
  }
  return (html, cell = false) => collapseWs(scan(joinJaWrap(html), cell))
}

// ------------------------------------------------------------------ コード言語

const EXT_LANG = { ts: 'ts', tsx: 'tsx', css: 'css', sql: 'sql', js: 'js', mjs: 'js' }

function guessLang(code, fallback) {
  const head = code.trimStart()
  if (/^(--|\/\*\s*rls)/i.test(head) || /\b(create (or replace )?(table|policy|function|index|trigger|type)|alter table|grant |revoke |insert into|drop (table|policy|function))\b/i.test(code)) {
    return 'sql'
  }
  if (/^(\$ |npm |npx |node |supabase |wrangler |git |pnpm |yarn )/.test(head)) return 'bash'
  if (/^\{[\s\S]*"[^"]+"\s*:/.test(head)) return 'json'
  return fallback
}

function fenceFor(code) {
  let fence = '```'
  while (code.includes(fence)) fence += '`'
  return fence
}

// ------------------------------------------------------------------ 本体の変換

// id="xxx" と、その id が指す見出し文の対応表を作る。
// 見出しの直前（前の見出し以降）に現れた id と、見出しタグ自身の id を
// その見出しに結び付ける。
function buildIdMap(html) {
  const map = new Map()
  const headingRe = /<(h1|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>/g
  let hm
  let prevEnd = 0
  while ((hm = headingRe.exec(html))) {
    const text = collapse(decodeEntities(stripTags(hm[2])))
    const openTag = /^<(?:h1|h2|h3|h4)\b[^>]*>/.exec(html.slice(hm.index))?.[0] ?? ''
    const region = html.slice(prevEnd, hm.index) + openTag
    const idRe = /\sid="([^"]+)"/g
    let im
    while ((im = idRe.exec(region))) {
      if (!map.has(im[1])) map.set(im[1], text)
    }
    prevEnd = hm.index + hm[0].length
  }
  return map
}

function makeHrefRewriter(idMap) {
  const rewriteTarget = (target) => {
    if (!target.endsWith('.html')) return target
    if (target === 'index.html' || target.endsWith('/index.html')) {
      return target.replace(/index\.html$/, 'README.md')
    }
    return target.replace(/\.html$/, '.md')
  }
  return (href) => {
    if (/^(https?:|mailto:|tel:)/i.test(href)) return href
    if (href.startsWith('#')) {
      const id = href.slice(1)
      const heading = idMap.get(id)
      return `#${heading ? slugify(heading) : id}`
    }
    const [path, frag] = href.split('#')
    const rewritten = rewriteTarget(path)
    if (!frag) return rewritten
    // 別ページ内のアンカーは見出し文を知らないのでそのまま残す
    return `${rewritten}#${frag}`
  }
}

function convert(html, fallbackLang) {
  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)
  const body = (bodyMatch ? bodyMatch[1] : html).replace(/<style[\s\S]*?<\/style>/g, '')

  const idMap = buildIdMap(html)
  const inline = makeInline(makeHrefRewriter(idMap))

  const out = []
  const push = (block) => {
    if (block && block.trim()) out.push(block.replace(/\s+$/, ''))
  }

  let i = 0
  while (i < body.length) {
    const rest = body.slice(i)
    let m

    // コードブロック
    if ((m = /^<pre[^>]*>([\s\S]*?)<\/pre>/.exec(rest))) {
      const code = decodeEntities(stripTags(m[1])).replace(/^\n+|\s+$/g, '')
      const fence = fenceFor(code)
      push(`${fence}${guessLang(code, fallbackLang)}\n${code}\n${fence}`)
      i += m[0].length
      continue
    }

    // 表
    if ((m = /^<table[^>]*>([\s\S]*?)<\/table>/.exec(rest))) {
      push(renderTable(m[1], inline))
      i += m[0].length
      continue
    }

    // アスキー図（arch-diagram）
    if ((m = /^<div class="arch-diagram"[^>]*>([\s\S]*?)<\/div>/.exec(rest))) {
      const art = decodeEntities(m[1]).replace(/^\n+|\s+$/g, '')
      const fence = fenceFor(art)
      push(`${fence}text\n${art}\n${fence}`)
      i += m[0].length
      continue
    }

    // 補足ボックス（callout）
    if ((m = /^<div class="callout[^"]*"[^>]*>([\s\S]*?)\n\s*<\/div>/.exec(rest))) {
      push(renderCallout(m[1], inline))
      i += m[0].length
      continue
    }

    // 索引のカード一覧（index-grid）
    if ((m = /^<div class="index-grid"[^>]*>([\s\S]*?)\n\s*<\/div>/.exec(rest))) {
      push(renderCards(m[1], inline))
      i += m[0].length
      continue
    }

    // ヘッダーのサブタイトル
    if ((m = /^<div class="doc-path"[^>]*>([\s\S]*?)<\/div>/.exec(rest))) {
      const raw = collapse(decodeEntities(stripTags(m[1])))
      push(/^[A-Za-z0-9_./$*()\-]+$/.test(raw) ? `\`${raw}\`` : `*${inline(m[1])}*`)
      i += m[0].length
      continue
    }

    // 見出し
    if ((m = /^<(h1|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/\1>/.exec(rest))) {
      const level = { h1: '#', h2: '##', h3: '###', h4: '####' }[m[1]]
      push(`${level} ${inline(m[2])}`)
      i += m[0].length
      continue
    }

    // 箇条書き
    if ((m = /^<ul[^>]*>([\s\S]*?)<\/ul>/.exec(rest))) {
      push(renderList(m[1], inline))
      i += m[0].length
      continue
    }
    if ((m = /^<ol[^>]*>([\s\S]*?)<\/ol>/.exec(rest))) {
      push(renderList(m[1], inline, true))
      i += m[0].length
      continue
    }

    // フッター
    if ((m = /^<footer[^>]*>([\s\S]*?)<\/footer>/.exec(rest))) {
      const text = inline(m[1])
      push(`---\n\n*${text}*`)
      i += m[0].length
      continue
    }

    // 段落
    if ((m = /^<p\b[^>]*>([\s\S]*?)<\/p>/.exec(rest))) {
      push(inline(m[1]))
      i += m[0].length
      continue
    }

    // 残りのタグ（section / div ラッパー等）は読み飛ばす
    if ((m = /^<\/?[a-zA-Z][^>]*>/.exec(rest))) {
      i += m[0].length
      continue
    }
    if ((m = /^<!--[\s\S]*?-->/.exec(rest))) {
      i += m[0].length
      continue
    }
    i += 1
  }

  return `${out.join('\n\n')}\n`
}

function renderTable(tableHtml, inline) {
  const headCells = []
  const headRow = /<thead[^>]*>([\s\S]*?)<\/thead>/.exec(tableHtml)
  if (headRow) {
    const thRe = /<th[^>]*>([\s\S]*?)<\/th>/g
    let m
    while ((m = thRe.exec(headRow[1]))) headCells.push(inline(m[1], true))
  }

  const bodyHtml = /<tbody[^>]*>([\s\S]*?)<\/tbody>/.exec(tableHtml)
  const rowsSource = bodyHtml ? bodyHtml[1] : tableHtml
  const rows = []
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g
  let tr
  while ((tr = trRe.exec(rowsSource))) {
    const cells = []
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g
    let td
    while ((td = tdRe.exec(tr[1]))) cells.push(inline(td[1], true))
    if (cells.length) rows.push(cells)
  }

  const width = Math.max(headCells.length, ...rows.map((r) => r.length), 0)
  if (width === 0) return ''
  const pad = (cells) => {
    const copy = cells.slice()
    while (copy.length < width) copy.push('')
    return `| ${copy.join(' | ')} |`
  }
  const header = headCells.length ? pad(headCells) : pad(new Array(width).fill(''))
  const sep = `| ${new Array(width).fill('---').join(' | ')} |`
  return [header, sep, ...rows.map(pad)].join('\n')
}

function renderCallout(innerHtml, inline) {
  const lines = []
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g
  let m
  while ((m = pRe.exec(innerHtml))) {
    const isTitle = /class="[^"]*callout-title/.test(m[1])
    const text = inline(m[2])
    if (!text) continue
    lines.push(isTitle ? `**${text}**` : text)
  }
  return lines.map((line) => `> ${line}`).join('\n>\n')
}

function renderCards(innerHtml, inline) {
  const items = []
  const cardRe = /<a\b[^>]*class="index-card"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g
  const altRe = /<a\b[^>]*href="([^"]*)"[^>]*class="index-card"[^>]*>([\s\S]*?)<\/a>/g
  for (const re of [cardRe, altRe]) {
    let m
    while ((m = re.exec(innerHtml))) {
      const title = /<div class="index-card-title"[^>]*>([\s\S]*?)<\/div>/.exec(m[2])
      const desc = /<div class="index-card-path"[^>]*>([\s\S]*?)<\/div>/.exec(m[2])
      const label = title ? inline(title[1]) : inline(m[2])
      const href = inline(`<a href="${m[1]}">x</a>`).replace(/^\[x\]\(|\)$/g, '')
      items.push(desc ? `- [${label}](${href}) — ${inline(desc[1])}` : `- [${label}](${href})`)
    }
    if (items.length) break
  }
  return items.join('\n')
}

function renderList(innerHtml, inline, ordered = false) {
  const items = []
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g
  let m
  while ((m = liRe.exec(innerHtml))) {
    const text = inline(m[1])
    if (text) items.push(ordered ? `${items.length + 1}. ${text}` : `- ${text}`)
  }
  return items.join('\n')
}

// ------------------------------------------------------------------ 実行

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...walk(full))
    else if (entry.endsWith('.html')) found.push(full)
  }
  return found
}

function fallbackLangFor(html) {
  const path = /<div class="doc-path"[^>]*>([\s\S]*?)<\/div>/.exec(html)
  const text = path ? collapse(decodeEntities(stripTags(path[1]))) : ''
  const ext = /\.([a-z]+)\b/.exec(text.split(/[\s／]/)[0] ?? '')
  return (ext && EXT_LANG[ext[1]]) || 'ts'
}

const files = walk(DOCS_DIR).sort()
const written = []
for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const md = convert(html, fallbackLangFor(html))
  const base = file.endsWith(`${sep}index.html`) || file === join(DOCS_DIR, 'index.html')
  const target = base ? join(dirname(file), 'README.md') : file.replace(/\.html$/, '.md')
  writeFileSync(target, md, 'utf8')
  written.push(relative('.', target))
}

console.log(`${written.length} 件の Markdown を生成しました`)
for (const f of written) console.log(`  ${f}`)
