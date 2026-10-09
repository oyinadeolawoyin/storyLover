import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Compass, Download, Flag, Lightbulb, Star, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Seo from '@/components/seo'
import ShareButtons from '@/components/shareButtons'
import { InlineSubscribe } from '@/components/checkerCta'
import { CheckerFeedbackService } from '@/service/checkerFeedbackService'
import { clearDraft, hasRated, isSubscribed, loadDraft, markRated, markTried, saveDraft } from '@/lib/checkerState'
import { cn } from '@/lib/utils'

// ---------- The character: name + pronouns, used to word every sentence ----------
const PRONOUNS = {
  she: { label: 'she / her', obj: 'her', poss: 'her' },
  he: { label: 'he / him', obj: 'him', poss: 'his' },
  they: { label: 'they / them', obj: 'them', poss: 'their' },
}

// Sentences only use the name plus "obj" and "poss" pronouns, so no verb ever has to agree with "they".
function character(a) {
  const pr = PRONOUNS[a.pronouns] ?? PRONOUNS.they
  const w = a.name?.trim() || 'my protagonist'
  const named = Boolean(a.name?.trim())
  const wPoss = w + (/s$/i.test(w) ? "'" : "'s")
  return { w, obj: pr.obj, poss: pr.poss, wPoss, y: named ? w : 'your protagonist', yPoss: named ? wPoss : "your protagonist's" }
}
const SAMPLE = { w: 'Mara', obj: 'her', poss: 'her', wPoss: "Mara's" }

