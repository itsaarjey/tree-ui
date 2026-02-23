/**
 * Ego-centric (point-of-view) family tree layout.
 *
 * Band structure (top → bottom):
 *
 *   grandparents   — ego's parents' parents
 *   parents        — ego's parents + aunts/uncles + parents-in-law
 *   ego            — ego + siblings(left) + spouses(right) + siblings-in-law(right of spouses)
 *   children       — ego's children + nieces/nephews + cousins
 *   grandchildren  — ego's grandchildren
 *
 * All spouses of every visible member are also included.
 *
 * Layout uses a "band + slot" column model:
 *   • Each member gets an integer column index (can be negative).
 *   • colX(col) = col × (NODE_W + H_GAP) gives the pixel X.
 *   • Couple nodes sit in the gap between two adjacent columns.
 *   • A conflict-resolution pass ensures no two members in the same
 *     band share the same column, guaranteeing zero overlap.
 */

const NODE_W   = 180;
const NODE_H   = 80;
const H_GAP    = 40;
const V_GAP    = 120;
const COUPLE_W = 40;
const COUPLE_H = 40;

const COL_W = NODE_W + H_GAP;

const BAND = {
  grandparents:  -(NODE_H + V_GAP) * 2,
  parents:       -(NODE_H + V_GAP),
  ego:            0,
  children:       (NODE_H + V_GAP),
  grandchildren:  (NODE_H + V_GAP) * 2,
};

/* ─── helpers ─────────────────────────────────────────────── */

function coupleKey(a, b) { return [a, b].sort().join('|'); }
function colX(col) { return col * COL_W; }

function couplePosForCols(leftCol, rightCol, bandY) {
  const midX = (colX(leftCol) + NODE_W + colX(rightCol)) / 2;
  return { x: midX - COUPLE_W / 2, y: bandY + NODE_H / 2 - COUPLE_H / 2 };
}

function spouseRelBetween(p1, p2) {
  if (!p1 || !p2) return null;
  return (p1.spouses ?? []).find((s) => s.spouseId === p2.id) ?? null;
}

/* ─── main export ──────────────────────────────────────────── */

