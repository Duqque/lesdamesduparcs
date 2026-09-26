"use client";

import { useEffect } from "react";

/**
 * Finition typographique appliquée à tout le site (y compris aux textes saisis en administration) :
 *  - aucun mot n'est coupé à la ligne : les traits d'union à l'intérieur d'un mot (« Saint-Germain », « rendez-vous »)
 *    ne sont plus des points de coupure ;
 *  - typographie française : espace insécable avant « : ; ! ? » % € » et après « ;
 *  - titres : si le mot le plus long d'un titre ne tient pas dans son conteneur, la taille du titre est réduite juste
 *    ce qu'il faut (aucun mot coupé au milieu, quel que soit l'écran).
 * Ne modifie que les nœuds texte du navigateur, après l'hydratation : le contenu du serveur reste intact (SEO, lecteurs d'écran).
 */
const WJ = "⁠";
const NBSP = " ";
const SKIP = "SCRIPT,STYLE,NOSCRIPT,TEXTAREA,INPUT,SELECT,OPTION,CODE,PRE,[contenteditable],[data-no-guard]";
const HEADINGS = 'h1,h2,h3,.font-display,[class*="font-display"],.t-display,.t-h1,.t-h2,.t-h3';

function cleanText(node: Text) {
  const v = node.nodeValue;
  if (!v) return;
  const next = v
    .replace(/(?<=[\p{L}\d])-(?=[\p{L}\d])/gu, `-${WJ}`)
    .replace(/ (?=[:;!?»%€])/g, NBSP)
    .replace(/(?<=«) /g, NBSP);
  if (next !== v) node.nodeValue = next;
}

function walk(root: Node) {
  const doc = root.ownerDocument ?? document;
  if (root.nodeType === Node.TEXT_NODE) {
    const p = root.parentElement;
    if (p && !p.closest(SKIP)) cleanText(root as Text);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if ((root as Element).closest(SKIP)) return;
  const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  let n: Node | null;
  while ((n = tw.nextNode())) cleanText(n as Text);
}

let ctx: CanvasRenderingContext2D | null = null;
function fitHeadings() {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return;
  const els = [...document.querySelectorAll<HTMLElement>(HEADINGS)].filter((e) => e.offsetParent !== null);
  // Lecture puis écriture séparées : pas de recalculs de mise en page en cascade.
  const plan: Array<[HTMLElement, string | null]> = [];
  for (const el of els) {
    if (el.dataset.fit) el.style.removeProperty("font-size");
  }
  for (const el of els) {
    const cw = el.clientWidth;
    const text = el.textContent ?? "";
    if (!cw || !text.trim()) continue;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const ls = parseFloat(cs.letterSpacing) || 0;
    const upper = cs.textTransform === "uppercase";
    let widest = 0;
    for (const w of text.split(/[\s ]+/)) {
      if (w.length < 3) continue;
      const word = (upper ? w.toUpperCase() : w).replace(new RegExp(WJ, "g"), "");
      widest = Math.max(widest, ctx.measureText(word).width + ls * word.length);
    }
    const inner = cw - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (widest > inner && inner > 0) plan.push([el, `${Math.max(14, Math.floor(size * (inner / widest) * 0.98 * 10) / 10)}px`]);
    else plan.push([el, null]);
  }
  for (const [el, size] of plan) {
    if (size) {
      el.style.fontSize = size;
      el.dataset.fit = "1";
    } else delete el.dataset.fit;
  }
}

export function TextGuard() {
  useEffect(() => {
    let raf = 0;
    let fitRaf = 0;
    const pending = new Set<Node>();
    let ready = false;
    const flush = () => {
      raf = 0;
      pending.forEach(walk);
      pending.clear();
      scheduleFit();
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    function scheduleFit() {
      cancelAnimationFrame(fitRaf);
      fitRaf = requestAnimationFrame(() => document.fonts.ready.then(fitHeadings));
    }
    const mo = new MutationObserver((list) => {
      if (!ready) return;
      for (const m of list) {
        if (m.type === "characterData") pending.add(m.target);
        else m.addedNodes.forEach((n) => pending.add(n));
      }
      schedule();
    });
    // Après l'hydratation (les zones encore en attente ne doivent pas voir leur texte modifié avant d'être « branchées »).
    const start = () => {
      ready = true;
      walk(document.body);
      scheduleFit();
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    };
    const t = window.setTimeout(start, document.readyState === "complete" ? 600 : 1200);
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("load", scheduleFit);
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(fitRaf);
      mo.disconnect();
      window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("load", scheduleFit);
    };
  }, []);
  return null;
}