// ---------- The questions. Edit the wording here. ----------
// `starter` is the start of the sentence the writer finishes. `example` finishes it for Mara, a sample character.
const STEPS = [
  {
    key: 'misbelief',
    strip: /^(?:(?:she|he|they)\s+believes?\s+|(?:believes?|believing)\s+)/i,
    short: "their false belief",
    title: "What does your protagonist believe that isn't true?",
    hint: "This is the false rule they live by: a belief about themselves, other people or the world, not a feeling.",
    starter: (c) => `${c.w} believes`,
    example: "that she's only safe when she's in control",
  },
  {
    key: 'why',
    strip: /^because\s+/i,
    short: 'why they believe it',
    title: "What happened to make them believe this?",
    hint: 'Think about the moment, person or wound that taught them this.',
    starter: (c) => `${c.w} believes this because`,
    example: 'her father lost everything when he trusted a business partner',
  },
  {
    key: 'fear',
    strip: /^(afraid\s+of|fears?|fear\s+of)\s+/i,
    short: 'what they fear',
    title: "What is your protagonist most afraid of because of this belief?",
    hint: "Underneath a false belief there's usually something they're afraid will happen.",
    starter: (c) => `Deep down, ${c.w} is afraid of`,
    example: 'being betrayed and losing everything, like her father did',
  },
  {
    key: 'flaws',
    strip: /^(?:(?:she|he|they)(?:'s|\s+is|\s+are)\s+|(?:is|are|being)\s+)/i,
    short: 'their flaws',
    title: "What flaws does this belief cause?",
    hint: "Think about how this belief makes them treat other people in your story.",
    starter: (c) => `Because of this belief, ${c.w} is`,
    example: 'guarded and bossy, and pushes people away before they can let her down',
  },
  {
    key: 'trigger',
    short: 'what triggers their flaw',
    title: "When does this flaw show up most?",
    hint: "What situation or person makes them show this side of themselves?",
    starter: (c) => `${c.wPoss} flaw shows up when`,
    example: 'someone else takes charge of a project',
  },
  {
    key: 'need',
    strip: /^(?:(?:she|he|they)\s+needs?\s+to\s+learn\s+|(?:needs?\s+to\s+learn|to\s+learn|learn)\s+)/i,
    short: 'what they must learn',
    title: "What does your protagonist need to learn?",
    hint: "This is the truth that opposes their false belief, the one they must see to overcome their flaw.",
    starter: (c) => `To grow, ${c.w} needs to learn`,
    example: 'that trusting people is a risk worth taking',
  },
  {
    key: 'want',
    strip: /^(?:(?:she|he|they)\s+wants?\s+|(?:wants?|wanting)\s+)/i,
    short: 'what they want',
    title: "What does your protagonist want in this story and why?",
    hint: "A goal we could watch them chase, not a feeling.",
    starter: (c) => `${c.w} wants`,
    example: 'to win the contract and prove she can run the company alone',
  },
  {
    key: 'stakes',
    short: 'what happens if they fail',
    title: 'What happens if your protagonist fails to get what they want?',
    hint: "Think about what they would lose or suffer. The more specific the loss, the more pressure on your story.",
    starter: (c) => `If ${c.w} fails to get this,`,
    example: "she'll lose the company her father built, and with it any proof that she can stand on her own",
  },
  {
    key: 'obstacle',
    strip: /^(is|are)\s+/i,
    short: 'what stands in their way',
    title: 'What or who is stopping your protagonist from getting what they want?',
    hint: 'Your antagonist, or the situation standing in the way.',
    starter: (c) => `Standing in ${c.poss} way is`,
    example: 'a rival bidding for the same contract',
  },
  {
    key: 'obstacleTrigger',
    short: 'how it triggers their fear',
    title: "How does this obstacle bring their fear closer?",
    hint: 'How does the obstacle poke at the thing they are most afraid of?',
    starter: (c) => `This stirs ${c.poss} fear because`,
    example: "the rival's success makes her feel she'll lose everything again if she lets her guard down",
  },
  {
    key: 'realisation',
    strip: /^when\s+/i,
    short: 'how they see the truth',
    title: "What happens that forces your protagonist to see the truth?",
    hint: "A moment, loss or discovery that makes their false belief stop working.",
    starter: (c) => `${c.w} is forced to see the truth when`,
    example: 'her team steps in and saves the pitch she was about to lose, and she realises that holding on so tightly nearly cost her everything',
  },
  {
    key: 'theme',
    short: 'your theme',
    title: "What is your story's theme?",
    hint: "Write it as a full sentence about life, not one word like 'love' or 'trust'. It's often the truth that opposes the false belief. Not sure? Look back at what your protagonist needs to learn.",
    starter: () => 'The theme of my story is',
    example: 'trust is the price of real connection',
  },
  {
    key: 'journey',
    short: 'the theme in their journey',
    title: "How does your theme show up in your protagonist's journey?",
    hint: 'What do they gain or lose as the story moves forward?',
    starter: (c) => `${c.wPoss} journey shows the theme because`,
    example: 'every time she grips control tighter she loses something, and when she lets go she gains an ally',
  },
  {
    key: 'mirrors',
    short: 'the theme in the other characters',
    title: "How do the other characters show the theme in different ways?",
    hint: "Think of the antagonist and one or two side characters. Each can believe something different about the theme.",
    starter: () => 'The antagonist and side characters show the theme by',
    example: 'the rival trusts too freely and gets burned, while her best friend trusts wisely',
  },
  {
    key: 'ending',
    type: 'choice',
    short: 'whether they accept the truth',
    title: "By the end, does your protagonist accept the truth?",
    hint: 'Seeing the truth and accepting it are two different moments. This decides what kind of story you are telling.',
  },
]

const ENDINGS = [
  { value: 'accept', label: 'Yes, they accept it', note: 'A story of growth.', sentence: (c) => `In the end, ${c.w} accepts the truth.` },
  { value: 'reject', label: 'No, they refuse', note: 'A tragedy or a cautionary tale.', sentence: (c) => `In the end, ${c.w} refuses to change.` },
  {
    value: 'flat',
    label: 'They already hold the truth',
    note: 'They stay true to it and change the world around them.',
    sentence: (c) => `${c.w} already holds the truth, and changes the world around ${c.obj}.`,
  },
]

// The same questions, as short prompts. Used wherever a blank needs to invite the writer back to it.
const PROMPTS = {
  misbelief: (c) => `What does ${c.y} believe that isn't true?`,
  why: (c) => `What happened to make ${c.y} believe this?`,
  fear: (c) => `What is ${c.y} most afraid of?`,
  flaws: () => `What flaws does this belief cause?`,
  trigger: (c) => `When does ${c.yPoss} flaw show up most?`,
  need: (c) => `What does ${c.y} need to learn?`,
  want: (c) => `What does ${c.y} want in this story?`,
  stakes: (c) => `What happens if ${c.y} fails to reach that goal?`,
  obstacle: (c) => `Who or what stands in ${c.y === c.w ? c.poss : 'their'} way?`,
  obstacleTrigger: (c) => `How does this obstacle bring ${c.y === c.w ? c.poss : 'their'} fear closer?`,
  realisation: (c) => `What happens that forces ${c.y} to see the truth?`,
  theme: () => `What is your story's theme?`,
  journey: (c) => `How does ${c.yPoss} journey demonstrate the theme?`,
  mirrors: () => `How do the other characters show the theme in different ways?`,
  ending: (c) => `By the end, does ${c.y} accept the truth?`,
}
const promptFor = (step, a) => PROMPTS[step.key](character(a))

// The result screen groups the answers like a little story diagnostic.
const SECTIONS = [
  { id: 'character', title: 'Your protagonist', blurb: 'Who they are and the lie they live by.', icon: User, bg: 'bg-rose-soft', dot: 'bg-primary text-white', bar: 'bg-primary', keys: ['misbelief', 'why', 'fear', 'flaws', 'trigger'] },
  { id: 'conflict', title: 'Your story conflict', blurb: "What they want, what's at stake and what's in the way.", icon: Flag, bg: 'bg-sky-soft', dot: 'bg-sky text-white', bar: 'bg-sky', keys: ['want', 'stakes', 'obstacle', 'obstacleTrigger'] },
  { id: 'arc', title: "Your protagonist's arc", blurb: 'What they must learn, and what they do about it.', icon: Compass, bg: 'bg-sage-soft', dot: 'bg-emerald-500 text-white', bar: 'bg-emerald-500', keys: ['need', 'realisation', 'ending'] },
  { id: 'theme', title: 'Your theme', blurb: 'What your story is really saying.', icon: Lightbulb, bg: 'bg-butter-soft', dot: 'bg-butter text-foreground', bar: 'bg-butter', keys: ['theme', 'journey', 'mirrors'] },
]

const N = STEPS.length
const RESULT = N + 1 // step 0 is the intro, 1..N are questions, N+1 is the result
const stepIndex = (key) => STEPS.findIndex((s) => s.key === key)
const stepOf = (key) => stepIndex(key) + 1

// ---------- Turning answers into clean sentences ----------
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const SOFT_START = /^(The|A|An|He|She|They|Her|His|Their|My|It|We|You|Someone|When|If|Being|Losing|Having|That|This|There|Because|Wanting)\b/
const tidy = (s = '') => s.trim().replace(/[.!?\s]+$/, '').replace(SOFT_START, (w) => w.toLowerCase())

// A writer's answer with any repeated starter words removed, ready to slot after the starter.
const valueOf = (step, a) => {
  let v = (a[step.key] ?? '').trim()
  if (step.strip) v = v.replace(step.strip, '')
  return tidy(v)
}

const answerText = (step, a) =>
  step.type === 'choice' ? ENDINGS.find((e) => e.value === a[step.key])?.label : a[step.key]?.trim()

// One finished sentence for a question, or null if it's still blank.
function sentenceFor(step, a) {
  const c = character(a)
  if (step.type === 'choice') return ENDINGS.find((e) => e.value === a.ending)?.sentence(c) ?? null
  const value = valueOf(step, a)
  return value ? `${cap(step.starter(c))} ${value}.` : null
}

// The "in a nutshell" summary: want, obstacle, need. Each part is text, or a blank the writer can still fill.
function coreParts(a) {
  const c = character(a)
  const part = (key) => {
    const step = STEPS[stepIndex(key)]
    const value = valueOf(step, a)
    return value ? { text: value, key, filled: true } : { text: step.short, key, filled: false }
  }
  return [
    { text: `${cap(c.w)} wants ` },
    part('want'),
    { text: ', but ' },
    part('obstacle'),
    { text: ` stands in ${c.poss} way. To grow, ${c.w} needs to learn ` },
    part('need'),
    { text: '.' },
  ]
}
const coreText = (parts) => parts.map((p) => (p.filled === false ? '___' : p.text)).join('')

// The story summary. It is written from sentence templates so it reads like a short story outline,
// not like the answers stitched together. The writer's own wording is kept exactly as they typed it
// (only trimmed), and the detailed section below still shows each answer as entered.
// A question that is still blank never gets invented for the writer: it becomes a gentle
// "still to explore" note that is also a tappable pill back to that question.
const STORY_GROUPS = [
  { id: 'character', color: 'var(--primary)', keys: ['misbelief', 'why', 'fear', 'flaws', 'trigger'] },
  { id: 'conflict', color: 'var(--sky)', keys: ['want', 'stakes', 'obstacle', 'obstacleTrigger'] },
  { id: 'arc', color: '#10b981', keys: ['need', 'realisation', 'ending'] },
  { id: 'theme', color: 'var(--butter)', keys: ['theme', 'journey', 'mirrors'] },
]
const PARAGRAPH_KEYS = STORY_GROUPS.flatMap((g) => g.keys)

function storyParagraphs(a) {
  const c = character(a)
  const W = cap(c.w)
  const v = (key) => valueOf(STEPS[stepIndex(key)], a)

  // An answered beat: some words, the writer's own words (highlighted), and a full stop.
  const say = (key, before, after = '.') => {
    const value = v(key)
    return value ? { blank: false, parts: [{ text: before }, { text: value, key, filled: true }, { text: after }] } : null
  }
  // A beat that is still open: a note that doubles as a tappable pill.
  const gap = (key, text) => ({ blank: true, parts: [{ text: cap(text), key, filled: false }, { text: '.' }] })
  const pick = (key, before, gapText, after) => say(key, before, after) ?? gap(key, gapText)
  const optional = (key, before) => say(key, before)

  const ending = ENDINGS.find((e) => e.value === a.ending)
  const hasObstacle = Boolean(v('obstacle'))

  const beats = {
    character: [
      pick('misbelief', `${W} believes `, `what ${c.w} wrongly believes is still unclear`),
      pick('why', 'That belief took hold because ', 'where that belief comes from is still unclear'),
      pick('fear', `Deep down, ${c.w} is afraid of `, `what ${c.w} fears underneath it is still to explore`),
      pick('flaws', `Because of this, ${c.w} is `, `how the belief shapes ${c.poss} behaviour is still to explore`),
      pick('trigger', `${cap(c.poss)} flaw shows up most when `, `what sets ${c.poss} flaw off is still to explore`),
    ],
    conflict: [
      pick('want', `In the story, ${c.w} wants `, `what ${c.w} wants is still to be decided`),
      pick(
        'stakes',
        v('want') ? `If ${c.w} fails to get this, ` : `If ${c.w} fails, `,
        `what happens if ${c.w} fails is still to be decided`
      ),
      pick(
        'obstacle',
        v('want') && !v('stakes') ? `But standing in ${c.poss} way is ` : `Standing in ${c.poss} way is `,
        `who or what stands in ${c.poss} way is still to be decided`
      ),
      pick(
        'obstacleTrigger',
        `${hasObstacle ? 'This' : 'The obstacle'} stirs ${c.poss} fear because `,
        `how this stirs ${c.poss} fear is still to explore`
      ),
    ],
    arc: [
      pick('need', `To grow, ${c.w} needs to learn `, `what ${c.w} needs to learn is still to be found`),
      pick(
        'realisation',
        `${W} is forced to face the truth when `,
        `what helps ${c.w} see the truth is still something to explore`
      ),
      ending
        ? { blank: false, parts: [{ text: ending.sentence(c), key: 'ending', filled: true }] }
        : gap('ending', `whether ${c.w} accepts the truth is still undecided`),
    ],
    theme: [
      pick('theme', "The story's theme: ", 'the theme is still to be found'),
      optional('journey', `${cap(c.wPoss)} journey shows it because `),
      optional('mirrors', 'The antagonist and side characters show it by '),
    ],
  }

  return STORY_GROUPS.map((group) => {
    const list = beats[group.id].filter(Boolean)
    const parts = list.flatMap((b, i) => (i ? [{ text: ' ' }, ...b.parts] : b.parts))
    // The PDF lists open questions in their own section, so its paragraphs only carry what is answered.
    const pdfText = list
      .filter((b) => !b.blank)
      .flatMap((b) => b.parts)
      .map((p) => p.text)
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
    return { ...group, parts, pdfText }
  })
}

// A soft highlighter stroke in the colour of that part of the story
const markStyle = (color) => ({
  backgroundImage: `linear-gradient(to bottom, transparent 62%, color-mix(in srgb, ${color} 38%, transparent) 62%, color-mix(in srgb, ${color} 38%, transparent) 90%, transparent 90%)`,
  paddingInline: '0.15em',
  WebkitBoxDecorationBreak: 'clone',
  boxDecorationBreak: 'clone',
})

// ---------- The PDF (drawn with jsPDF, loaded only when someone downloads) ----------
// A colourful, easy-to-read report: a bold header, the story on a taped page, an "at a glance" row,
// one coloured block per part of the story, what's left to figure out, and the full answers.
async function downloadPdf(answers) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  const CW = W - M * 2
  const BOTTOM = H - 60

  const C = {
    ink: [31, 42, 68],
    muted: [91, 100, 121],
    paper: [253, 250, 244],
    border: [236, 228, 211],
    rose: [244, 105, 138],
    roseSoft: [253, 232, 238],
    sky: [47, 140, 240],
    skySoft: [232, 242, 252],
    green: [16, 185, 129],
    greenSoft: [226, 244, 236],
    butter: [246, 196, 69],
    butterSoft: [253, 243, 211],
    white: [255, 255, 255],
  }
  // One colour family per part of the story
  const TONE = { character: C.rose, conflict: C.sky, arc: C.green, theme: C.butter }
  const SOFT = { character: C.roseSoft, conflict: C.skySoft, arc: C.greenSoft, theme: C.butterSoft }
  const onTone = (id) => (id === 'theme' ? C.ink : C.white) // text that sits on the strong colour

  const fill = (c) => doc.setFillColor(c[0], c[1], c[2])
  const line = (c) => doc.setDrawColor(c[0], c[1], c[2])
  const ink = (c) => doc.setTextColor(c[0], c[1], c[2])
  const font = (name, style, size, color) => {
    doc.setFont(name, style)
    doc.setFontSize(size)
    ink(color)
  }
  const states = {}
  const opacity = (o) => doc.setGState((states[o] ??= new doc.GState({ opacity: o })))
  const wrap = (str, width) => doc.splitTextToSize(str, width)
  // a rounded box whose top corners are round and bottom corners are square
  const roundTop = (x, y, w, h, r) => {
    doc.roundedRect(x, y, w, h, r, r, 'F')
    doc.rect(x, y + h / 2, w, h / 2, 'F')
  }
  const diamond = (cx, cy, d, color) => {
    fill(color)
    doc.lines([[d, d], [-d, d], [-d, -d], [d, -d]], cx, cy - d, [1, 1], 'F', true)
  }
  const rainbow = (y0, h) => {
    ;[C.rose, C.sky, C.green, C.butter].forEach((c, i) => {
      fill(c)
      doc.rect((W / 4) * i, y0, W / 4 + 0.5, h, 'F')
    })
  }

  let y = M
  const paint = () => {
    fill(C.paper)
    doc.rect(0, 0, W, H, 'F')
  }
  const newPage = () => {
    doc.addPage()
    paint()
    rainbow(0, 6)
    y = M
  }
  // Starts a new page if `h` doesn't fit.
  const ensure = (h) => {
    if (y + h > BOTTOM) newPage()
  }
  paint()

  // ----- Header banner -----
  const BANNER = 150
  const name = answers.name?.trim()
  fill(C.rose)
  doc.rect(0, 0, W, BANNER, 'F')
  opacity(0.2)
  fill(C.white)
  doc.circle(W - 70, 62, 52, 'F')
  doc.circle(W - 172, 104, 26, 'F')
  fill(C.butter)
  doc.circle(36, 104, 34, 'F')
  opacity(1)
  rainbow(BANNER, 6)

  font('helvetica', 'bold', 9, C.butterSoft)
  doc.text('STORY CLARITY CHECKER', M, 52, { charSpace: 2 })
  font('times', 'bold', 38, C.white)
  doc.text('My Story So Far', M, 98)
  if (name) {
    font('helvetica', 'bold', 10, C.butterSoft)
    doc.text(`STARRING ${name.toUpperCase()}`, M, 120, { charSpace: 1.8 })
  }
  ;[C.white, C.butter, [190, 220, 250], [190, 235, 215]].forEach((c, i) => {
    fill(c)
    doc.circle(M + 4 + i * 16, 134, 4.5, 'F')
  })
  y = BANNER + 36

  // ----- The story, as plain readable paragraphs with a little colour -----
  const FS = 12.5
  const LEAD = 19
  const LABELS = { character: 'THE PROTAGONIST', conflict: 'THE CONFLICT', arc: 'THE ARC', theme: 'THE THEME' }

  const paragraphs = storyParagraphs(answers)
    .map((para) => ({
      id: para.id,
      text: para.pdfText, // open questions are listed further down instead
    }))
    .filter((para) => para.text)

  ensure(70)
  font('times', 'bold', 21, C.ink)
  doc.text('Your story, all together', M, y + 16)
  ;[C.rose, C.sky, C.green, C.butter].forEach((c, i) => {
    fill(c)
    doc.roundedRect(M + i * 24, y + 25, 22, 3.5, 1.7, 1.7, 'F')
  })
  y += 52

  if (paragraphs.length === 0) {
    font('helvetica', 'italic', 11, C.muted)
    doc.text('Your story will appear here as you answer the questions.', M, y + 10)
    y += 30
  }
  paragraphs.forEach((para) => {
    font('times', 'normal', FS, C.ink)
    const lines = wrap(para.text, CW)
    ensure(18 + lines.length * LEAD + 10)

    // a small coloured label above each paragraph
    diamond(M + 4, y + 6, 3.6, TONE[para.id])
    font('helvetica', 'bold', 8.5, para.id === 'theme' ? [160, 120, 10] : TONE[para.id])
    doc.text(LABELS[para.id], M + 14, y + 9, { charSpace: 1.6 })
    y += 22

    font('times', 'normal', FS, C.ink)
    lines.forEach((l, i) => doc.text(l, M, y + 10 + i * LEAD))
    y += lines.length * LEAD + 16
  })
  y += 10

  // ----- At a glance: four coloured tiles -----
  const TILES = [
    { label: 'WANTS', key: 'want', tone: C.rose, soft: C.roseSoft },
    { label: 'STANDING IN THE WAY', key: 'obstacle', tone: C.sky, soft: C.skySoft },
    { label: 'NEEDS TO LEARN', key: 'need', tone: C.green, soft: C.greenSoft },
    { label: 'THEME', key: 'theme', tone: C.butter, soft: C.butterSoft },
  ]
  const TW = (CW - 14) / 2
  const tileData = TILES.map((t) => {
    const step = STEPS[stepIndex(t.key)]
    const value = valueOf(step, answers)
    font('helvetica', value ? 'normal' : 'italic', 10.5, C.ink)
    let lines = wrap(value ? cap(value) : 'Still to figure out', TW - 34)
    if (lines.length > 4) lines = [...lines.slice(0, 3), `${lines[3].replace(/\s+\S*$/, '')}...`]
    return { ...t, value, lines }
  })
  const rowH = (i) => Math.max(tileData[i].lines.length, tileData[i + 1].lines.length) * 13 + 38
  ensure(28 + rowH(0) + rowH(2) + 10)
  diamond(M + 5, y + 8, 5, C.rose)
  font('times', 'bold', 17, C.ink)
  doc.text('At a glance', M + 18, y + 14)
  y += 28
  ;[0, 2].forEach((i) => {
    const h = rowH(i)
    ;[i, i + 1].forEach((k, col) => {
      const t = tileData[k]
      const tx = M + col * (TW + 14)
      fill(t.soft)
      doc.roundedRect(tx, y, TW, h, 10, 10, 'F')
      fill(t.tone)
      doc.roundedRect(tx, y, 6, h, 3, 3, 'F')
      font('helvetica', 'bold', 8.5, t.tone === C.butter ? [160, 120, 10] : t.tone)
      doc.text(t.label, tx + 20, y + 20, { charSpace: 1.2 })
      font('helvetica', t.value ? 'normal' : 'italic', 10.5, t.value ? C.ink : C.muted)
      t.lines.forEach((l, li) => doc.text(l, tx + 20, y + 36 + li * 13))
    })
    y += h + 10
  })
  y += 18

  // ----- One coloured block per part of the story -----
  const IN = 20
  const HEADER = 44
  const ROW_W = CW - IN * 2 - 16

  SECTIONS.forEach((section, idx) => {
    const tone = TONE[section.id]
    const soft = SOFT[section.id]
    const total = section.keys.length
    const rows = section.keys.map((key) => {
      const step = STEPS[stepIndex(key)]
      const text = sentenceFor(step, answers)
      font('helvetica', text ? 'normal' : 'italic', 10.5, C.ink)
      return { text, step, lines: wrap(text ?? `Still to figure out: ${promptFor(step, answers)}`, ROW_W) }
    })
    const done = rows.filter((r) => r.text).length
    const rowsH = rows.reduce((n, r) => n + r.lines.length * 14 + 9, 0)
    const h = HEADER + 46 + rowsH + 8

    ensure(h + 20)
    const t = y
    fill(soft)
    doc.roundedRect(M, t, CW, h, 12, 12, 'F')
    fill(tone)
    roundTop(M, t, CW, HEADER, 12)

    // numbered badge, title, and a count chip in the coloured header
    fill(C.white)
    doc.circle(M + 28, t + HEADER / 2, 13, 'F')
    font('helvetica', 'bold', 13, tone === C.butter ? [160, 120, 10] : tone)
    doc.text(String(idx + 1), M + 28, t + HEADER / 2 + 4.6, { align: 'center' })
    font('times', 'bold', 17, onTone(section.id))
    doc.text(section.title, M + 52, t + HEADER / 2 + 5.5)

    const chip = `${done} of ${total} answered`
    font('helvetica', 'bold', 9, C.ink)
    const chipW = doc.getTextWidth(chip) + 18
    fill(C.white)
    doc.roundedRect(M + CW - IN - chipW, t + HEADER / 2 - 9, chipW, 18, 9, 9, 'F')
    font('helvetica', 'bold', 9, done === total ? [10, 140, 95] : C.ink)
    doc.text(chip, M + CW - IN - chipW / 2, t + HEADER / 2 + 3.2, { align: 'center' })

    font('helvetica', 'italic', 9.5, C.muted)
    doc.text(section.blurb, M + IN, t + HEADER + 18)
    fill(C.white)
    doc.roundedRect(M + IN, t + HEADER + 27, CW - IN * 2, 6, 3, 3, 'F')
    if (done) {
      fill(tone)
      doc.roundedRect(M + IN, t + HEADER + 27, ((CW - IN * 2) * done) / total, 6, 3, 3, 'F')
    }

    let ry = t + HEADER + 50
    rows.forEach((r) => {
      const tx = M + IN + 16
      if (r.text) {
        fill(tone)
        doc.circle(M + IN + 4, ry + 5.5, 3, 'F')
        font('helvetica', 'normal', 10.5, C.ink)
      } else {
        font('helvetica', 'italic', 10.5, C.muted)
        const pillW = Math.max(...r.lines.map((l) => doc.getTextWidth(l))) + 12
        fill(C.white)
        line(tone === C.butter ? [215, 160, 20] : tone)
        doc.setLineWidth(0.8)
        doc.setLineDashPattern([2, 2], 0)
        doc.roundedRect(tx - 6, ry - 4, pillW, r.lines.length * 14 + 1, 5, 5, 'FD')
        doc.setLineDashPattern([], 0)
        ink(C.muted)
      }
      r.lines.forEach((l, li) => doc.text(l, tx, ry + 9 + li * 14))
      ry += r.lines.length * 14 + 9
    })
    y = t + h + 20
  })

  // ----- What still needs figuring out -----
  const missing = STEPS.filter((s) => !sentenceFor(s, answers))
  const innerW = CW - IN * 2
  font('helvetica', 'normal', 10.5, C.ink)
  const note = missing.length
    ? "A blank doesn't mean your story is broken. It means you've found the exact spot to work on next."
    : 'Nothing is blank. Read your story so far out loud and check that it sounds like the story you want to tell.'
  const noteLines = wrap(note, innerW)

  font('helvetica', 'bold', 9.5, C.ink)
  const pills = []
  let px = 0
  let pRow = 0
  missing.forEach((s, i) => {
    const prompt = promptFor(s, answers)
    const label = i === 0 ? `Start here: ${prompt}` : prompt
    const w = doc.getTextWidth(label) + 24
    if (px + w > innerW && px > 0) {
      px = 0
      pRow += 1
    }
    pills.push({ label, w, x: px, row: pRow, primary: i === 0 })
    px += w + 8
  })
  const pillRows = missing.length ? pRow + 1 : 0
  const needH = HEADER + 14 + noteLines.length * 14 + (pillRows ? 10 + pillRows * 30 : 0) + 12

  ensure(needH + 20)
  const nt = y
  fill(C.roseSoft)
  doc.roundedRect(M, nt, CW, needH, 12, 12, 'F')
  fill(C.ink)
  roundTop(M, nt, CW, HEADER, 12)
  diamond(M + 26, nt + HEADER / 2, 6, C.butter)
  font('times', 'bold', 17, C.white)
  doc.text('What still needs figuring out', M + 44, nt + HEADER / 2 + 5.5)
  font('helvetica', 'normal', 10.5, C.ink)
  noteLines.forEach((l, i) => doc.text(l, M + IN, nt + HEADER + 22 + i * 14))
  const pillTop = nt + HEADER + 22 + noteLines.length * 14 + 2
  pills.forEach((pl) => {
    const bx = M + IN + pl.x
    const by = pillTop + pl.row * 30
    if (pl.primary) {
      fill(C.rose)
      doc.roundedRect(bx, by, pl.w, 21, 10.5, 10.5, 'F')
    } else {
      fill(C.white)
      line(C.rose)
      doc.setLineWidth(0.9)
      doc.roundedRect(bx, by, pl.w, 21, 10.5, 10.5, 'FD')
    }
    font('helvetica', 'bold', 9.5, pl.primary ? C.white : C.ink)
    doc.text(pl.label, bx + 12, by + 14)
  })
  y = nt + needH + 34

  // ----- All the answers, colour-coded by part of the story -----
  ensure(80)
  diamond(M + 5, y + 8, 5, C.sky)
  font('times', 'bold', 19, C.ink)
  doc.text('Your answers', M + 18, y + 14)
  rainbow(y + 24, 3)
  y += 46
  STEPS.forEach((step, i) => {
    const sec = SECTIONS.find((s) => s.keys.includes(step.key))
    const tone = TONE[sec.id]
    const answer = answerText(step, answers)
    font('helvetica', 'bold', 10, C.ink)
    const qLines = wrap(step.title, CW - 34)
    font('helvetica', answer ? 'normal' : 'italic', 10.5, C.ink)
    const aLines = wrap(answer || 'Not sure yet. A spot to explore next.', CW - 34)
    const h = qLines.length * 13 + aLines.length * 14 + 14
    ensure(h + 8)

    fill(tone)
    doc.circle(M + 10, y + 9, 9, 'F')
    font('helvetica', 'bold', 9, onTone(sec.id))
    doc.text(String(i + 1), M + 10, y + 12.2, { align: 'center' })
    font('helvetica', 'bold', 10, C.ink)
    qLines.forEach((l, li) => doc.text(l, M + 30, y + 12 + li * 13))
    if (answer) {
      fill(SOFT[sec.id])
      doc.roundedRect(M + 30, y + qLines.length * 13 + 4, CW - 30, aLines.length * 14 + 8, 6, 6, 'F')
    }
    font('helvetica', answer ? 'normal' : 'italic', 10.5, answer ? C.ink : C.muted)
    aLines.forEach((l, li) => doc.text(l, M + 38, y + qLines.length * 13 + 17 + li * 14))
    y += h + 10
  })

  // ----- Footer and page numbers on every page -----
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    ;[C.rose, C.sky, C.green, C.butter].forEach((c, k) => {
      fill(c)
      doc.circle(M + 3 + k * 9, H - 33, 2.6, 'F')
    })
    font('helvetica', 'normal', 8.5, C.muted)
    doc.text('Made with the Story Clarity Checker  |  Share yours with #StoryLoversCommunity', M + 44, H - 30)
    doc.text(`${i} / ${pages}`, W - M, H - 30, { align: 'right' })
  }
  doc.save('my-story-so-far.pdf')
}