export function buildEgoCentricLayout(members, egoId) {
  if (!members || members.length === 0 || !egoId) return { nodes: [], edges: [] };

  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const ego  = byId[egoId];
  if (!ego) return { nodes: [], edges: [] };

  /* ── 1. Gather relatives ─────────────────────────────────── */

  const egoSpouseRels = ego.spouses ?? [];
  const egoSpouseIds  = new Set(egoSpouseRels.map((s) => s.spouseId));

  const parent1    = ego.parent1Id ? byId[ego.parent1Id] : null;
  const parent2    = ego.parent2Id ? byId[ego.parent2Id] : null;
  const egoParents = [parent1, parent2].filter(Boolean);

  // Siblings: share ≥1 parent with ego
  const egoSiblingIds = members
    .filter((m) => {
      if (m.id === egoId || egoSpouseIds.has(m.id)) return false;
      const sp1 = ego.parent1Id && (m.parent1Id === ego.parent1Id || m.parent2Id === ego.parent1Id);
      const sp2 = ego.parent2Id && (m.parent1Id === ego.parent2Id || m.parent2Id === ego.parent2Id);
      return sp1 || sp2;
    })
    .map((m) => m.id);

  // Ego's own children
  const egoChildIds = members
    .filter((m) => m.parent1Id === egoId || m.parent2Id === egoId)
    .map((m) => m.id);

  // Nieces & nephews: children of ego's siblings
  const nieceNephewIds = members
    .filter((m) => egoSiblingIds.includes(m.parent1Id) || egoSiblingIds.includes(m.parent2Id))
    .map((m) => m.id);

  // Grandchildren: children of ego's children
  const grandchildIds = members
    .filter((m) => egoChildIds.includes(m.parent1Id) || egoChildIds.includes(m.parent2Id))
    .map((m) => m.id);

  // Aunts/uncles: siblings of ego's parents
  const auntsUnclesByParent = {};
  const allAuntUncleIds = new Set();
  for (const p of egoParents) {
    auntsUnclesByParent[p.id] = members
      .filter((m) => {
        if (m.id === p.id || m.id === egoId || egoSiblingIds.includes(m.id)) return false;
        const sp1 = p.parent1Id && (m.parent1Id === p.parent1Id || m.parent2Id === p.parent1Id);
        const sp2 = p.parent2Id && (m.parent1Id === p.parent2Id || m.parent2Id === p.parent2Id);
        return sp1 || sp2;
      })
      .map((m) => m.id);
    auntsUnclesByParent[p.id].forEach((id) => allAuntUncleIds.add(id));
  }

  // Cousins: children of aunts/uncles
  const cousinIds = members
    .filter((m) => allAuntUncleIds.has(m.parent1Id) || allAuntUncleIds.has(m.parent2Id))
    .map((m) => m.id);

  // Grandparents
  const gpSeen = new Set();
  const grandparentIds = [];
  for (const p of egoParents) {
    for (const gpId of [p.parent1Id, p.parent2Id]) {
      if (gpId && !gpSeen.has(gpId)) { gpSeen.add(gpId); grandparentIds.push(gpId); }
    }
  }

  // In-laws: per ego spouse — their parents (parents-in-law) and siblings (siblings-in-law)
  // parentInLawsBySpouse[spouseId] = [memberId, ...]
  // siblingInLawsBySpouse[spouseId] = [memberId, ...]
  const parentInLawsBySpouse  = {};
  const siblingInLawsBySpouse = {};
  for (const rel of egoSpouseRels) {
    const sp = byId[rel.spouseId];
    if (!sp) continue;

    // Parents-in-law: spouse's parents (not already ego's own parents)
    const pil = [sp.parent1Id, sp.parent2Id]
      .filter((id) => id && byId[id] && !egoParents.find((p) => p.id === id));
    parentInLawsBySpouse[rel.spouseId] = pil;

    // Siblings-in-law: members who share a parent with the spouse
    //   (not ego, not ego's siblings, not ego's own spouses)
    const sil = members
      .filter((m) => {
        if (m.id === rel.spouseId || m.id === egoId) return false;
        if (egoSiblingIds.includes(m.id) || egoSpouseIds.has(m.id)) return false;
        const sh1 = sp.parent1Id && (m.parent1Id === sp.parent1Id || m.parent2Id === sp.parent1Id);
        const sh2 = sp.parent2Id && (m.parent1Id === sp.parent2Id || m.parent2Id === sp.parent2Id);
        return sh1 || sh2;
      })
      .map((m) => m.id);
    siblingInLawsBySpouse[rel.spouseId] = sil;
  }

  /* ── 2. Assign column slots ──────────────────────────────── */

  const colMap  = {};   // memberId → col int
  const bandMap = {};   // memberId → band key string
  const cpMap   = {};   // coupleId → { x, y }

  // ── EGO ROW ──
  colMap[egoId]  = 0;
  bandMap[egoId] = 'ego';

  // Ego's spouses fan RIGHT; siblings-in-law fan further right after each spouse group
  let egoRightCol = 1;
  for (const rel of egoSpouseRels) {
    // Place the spouse
    cpMap[`couple-${rel.id}`] = couplePosForCols(egoRightCol - 1, egoRightCol, BAND.ego);
    colMap[rel.spouseId]  = egoRightCol;
    bandMap[rel.spouseId] = 'ego';
    egoRightCol++;

    // Siblings-in-law fan further right after the spouse
    const silIds = siblingInLawsBySpouse[rel.spouseId] ?? [];
    for (const silId of silIds) {
      if (colMap[silId] !== undefined) continue;
      const sil = byId[silId];
      const silSpouses = sil?.spouses ?? [];
      // sil occupies egoRightCol; its spouses go to the right
      colMap[silId]  = egoRightCol;
      bandMap[silId] = 'ego';
      let ssCol = egoRightCol + 1;
      for (const sRel of silSpouses) {
        if (colMap[sRel.spouseId] !== undefined) continue;
        cpMap[`couple-${sRel.id}`] = couplePosForCols(ssCol - 1, ssCol, BAND.ego);
        colMap[sRel.spouseId]  = ssCol;
        bandMap[sRel.spouseId] = 'ego';
        ssCol++;
      }
      egoRightCol = ssCol;
    }
  }

  // Siblings fan LEFT; each sibling's spouses fan further left of that sibling
  let egoLeftCol = -1;
  for (const sibId of egoSiblingIds) {
    const sib = byId[sibId];
    if (!sib) continue;
    const sibSpouses = sib.spouses ?? [];
    const sibCol = egoLeftCol - sibSpouses.length;
    colMap[sibId]  = sibCol;
    bandMap[sibId] = 'ego';
    let sCol = sibCol - 1;
    for (const sRel of sibSpouses) {
      if (colMap[sRel.spouseId] !== undefined) continue;
      cpMap[`couple-${sRel.id}`] = couplePosForCols(sCol, sCol + 1, BAND.ego);
      colMap[sRel.spouseId]  = sCol;
      bandMap[sRel.spouseId] = 'ego';
      sCol--;
    }
    egoLeftCol = sibCol - 1;
  }

  // ── PARENTS ROW ──
  if (egoParents.length === 2) {
    colMap[parent1.id]  = -1;  bandMap[parent1.id]  = 'parents';
    colMap[parent2.id]  =  0;  bandMap[parent2.id]  = 'parents';
    const pRel = spouseRelBetween(parent1, parent2);
    if (pRel) cpMap[`couple-${pRel.id}`] = couplePosForCols(-1, 0, BAND.parents);

    // parent1 other spouses fan LEFT
    let p1L = -2;
    for (const sRel of parent1.spouses ?? []) {
      if (sRel.spouseId === parent2.id || colMap[sRel.spouseId] !== undefined) continue;
      cpMap[`couple-${sRel.id}`] = couplePosForCols(p1L, p1L + 1, BAND.parents);
      colMap[sRel.spouseId]  = p1L;  bandMap[sRel.spouseId] = 'parents';
      p1L--;
    }

    // parent2 other spouses fan RIGHT
    let p2R = 1;
    for (const sRel of parent2.spouses ?? []) {
      if (sRel.spouseId === parent1.id || colMap[sRel.spouseId] !== undefined) continue;
      cpMap[`couple-${sRel.id}`] = couplePosForCols(p2R - 1, p2R, BAND.parents);
      colMap[sRel.spouseId]  = p2R;  bandMap[sRel.spouseId] = 'parents';
      p2R++;
    }

    // Aunts/uncles of parent1 fan further LEFT
    let au1L = p1L - 1;
    for (const auId of [...(auntsUnclesByParent[parent1.id] ?? [])].reverse()) {
      if (colMap[auId] !== undefined) continue;
      const au = byId[auId];
      const auSpouses = au?.spouses ?? [];
      const auCol = au1L - auSpouses.length;
      colMap[auId]  = auCol;  bandMap[auId] = 'parents';
      let asCol = auCol - 1;
      for (const sRel of auSpouses) {
        if (colMap[sRel.spouseId] !== undefined) continue;
        cpMap[`couple-${sRel.id}`] = couplePosForCols(asCol, asCol + 1, BAND.parents);
        colMap[sRel.spouseId]  = asCol;  bandMap[sRel.spouseId] = 'parents';
        asCol--;
      }
      au1L = auCol - 1;
    }

    // Aunts/uncles of parent2 fan further RIGHT
    let au2R = p2R;
    for (const auId of auntsUnclesByParent[parent2.id] ?? []) {
      if (colMap[auId] !== undefined) continue;
      const au = byId[auId];
      colMap[auId]  = au2R;  bandMap[auId] = 'parents';
      let asCol = au2R + 1;
      for (const sRel of au?.spouses ?? []) {
        if (colMap[sRel.spouseId] !== undefined) continue;
        cpMap[`couple-${sRel.id}`] = couplePosForCols(asCol - 1, asCol, BAND.parents);
        colMap[sRel.spouseId]  = asCol;  bandMap[sRel.spouseId] = 'parents';
        asCol++;
      }
      au2R = asCol;
    }

    // Parents-in-law: placed to the right of au2R (far right of parents band)
    let pilR = au2R;
    for (const rel of egoSpouseRels) {
      const pilIds = parentInLawsBySpouse[rel.spouseId] ?? [];
      for (const pilId of pilIds) {
        if (colMap[pilId] !== undefined) continue;
        const pil  = byId[pilId];
        colMap[pilId]  = pilR;  bandMap[pilId] = 'parents';
        // parent-in-law's spouse (if also a parent-in-law, they're in the same list)
        let pilSpouseCol = pilR + 1;
        for (const sRel of pil?.spouses ?? []) {
          if (colMap[sRel.spouseId] !== undefined) continue;
          if (!pilIds.includes(sRel.spouseId) && !byId[sRel.spouseId]) continue;
          cpMap[`couple-${sRel.id}`] = couplePosForCols(pilR, pilSpouseCol, BAND.parents);
          colMap[sRel.spouseId]  = pilSpouseCol;  bandMap[sRel.spouseId] = 'parents';
          pilSpouseCol++;
          pilR = pilSpouseCol;
        }
        pilR = Math.max(pilR, pilSpouseCol);
      }
    }

  } else if (egoParents.length === 1) {
    const p = egoParents[0];
    colMap[p.id]  = 0;  bandMap[p.id] = 'parents';

    let pR = 1;
    for (const sRel of p.spouses ?? []) {
      if (colMap[sRel.spouseId] !== undefined) continue;
      cpMap[`couple-${sRel.id}`] = couplePosForCols(pR - 1, pR, BAND.parents);
      colMap[sRel.spouseId]  = pR;  bandMap[sRel.spouseId] = 'parents';
      pR++;
    }

    const aus = auntsUnclesByParent[p.id] ?? [];
    let auL = -1, auR = pR;
    for (let i = 0; i < aus.length; i++) {
      const auId = aus[i];
      if (colMap[auId] !== undefined) continue;
      const au = byId[auId];
      const auSpouses = au?.spouses ?? [];
      if (i % 2 === 0) {
        const auCol = auL - auSpouses.length;
        colMap[auId]  = auCol;  bandMap[auId] = 'parents';
        let asCol = auCol - 1;
        for (const sRel of auSpouses) {
          if (colMap[sRel.spouseId] !== undefined) continue;
          cpMap[`couple-${sRel.id}`] = couplePosForCols(asCol, asCol + 1, BAND.parents);
          colMap[sRel.spouseId]  = asCol;  bandMap[sRel.spouseId] = 'parents';
          asCol--;
        }
        auL = auCol - 1;
      } else {
        colMap[auId]  = auR;  bandMap[auId] = 'parents';
        let asCol = auR + 1;
        for (const sRel of auSpouses) {
          if (colMap[sRel.spouseId] !== undefined) continue;
          cpMap[`couple-${sRel.id}`] = couplePosForCols(asCol - 1, asCol, BAND.parents);
          colMap[sRel.spouseId]  = asCol;  bandMap[sRel.spouseId] = 'parents';
          asCol++;
        }
        auR = asCol;
      }
    }

    // Parents-in-law to the right of au2R
    let pilR = auR;
    for (const rel of egoSpouseRels) {
      const pilIds = parentInLawsBySpouse[rel.spouseId] ?? [];
      for (const pilId of pilIds) {
        if (colMap[pilId] !== undefined) continue;
        const pil = byId[pilId];
        colMap[pilId]  = pilR;  bandMap[pilId] = 'parents';
        let pilSpouseCol = pilR + 1;
        for (const sRel of pil?.spouses ?? []) {
          if (colMap[sRel.spouseId] !== undefined) continue;
          if (!pilIds.includes(sRel.spouseId) && !byId[sRel.spouseId]) continue;
          cpMap[`couple-${sRel.id}`] = couplePosForCols(pilR, pilSpouseCol, BAND.parents);
          colMap[sRel.spouseId]  = pilSpouseCol;  bandMap[sRel.spouseId] = 'parents';
          pilSpouseCol++;
          pilR = pilSpouseCol;
        }
        pilR = Math.max(pilR, pilSpouseCol);
      }
    }

  } else {
    // No ego parents — still place parents-in-law if any
    let pilR = 1;
    for (const rel of egoSpouseRels) {
      const pilIds = parentInLawsBySpouse[rel.spouseId] ?? [];
      for (const pilId of pilIds) {
        if (colMap[pilId] !== undefined) continue;
        const pil = byId[pilId];
        colMap[pilId]  = pilR;  bandMap[pilId] = 'parents';
        let pilSpouseCol = pilR + 1;
        for (const sRel of pil?.spouses ?? []) {
          if (colMap[sRel.spouseId] !== undefined) continue;
          if (!pilIds.includes(sRel.spouseId)) continue;
          cpMap[`couple-${sRel.id}`] = couplePosForCols(pilR, pilSpouseCol, BAND.parents);
          colMap[sRel.spouseId]  = pilSpouseCol;  bandMap[sRel.spouseId] = 'parents';
          pilSpouseCol++;
          pilR = pilSpouseCol;
        }
        pilR = Math.max(pilR, pilSpouseCol);
      }
    }
  }

  // ── GRANDPARENTS ROW ──
  for (const p of egoParents) {
    const gp1  = p.parent1Id ? byId[p.parent1Id] : null;
    const gp2  = p.parent2Id ? byId[p.parent2Id] : null;
    const pCol = colMap[p.id] ?? 0;

    if (gp1 && gp2) {
      if (colMap[gp1.id] === undefined) { colMap[gp1.id] = pCol - 1;  bandMap[gp1.id] = 'grandparents'; }
      if (colMap[gp2.id] === undefined) { colMap[gp2.id] = pCol;      bandMap[gp2.id] = 'grandparents'; }
      const gpRel = spouseRelBetween(gp1, gp2);
      if (gpRel && !cpMap[`couple-${gpRel.id}`]) {
        cpMap[`couple-${gpRel.id}`] = couplePosForCols(
          Math.min(colMap[gp1.id], colMap[gp2.id]),
          Math.max(colMap[gp1.id], colMap[gp2.id]),
          BAND.grandparents
        );
      }
    } else if (gp1 && colMap[gp1.id] === undefined) {
      colMap[gp1.id] = pCol;  bandMap[gp1.id] = 'grandparents';
    } else if (gp2 && colMap[gp2.id] === undefined) {
      colMap[gp2.id] = pCol;  bandMap[gp2.id] = 'grandparents';
    }
  }

  // ── CHILDREN ROW ──
  // Helper: place a list of children centred under an anchor col, with their spouses
  function placeChildGroup(childIds, anchorCCol, band) {
    if (!childIds.length) return;
    const half = (childIds.length - 1) / 2;
    for (let i = 0; i < childIds.length; i++) {
      const cId = childIds[i];
      if (colMap[cId] !== undefined) continue;
      const cCol = Math.round(anchorCCol - half + i);
      colMap[cId]  = cCol;  bandMap[cId] = band;
      let csCol = cCol + 1;
      for (const sRel of (byId[cId]?.spouses ?? [])) {
        if (colMap[sRel.spouseId] !== undefined) continue;
        cpMap[`couple-${sRel.id}`] = couplePosForCols(csCol - 1, csCol, BAND[band]);
        colMap[sRel.spouseId]  = csCol;  bandMap[sRel.spouseId] = band;
        csCol++;
      }
    }
  }

  // Ego's children grouped by couple anchor
  const egoCoupleByPair = {};
  for (const rel of egoSpouseRels) {
    egoCoupleByPair[coupleKey(egoId, rel.spouseId)] = rel.id;
  }
  const egoChildrenByAnchor = {};
  for (const cId of egoChildIds) {
    const child   = byId[cId];
    const otherId = child.parent1Id === egoId ? child.parent2Id : child.parent1Id;
    const key     = otherId ? coupleKey(egoId, otherId) : null;
    const relId   = key ? egoCoupleByPair[key] : null;
    const anchor  = relId ? `couple-${relId}` : egoId;
    (egoChildrenByAnchor[anchor] = egoChildrenByAnchor[anchor] || []).push(cId);
  }
  const anchorOrder = [egoId, ...egoSpouseRels.map((r) => `couple-${r.id}`)];
  for (const anchor of anchorOrder) {
    const children = egoChildrenByAnchor[anchor] ?? [];
    if (!children.length) continue;
    const anchorCCol = anchor === egoId
      ? 0.5
      : (() => { const cp = cpMap[anchor]; return cp ? (cp.x + COUPLE_W / 2) / COL_W : 0.5; })();
    placeChildGroup(children, anchorCCol, 'children');
  }

  // Nieces & nephews: under their sibling-parent
  for (const sibId of egoSiblingIds) {
    const sibCol = colMap[sibId];
    if (sibCol === undefined) continue;
    const nibIds = nieceNephewIds.filter((nId) => {
      const n = byId[nId];
      return n && (n.parent1Id === sibId || n.parent2Id === sibId);
    });
    if (!nibIds.length) continue;
    const sib = byId[sibId];
    const sibCoupleByPair = {};
    for (const sRel of sib?.spouses ?? []) sibCoupleByPair[coupleKey(sibId, sRel.spouseId)] = sRel.id;
    const nibByAnchor = {};
    for (const nId of nibIds) {
      const n       = byId[nId];
      const otherId = n.parent1Id === sibId ? n.parent2Id : n.parent1Id;
      const key     = otherId ? coupleKey(sibId, otherId) : null;
      const relId   = key ? sibCoupleByPair[key] : null;
      const anchor  = relId ? `couple-${relId}` : sibId;
      (nibByAnchor[anchor] = nibByAnchor[anchor] || []).push(nId);
    }
    for (const [anchor, nibs] of Object.entries(nibByAnchor)) {
      const anchorCCol = anchor === sibId
        ? sibCol + 0.5
        : (() => { const cp = cpMap[anchor]; return cp ? (cp.x + COUPLE_W / 2) / COL_W : sibCol + 0.5; })();
      placeChildGroup(nibs, anchorCCol, 'children');
    }
  }

  // Cousins: under their aunt/uncle parent
  for (const parentId of allAuntUncleIds) {
    const parentCol = colMap[parentId];
    if (parentCol === undefined) continue;
    const cousIds = cousinIds.filter((cId) => {
      const c = byId[cId];
      return c && (c.parent1Id === parentId || c.parent2Id === parentId);
    });
    if (!cousIds.length) continue;
    const auMember = byId[parentId];
    const auCoupleByPair = {};
    for (const sRel of auMember?.spouses ?? []) auCoupleByPair[coupleKey(parentId, sRel.spouseId)] = sRel.id;
    const cousByAnchor = {};
    for (const cId of cousIds) {
      const c       = byId[cId];
      const otherId = c.parent1Id === parentId ? c.parent2Id : c.parent1Id;
      const key     = otherId ? coupleKey(parentId, otherId) : null;
      const relId   = key ? auCoupleByPair[key] : null;
      const anchor  = relId ? `couple-${relId}` : parentId;
      (cousByAnchor[anchor] = cousByAnchor[anchor] || []).push(cId);
    }
    for (const [anchor, cous] of Object.entries(cousByAnchor)) {
      const anchorCCol = anchor === parentId
        ? parentCol + 0.5
        : (() => { const cp = cpMap[anchor]; return cp ? (cp.x + COUPLE_W / 2) / COL_W : parentCol + 0.5; })();
      placeChildGroup(cous, anchorCCol, 'children');
    }
  }

  // ── GRANDCHILDREN ROW ──
  for (const cId of egoChildIds) {
    const cCol = colMap[cId];
    if (cCol === undefined) continue;
    const gcIds = grandchildIds.filter((gcId) => {
      const gc = byId[gcId];
      return gc && (gc.parent1Id === cId || gc.parent2Id === cId);
    });
    if (!gcIds.length) continue;
    const child = byId[cId];
    const childCoupleByPair = {};
    for (const sRel of child?.spouses ?? []) childCoupleByPair[coupleKey(cId, sRel.spouseId)] = sRel.id;
    const gcByAnchor = {};
    for (const gcId of gcIds) {
      const gc      = byId[gcId];
      const otherId = gc.parent1Id === cId ? gc.parent2Id : gc.parent1Id;
      const key     = otherId ? coupleKey(cId, otherId) : null;
      const relId   = key ? childCoupleByPair[key] : null;
      const anchor  = relId ? `couple-${relId}` : cId;
      (gcByAnchor[anchor] = gcByAnchor[anchor] || []).push(gcId);
    }
    for (const [anchor, gcs] of Object.entries(gcByAnchor)) {
      const anchorCCol = anchor === cId
        ? cCol + 0.5
        : (() => { const cp = cpMap[anchor]; return cp ? (cp.x + COUPLE_W / 2) / COL_W : cCol + 0.5; })();
      placeChildGroup(gcs, anchorCCol, 'grandchildren');
    }
  }

  /* ── 3. Collect visible ids + stabilise spouses ──────────── */

  const visibleIds = new Set(Object.keys(colMap));

  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...visibleIds]) {
      const m = byId[id];
      if (!m) continue;
      for (const sp of m.spouses ?? []) {
        if (visibleIds.has(sp.spouseId) || !byId[sp.spouseId]) continue;
        visibleIds.add(sp.spouseId);
        changed = true;
        if (colMap[sp.spouseId] === undefined) {
          const partnerCol  = colMap[id] ?? 0;
          const partnerBand = bandMap[id] ?? 'ego';
          const newCol      = partnerCol + 1;
          colMap[sp.spouseId]  = newCol;
          bandMap[sp.spouseId] = partnerBand;
          if (!cpMap[`couple-${sp.id}`]) {
            cpMap[`couple-${sp.id}`] = couplePosForCols(partnerCol, newCol, BAND[partnerBand] ?? 0);
          }
        }
      }
    }
  }

  /* ── 4. Resolve column conflicts within each band ────────── */
  /*
   * Naive per-member bumping breaks spouse pairs: if one member of a pair
   * gets bumped to a different column the couple node ends up floating over
   * an unrelated card.
   *
   * Fix: treat each spouse CLUSTER as an atomic block.
   *   1. BFS over spouse links within the band → build clusters.
   *   2. Sort clusters by their leftmost column.
   *   3. Re-assign columns: each cluster gets consecutive columns, clusters
   *      are packed left→right with no gaps, so the couple-node gap always
   *      falls cleanly between the two adjacent spouse columns.
   */
  const bandOrder = ['grandparents', 'parents', 'ego', 'children', 'grandchildren'];

  for (const band of bandOrder) {
    const inBand = [...visibleIds].filter((id) => bandMap[id] === band);
    if (!inBand.length) continue;

    // Build spouse clusters by BFS over spouse links within this band
    const grouped = new Set();
    const clusters = [];

    for (const startId of inBand) {
      if (grouped.has(startId)) continue;
      const cluster = [];
      const queue   = [startId];
      grouped.add(startId);
      while (queue.length) {
        const cur = queue.shift();
        cluster.push(cur);
        for (const sp of (byId[cur]?.spouses ?? [])) {
          if (!grouped.has(sp.spouseId) && bandMap[sp.spouseId] === band && visibleIds.has(sp.spouseId)) {
            grouped.add(sp.spouseId);
            queue.push(sp.spouseId);
          }
        }
      }
      // Sort members within cluster by their intended column (left→right)
      cluster.sort((a, b) => (colMap[a] ?? 0) - (colMap[b] ?? 0));
      clusters.push(cluster);
    }

    // Sort clusters by their leftmost member's column
    clusters.sort((a, b) => (colMap[a[0]] ?? 0) - (colMap[b[0]] ?? 0));

    // Pack clusters: assign consecutive columns, preserving left→right order
    // Anchor the first cluster at its natural position; each subsequent cluster
    // starts immediately after the previous one ends (no gaps, no overlaps)
    let nextCol = colMap[clusters[0]?.[0]] ?? 0;
    for (const cluster of clusters) {
      // Don't pull clusters leftward past their natural start
      const naturalStart = colMap[cluster[0]] ?? 0;
      if (nextCol < naturalStart) nextCol = naturalStart;

      for (let i = 0; i < cluster.length; i++) {
        colMap[cluster[i]] = nextCol + i;
      }
      nextCol += cluster.length;
    }
  }

  /* ── 5. Build pixel positions ────────────────────────────── */

  const posMap = {};
  for (const id of visibleIds) {
    posMap[id] = { x: colX(colMap[id] ?? 0), y: BAND[bandMap[id] ?? 'ego'] ?? 0 };
  }

  // Recompute couple-node positions from final resolved columns
  const finalCpMap = {};
  for (const id of visibleIds) {
    const m = byId[id];
    if (!m) continue;
    for (const sp of m.spouses ?? []) {
      if (!visibleIds.has(sp.spouseId)) continue;
      const cId = `couple-${sp.id}`;
      if (finalCpMap[cId]) continue;
      const col1 = colMap[id]          ?? 0;
      const col2 = colMap[sp.spouseId] ?? 0;
      const band = bandMap[id]         ?? 'ego';
      finalCpMap[cId] = couplePosForCols(Math.min(col1, col2), Math.max(col1, col2), BAND[band] ?? 0);
    }
  }

  /* ── 6. Build React Flow nodes ───────────────────────────── */

  const nodes  = [];
  const edges  = [];
  const spouseEdgesSeen = new Set();
  const coupleNodes     = [];

  for (const id of visibleIds) {
    const m = byId[id];
    if (!m) continue;
    nodes.push({
      id,
      type: 'member',
      position: posMap[id],
      data: { member: m },
      draggable: true,
    });
  }

  /* ── 7. Spouse edges + couple nodes ─────────────────────── */

  for (const id of visibleIds) {
    const m = byId[id];
    if (!m) continue;
    for (const sp of m.spouses ?? []) {
      if (!visibleIds.has(sp.spouseId)) continue;
      const key = coupleKey(id, sp.spouseId);
      if (spouseEdgesSeen.has(key)) continue;
      spouseEdgesSeen.add(key);

      const cId = `couple-${sp.id}`;
      const pos  = finalCpMap[cId] ?? {
        x: ((posMap[id]?.x ?? 0) + (posMap[sp.spouseId]?.x ?? 0)) / 2 + NODE_W / 2 - COUPLE_W / 2,
        y: ((posMap[id]?.y ?? 0) + (posMap[sp.spouseId]?.y ?? 0)) / 2 + NODE_H / 2 - COUPLE_H / 2,
      };

      coupleNodes.push({
        id: cId,
        type: 'couple',
        position: pos,
        data: { member1Id: id, member2Id: sp.spouseId, relationId: sp.id, status: sp.status },
        draggable: true,
        selectable: true,
      });

      edges.push({
        id: `spouse-left-${sp.id}`,
        source: id, target: cId, type: 'spouse',
        data: { relationId: sp.id, status: sp.status, member1Id: id, member2Id: sp.spouseId, coupleId: cId },
        animated: false,
      });
      edges.push({
        id: `spouse-right-${sp.id}`,
        source: sp.spouseId, target: cId, type: 'spouse',
        data: { relationId: sp.id, status: sp.status, member1Id: id, member2Id: sp.spouseId, coupleId: cId },
        animated: false,
      });
    }
  }

  nodes.push(...coupleNodes);

  /* ── 8. Parent → child edges ────────────────────────────── */

  const coupleByPair = {};
  for (const cn of coupleNodes) {
    coupleByPair[coupleKey(cn.data.member1Id, cn.data.member2Id)] = cn.id;
  }

  for (const id of visibleIds) {
    const m = byId[id];
    if (!m || !m.parent1Id || !visibleIds.has(m.parent1Id)) continue;
    const p1 = m.parent1Id;
    const p2 = m.parent2Id && visibleIds.has(m.parent2Id) ? m.parent2Id : null;
    const sourceId = p2 ? (coupleByPair[coupleKey(p1, p2)] || p1) : p1;
    edges.push({
      id: `parent-${id}`,
      source: sourceId, target: id, type: 'parent',
      data: { childId: id, parent1Id: p1, parent2Id: p2 },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12 },
    });
  }

  return { nodes, edges };
}