// Fades and slides its content in the first time it scrolls into view.
// children can be a function that receives `shown`, to animate things inside it too.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setShown(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [delay])

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
    >
      {typeof children === 'function' ? children(shown) : children}
    </div>
  )
}

const fieldClass =
  'w-full rounded-xl border border-input bg-card px-4 py-3 text-base leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'
const boxClass =
  'rounded-xl border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40'

export default function StoryChecker() {
  const saved = useMemo(() => loadDraft(), [])
  const [answers, setAnswers] = useState(saved?.answers ?? {})
  const [step, setStep] = useState(Math.min(saved?.step ?? 0, RESULT))
  const [dir, setDir] = useState(1)
  const [subscribed, setSubscribed] = useState(isSubscribed)
  const [fromResult, setFromResult] = useState(false) // true while the writer is editing one answer from the results

  const c = character(answers)
  const parts = useMemo(() => coreParts(answers), [answers]) // the short version, used for sharing
  const paragraphs = useMemo(() => storyParagraphs(answers), [answers])
  const coreComplete = parts.every((p) => p.filled !== false)

  useEffect(() => {
    saveDraft({ answers, step })
  }, [answers, step])

  useEffect(() => {
    if (step === RESULT) markTried()
  }, [step])

  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }))
  const go = (to) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
    if (to === RESULT) setFromResult(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const edit = (to) => {
    setFromResult(true)
    go(to)
  }
  const restart = () => {
    clearDraft()
    setAnswers({})
    setFromResult(false)
    go(0)
  }

  // What the shared ShareButtons component sends out
  const pageUrl = `${window.location.origin}/story-clarity-checker`
  const intro = coreComplete ? coreText(parts) : 'I just ran my story through the Story Clarity Checker.'
  const shareText = `${intro}\n\nTry it: ${pageUrl} #StoryLoversCommunity`
  // X only allows 280 characters, so a long summary gets a shorter message there
  const xText = coreComplete && intro.length <= 200 ? `${intro} #StoryLoversCommunity` : 'I just ran my story through the Story Clarity Checker. #StoryLoversCommunity'

  function download() {
    downloadPdf(answers)
  }

  const current = STEPS[step - 1]
  const filledCount = STEPS.filter((s) => answerText(s, answers)).length
  const missing = STEPS.filter((s) => !sentenceFor(s, answers))

  return (
    <div>
      <Seo
        title="Story Clarity Checker"
        description="Answer fifteen short questions and see your story so far: your protagonist, conflict, arc and theme, and what still needs figuring out."
      />
      <style>{`
        @keyframes sc-in-next { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
        @keyframes sc-in-prev { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
        .sc-next { animation: sc-in-next 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .sc-prev { animation: sc-in-prev 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes sc-draw { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes sc-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: none; opacity: 1; } }
        .sc-rail { transform-origin: top; animation: sc-draw 1400ms ease-out both; }
        .sc-pop { animation: sc-pop 600ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sc-next, .sc-prev, .sc-rail, .sc-pop { animation: none; } }
      `}</style>

      <section className="bg-gradient-to-b from-butter-soft/60 to-background">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
          {/* overflow-hidden stops the sliding card from making the page scroll sideways */}
          <div className="overflow-hidden px-1 py-2">
            <div key={step} className={dir === 1 ? 'sc-next' : 'sc-prev'}>
              {/* ---------- Intro ---------- */}
              {step === 0 && (
                <div className="mx-auto max-w-2xl">
                  <p className="hand text-2xl text-sky">A 10-minute quick win</p>
                  <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">
                    <span className="marker-yellow">Story Clarity Checker</span>
                  </h1>
                  <p className="mt-5 text-lg leading-relaxed text-foreground/80">
                    Fifteen short questions, about 10 minutes. You don't need to answer everything in one sitting. Skip what you're not sure about and see what you've already figured out and what still needs attention.
                  </p>
                  <div className="card-soft mt-8 p-6">
                    <label htmlFor="sc-name" className="font-heading text-lg font-semibold">
                      Who is your protagonist?
                    </label>
                    <p className="mt-1 text-sm text-muted-foreground">A name is fine. You can leave it blank.</p>
                    <Input
                      id="sc-name"
                      value={answers.name ?? ''}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Mara"
                      className="mt-3 h-11 rounded-full bg-card px-5"
                    />

                    <p className="mt-5 font-heading text-lg font-semibold">Which pronouns fit them?</p>
                    <p className="mt-1 text-sm text-muted-foreground">This helps the checker word your results. If you skip it, it uses they / them.</p>
                    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Protagonist pronouns">
                      {Object.entries(PRONOUNS).map(([value, p]) => {
                        const on = answers.pronouns === value
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => set('pronouns', value)}
                            className={cn(
                              'rounded-full border px-4 py-2 text-sm font-semibold transition-all motion-reduce:transition-none',
                              on ? 'border-primary bg-rose-soft shadow-soft' : 'border-border bg-card hover:-translate-y-0.5 hover:border-foreground/40'
                            )}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>

                    <Button size="lg" className="mt-6 rounded-full px-6" onClick={() => go(1)}>
                      {filledCount > 0 ? 'Continue where I left off' : 'Start'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Your answers stay in this browser. Nothing is sent to me unless you choose to share it at the end.
                  </p>
                </div>
              )}

              {/* ---------- One question ---------- */}
              {current && (
                <div className="card-soft mx-auto max-w-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Question {step} of {N}
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={N}
                    aria-valuenow={step}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
                      style={{ width: `${(step / N) * 100}%` }}
                    />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold leading-snug md:text-3xl">{current.title}</h2>
                  <p className="mt-2 text-foreground/75">{current.hint}</p>

                  {current.type === 'choice' ? (
                    <div className="mt-5 grid gap-3" role="radiogroup" aria-label={current.title}>
                      {ENDINGS.map((o) => {
                        const on = answers.ending === o.value
                        return (
                          <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => set('ending', o.value)}
                            className={cn(
                              'flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all motion-reduce:transition-none',
                              on ? 'border-primary bg-rose-soft shadow-soft' : 'border-border bg-card hover:-translate-y-0.5 hover:border-foreground/40'
                            )}
                          >
                            <span>
                              <span className="block font-semibold">{o.label}</span>
                              <span className="block text-sm text-foreground/70">{o.note}</span>
                            </span>
                            {on && <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <>
                      {/* The sentence starter sits inside the box so the writer just finishes it */}
                      <div className={cn(boxClass, 'mt-5')}>
                        <p className="px-4 pt-3 font-heading text-lg font-semibold text-primary">
                          {cap(current.starter(c))}…
                        </p>
                        <textarea
                          autoFocus
                          rows={3}
                          value={answers[current.key] ?? ''}
                          onChange={(e) => set(current.key, e.target.value)}
                          placeholder="finish the sentence in your own words"
                          aria-label={`${cap(current.starter(c))}…`}
                          className="w-full resize-none bg-transparent px-4 pb-3 pt-1 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70"
                        />
                      </div>
                      <p className="hand mt-3 text-xl leading-snug text-sky">
                        Example from a sample story: {cap(current.starter(SAMPLE))} {current.example}.
                      </p>
                    </>
                  )}

                  <div className="mt-7 flex items-center justify-between gap-3">
                    {fromResult ? (
                      <span />
                    ) : (
                      <Button variant="outline" className="rounded-full" onClick={() => go(step - 1)}>
                        <ArrowLeft className="size-4" />
                        Back
                      </Button>
                    )}
                    <Button
                      size="lg"
                      variant={answerText(current, answers) ? 'default' : 'outline'}
                      className="rounded-full px-6"
                      onClick={() => go(fromResult ? RESULT : step + 1)}
                    >
                      {fromResult
                        ? answerText(current, answers) ? 'Update my story so far' : 'Back to my story so far'
                        : step === N
                          ? answerText(current, answers) ? 'See my story so far' : 'See my story so far anyway'
                          : answerText(current, answers) ? 'Next' : 'Skip for now'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------- Result: your story so far ---------- */}
              {step === RESULT && (
                <div>
                  <p className="hand text-2xl text-sky">Here's what you've got</p>
                  <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">Your story so far</h1>
                  <p className="mt-2 max-w-2xl leading-relaxed text-foreground/80">
                    Here's what you already know, what your story is doing, and the loose threads worth pulling next.
                  </p>

                  {/* The whole story on one "page": taped on, four short paragraphs, highlighted answers */}
                  <Reveal className="mt-8">
                    {(shown) => (
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -top-3 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-3 border border-amber-300/50 bg-amber-200/80 shadow-sm"
                        />
                        <article className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-butter-soft via-white to-butter-soft/60 px-6 pb-8 pt-10 shadow-soft md:px-12 md:pb-10 md:pt-12">
                          <span
                            aria-hidden="true"
                            className="hand pointer-events-none absolute -left-1 -top-8 select-none text-[10rem] leading-none text-primary/15"
                          >
                            “
                          </span>
                          <p className="hand relative text-3xl text-sky">Your story, all together</p>
                          {answers.name?.trim() && (
                            <p className="relative text-sm font-semibold uppercase tracking-widest text-foreground/50">
                              Starring {answers.name.trim()}
                            </p>
                          )}

                          <div className="relative mt-6 space-y-6">
                            {paragraphs.map((para, pi) => (
                              <p
                                key={para.id}
                                className={cn(
                                  'border-l-4 pl-4 font-heading text-lg leading-loose transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none md:pl-5 md:text-xl',
                                  pi === 0 &&
                                    'first-letter:float-left first-letter:pr-2 first-letter:font-heading first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-primary',
                                  shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                )}
                                style={{ borderColor: para.color, transitionDelay: shown ? `${250 + pi * 250}ms` : '0ms' }}
                              >
                                {para.parts.map((p, i) =>
                                  p.filled === false ? (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => edit(stepOf(p.key))}
                                      title="Tap to fill this in"
                                      className="mx-0.5 rounded-md border border-dashed border-primary bg-rose-soft px-2 py-0.5 text-base italic text-foreground/70 hover:bg-primary/20"
                                    >
                                      {p.text}
                                    </button>
                                  ) : (
                                    <span key={i} style={p.key ? markStyle(para.color) : undefined}>
                                      {p.text}
                                    </span>
                                  )
                                )}
                              </p>
                            ))}
                          </div>

                          <p aria-hidden="true" className="relative mt-8 text-center text-lg tracking-[0.6em] text-primary/50">
                            ✦ ✦ ✦
                          </p>
                        </article>
                      </div>
                    )}
                  </Reveal>

                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <ShareButtons
                      slug="story-clarity-checker"
                      title={xText}
                      url={pageUrl}
                      messageText={intro}
                      copyText={shareText}
                      copyLabel="Copy to share"
                    />
                    {subscribed && (
                      <Button className="h-11 rounded-full px-5" onClick={download}>
                        <Download className="size-4" />
                        Download PDF
                      </Button>
                    )}
                  </div>

                  {/* One card per part of the story, stacked along a timeline */}
                  <div className="relative mt-10">
                    <span
                      aria-hidden="true"
                      className="sc-rail absolute bottom-6 left-[23px] top-6 w-0.5 rounded-full bg-gradient-to-b from-primary via-sky to-butter"
                    />
                    <ol className="space-y-8">
                      {SECTIONS.map((section, idx) => {
                        const total = section.keys.length
                        const done = section.keys.filter((k) => sentenceFor(STEPS[stepIndex(k)], answers)).length
                        const Icon = section.icon
                        return (
                          <li key={section.id}>
                            <Reveal delay={idx * 120}>
                              {(shown) => (
                                <div className="relative pl-[4.5rem]">
                                  <span
                                    className={cn(
                                      'absolute left-0 top-1 flex size-12 items-center justify-center rounded-full shadow-md ring-4 ring-background',
                                      section.dot,
                                      shown ? 'sc-pop' : 'opacity-0'
                                    )}
                                  >
                                    <Icon className="size-5" aria-hidden="true" />
                                  </span>

                                  <section className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none md:p-6">
                                    <span
                                      aria-hidden="true"
                                      className={cn(
                                        'absolute -right-12 -top-12 size-40 rounded-full opacity-70 transition-transform duration-500 group-hover:scale-125 motion-reduce:transition-none',
                                        section.bg
                                      )}
                                    />
                                    <div className="relative">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <h2 className="text-xl font-bold md:text-2xl">{section.title}</h2>
                                          <p className="mt-1 text-sm text-foreground/70">{section.blurb}</p>
                                        </div>
                                        <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-foreground/70">
                                          {done === total && <Check className="size-3.5 text-emerald-600" aria-hidden="true" />}
                                          {done} of {total} answered
                                        </span>
                                      </div>

                                      <div
                                        className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
                                        role="progressbar"
                                        aria-label={`${section.title}: ${done} of ${total} answered`}
                                        aria-valuemin={0}
                                        aria-valuemax={total}
                                        aria-valuenow={done}
                                      >
                                        <div
                                          className={cn('h-full rounded-full transition-all duration-1000 ease-out motion-reduce:transition-none', section.bar)}
                                          style={{ width: shown ? `${(done / total) * 100}%` : '0%' }}
                                        />
                                      </div>

                                      <ul className="mt-5 space-y-3">
                                        {section.keys.map((key, k) => {
                                          const step = STEPS[stepIndex(key)]
                                          const text = sentenceFor(step, answers)
                                          return (
                                            <li
                                              key={key}
                                              className={cn(
                                                'flex items-start gap-3 transition-all duration-500 motion-reduce:translate-x-0 motion-reduce:opacity-100 motion-reduce:transition-none',
                                                shown ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                                              )}
                                              style={{ transitionDelay: shown ? `${300 + k * 90}ms` : '0ms' }}
                                            >
                                              <span aria-hidden="true" className={cn('mt-2.5 size-2 shrink-0 rounded-full', section.bar)} />
                                              {text ? (
                                                <p className="leading-relaxed text-foreground/90">{text}</p>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => edit(stepOf(key))}
                                                  className="rounded-md border border-dashed border-primary bg-white/70 px-2 py-1 text-left text-sm italic text-foreground/70 transition-colors hover:bg-rose-soft"
                                                >
                                                  {promptFor(step, answers)}
                                                </button>
                                              )}
                                            </li>
                                          )
                                        })}
                                      </ul>
                                    </div>
                                  </section>
                                </div>
                              )}
                            </Reveal>
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  {/* What to work on next */}
                  <Reveal className="mt-8">
                  <section className="card-soft p-5 md:p-6">
                    <h2 className="text-xl font-bold">What still needs figuring out</h2>
                    {missing.length > 0 ? (
                      <>
                        <p className="mt-1 leading-relaxed text-foreground/80">
                          A blank doesn't mean your story is broken. It means you've found the exact spot to work on next.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {missing.map((s, i) => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => edit(stepOf(s.key))}
                              className={cn(
                                'rounded-full border px-4 py-2 text-sm font-semibold transition-all motion-reduce:transition-none',
                                i === 0
                                  ? 'border-primary bg-primary text-primary-foreground hover:opacity-90'
                                  : 'border-border bg-card hover:-translate-y-0.5 hover:border-foreground/40'
                              )}
                            >
                              {i === 0 ? `Start here: ${promptFor(s, answers)}` : promptFor(s, answers)}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 leading-relaxed text-foreground/80">
                        Nothing is blank. Read your story so far out loud and check that it sounds like the story you want
                        to tell.
                      </p>
                    )}
                  </section>
                  </Reveal>

                  {/* The results are free to read and edit. The PDF is an optional way to keep them. */}
                  <section className="card-soft mt-4 p-5 md:p-6">
                    <h2 className="text-xl font-bold">Keep your story notes</h2>
                    <p className="mt-1 leading-relaxed text-foreground/80">
                      You've figured out what works in your story and what needs more attention. Save your clarity
                      check as a PDF so you can return to it while developing your story.
                    </p>
                    {subscribed ? (
                      <Button className="mt-4 h-11 rounded-full px-5" onClick={download}>
                        <Download className="size-4" />
                        Download PDF
                      </Button>
                    ) : (
                      <>
                        <p className="mt-3 text-sm text-foreground/75">
                          Get the PDF and receive new storytelling posts and writing tools by email.
                        </p>
                        <div className="mt-4 max-w-xl">
                          <InlineSubscribe
                            buttonLabel="Get the PDF"
                            onDone={() => {
                              setSubscribed(true)
                              downloadPdf(answers)
                            }}
                          />
                        </div>
                      </>
                    )}
                  </section>

                  <details className="card-soft mt-4 p-5 md:p-6">
                    <summary className="cursor-pointer font-heading text-lg font-semibold">Your answers</summary>
                    <ul className="mt-4 space-y-4">
                      {STEPS.map((s, i) => {
                        const text = answerText(s, answers)
                        return (
                          <li key={s.key}>
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold">{s.title}</p>
                              <button type="button" onClick={() => edit(i + 1)} className="shrink-0 text-sm font-semibold text-sky hover:underline">
                                Edit
                              </button>
                            </div>
                            <p className={cn('mt-1', text ? 'text-foreground/85' : 'italic text-muted-foreground')}>
                              {text || 'Not sure yet. A spot to explore next.'}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  </details>

                  <Feedback answers={answers} />

                  <button type="button" onClick={restart} className="mt-8 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    Start over with a new story
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------- Rating + optional note. Open to everyone, no subscription needed. ----------
function Feedback({ answers }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [shareAnswers, setShareAnswers] = useState(false)
  const [trap, setTrap] = useState('') // hidden field: real people never fill it, bots do
  const [status, setStatus] = useState(hasRated() ? 'done' : 'idle') // idle | sending | error | done

  async function submit(e) {
    e.preventDefault()
    if (!rating || status === 'sending') return
    if (trap) return setStatus('done')
    setStatus('sending')
    try {
      const { name, ...rest } = answers // the character's name is never sent
      await CheckerFeedbackService.submit({ rating, comment, email, answers: shareAnswers ? rest : null })
      markRated()
      setStatus('done')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="card-soft mt-8 p-6 text-center">
        <p className="hand text-3xl">Thank you!</p>
        <p className="mt-1 text-foreground/80">Your feedback helps me make this better for every writer.</p>
      </div>
    )
  }

  const active = hover || rating

  return (
    <form onSubmit={submit} className="card-soft mt-8 p-6">
      <h2 className="text-xl font-bold">How was the checker?</h2>
      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded p-1 transition-transform hover:scale-110 motion-reduce:transition-none"
          >
            <Star className={cn('size-8', n <= active ? 'fill-butter text-butter' : 'text-foreground/25')} />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="mt-4 space-y-3">
          <textarea
            rows={3}
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Anything you'd like to tell me? (optional)"
            aria-label="Your thoughts (optional)"
            className={fieldClass}
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email, only if you'd like a reply (optional)"
            aria-label="Your email (optional)"
            className="h-11 rounded-full bg-card px-5"
          />
          <label className="flex items-start gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={shareAnswers}
              onChange={(e) => setShareAnswers(e.target.checked)}
              className="mt-1 size-4 accent-[var(--primary)]"
            />
            Share my answers anonymously to help improve the checker. Your protagonist's name is never sent.
          </label>
          <input
            type="text"
            name="website"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          {status === 'error' && (
            <p role="alert" className="text-sm text-destructive">
              That didn't send. Please try again in a moment.
            </p>
          )}
          <Button type="submit" disabled={status === 'sending'} className="rounded-full px-6">
            {status === 'sending' ? 'Sending...' : 'Send feedback'}
          </Button>
        </div>
      )}
    </form>
  )
}