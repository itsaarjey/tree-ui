/**
 * Converts flat API members into React Flow nodes + edges.
 *
 * Layout strategy:
 * - Generation-based vertical placement (Y).
 * - Spouse pairs / clusters share an X cluster.
 * - A "couple node" (invisible, no render) acts as the mid-point
 *   handle for each spouse relation — children hang from it.
 *
 * Node types:
 *   member   — a real person card
 *   couple   — invisible connector node (holds spouse-edge midpoint)
 *
 * Edge types:
 *   spouse   — connects member ↔ member (or member ↔ couple segment)
 *   parent   — connects couple/member ↓ child
 */

const NODE_W = 180;
const NODE_H = 80;
const H_GAP = 40;   // horizontal gap between siblings/spouses
const V_GAP = 120;  // vertical gap between generations

/** Assign generation depth via BFS from members that have no parents. */
function computeGenerations(members) {
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const gen = {};

  // Seed: members with no parents
  const queue = [];
  for (const m of members) {
    if (!m.parent1Id) {
      gen[m.id] = 0;
      queue.push(m.id);
    }
  }

  // BFS downward
  while (queue.length) {
    const id = queue.shift();
    const children = members.filter(
      (m) => m.parent1Id === id || m.parent2Id === id
    );
    for (const c of children) {
      if (gen[c.id] === undefined) {
        gen[c.id] = (gen[id] ?? 0) + 1;
        queue.push(c.id);
      }
    }
  }

  // Fallback for orphaned cycles (shouldn't happen but defensive)
  for (const m of members) {
    if (gen[m.id] === undefined) gen[m.id] = 0;
  }

  return gen;
}

/** Group members into spouse clusters per generation. */
function buildSpouseClusters(members, gen) {
  const visited = new Set();
  const clusters = {}; // genLevel -> cluster[]

  function clusterOf(memberId) {
    const m = members.find((x) => x.id === memberId);
    if (!m) return [memberId];
    const cluster = [memberId];
    visited.add(memberId);
    for (const sp of m.spouses || []) {
      if (!visited.has(sp.spouseId)) {
        visited.add(sp.spouseId);
        cluster.push(sp.spouseId);
      }
    }
    return cluster;
  }

  // Sort members by generation
  const byGen = {};
  for (const m of members) {
    const g = gen[m.id] ?? 0;
    (byGen[g] = byGen[g] || []).push(m);
  }

  for (const [g, genMembers] of Object.entries(byGen)) {
    clusters[g] = [];
    for (const m of genMembers) {
      if (!visited.has(m.id)) {
        clusters[g].push(clusterOf(m.id));
      }
    }
  }

  return clusters;
}

export function buildNodesAndEdges(members) {
  if (!members || members.length === 0) return { nodes: [], edges: [] };

  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  const gen = computeGenerations(members);

  // --- Position nodes ---
  // Simple left-to-right placement per generation.
  // We'll do a two-pass: first lay out generation 0, then cascade down.

  const posMap = {}; // id -> { x, y }
  const genGroups = {};
  for (const m of members) {
    const g = gen[m.id] ?? 0;
    (genGroups[g] = genGroups[g] || []).push(m.id);
  }

  // Track couples for edge + couple-node creation
  const spouseEdgesSeen = new Set();
  const coupleNodes = []; // { id, x, y, member1Id, member2Id, relationId, status }

  // Place each generation
  const maxGen = Math.max(...Object.keys(genGroups).map(Number));
  for (let g = 0; g <= maxGen; g++) {
    const ids = genGroups[g] || [];
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP;
    let startX = -totalW / 2;
    for (const id of ids) {
      posMap[id] = { x: startX, y: g * (NODE_H + V_GAP) };
      startX += NODE_W + H_GAP;
    }
  }

  const nodes = [];
  const edges = [];

  // Member nodes
  for (const m of members) {
    nodes.push({
      id: m.id,
      type: 'member',
      position: posMap[m.id] || { x: 0, y: 0 },
      data: { member: m },
      draggable: true,
    });
  }

  // Spouse edges + couple nodes
  for (const m of members) {
    for (const sp of m.spouses || []) {
      const key = [m.id, sp.spouseId].sort().join('|');
      if (spouseEdgesSeen.has(key)) continue;
      spouseEdgesSeen.add(key);

      const spMember = byId[sp.spouseId];
      const pos1 = posMap[m.id] || { x: 0, y: 0 };
      const pos2 = spMember ? posMap[sp.spouseId] || { x: 0, y: 0 } : pos1;

      const coupleId = `couple-${sp.id}`;
      const coupleX = (pos1.x + pos2.x) / 2;
      const coupleY = (pos1.y + pos2.y) / 2;

      // Couple node — midpoint anchor between spouses, draggable & right-clickable
      // Position: horizontally between the two members, vertically centred on the cards
      // The node itself is 40×40 (hit area), so offset by -20 to centre it
      coupleNodes.push({
        id: coupleId,
        type: 'couple',
        position: { x: coupleX + NODE_W / 2 - 20, y: coupleY + NODE_H / 2 - 20 },
        data: {
          member1Id: m.id,
          member2Id: sp.spouseId,
          relationId: sp.id,
          status: sp.status,
        },
        draggable: true,
        selectable: true,
      });

      // Spouse edges — no fixed sourceHandle/targetHandle.
      // SpouseEdge component reads live node positions and picks left/right dynamically.
      edges.push({
        id: `spouse-left-${sp.id}`,
        source: m.id,
        target: coupleId,
        type: 'spouse',
        data: {
          relationId: sp.id,
          status: sp.status,
          member1Id: m.id,
          member2Id: sp.spouseId,
          coupleId,
          role: 'member1', // identifies which member this edge connects
        },
        animated: false,
      });

      if (spMember) {
        edges.push({
          id: `spouse-right-${sp.id}`,
          source: sp.spouseId,
          target: coupleId,
          type: 'spouse',
          data: {
            relationId: sp.id,
            status: sp.status,
            member1Id: m.id,
            member2Id: sp.spouseId,
            coupleId,
            role: 'member2',
          },
          animated: false,
        });
      }
    }
  }

  nodes.push(...coupleNodes);

  // Parent → child edges
  // For each child, find the best "source" node:
  // - If both parents are spouses → source = couple node
  // - If only one parent → source = that member node
  const coupleByPair = {};
  for (const cn of coupleNodes) {
    const key = [cn.data.member1Id, cn.data.member2Id].sort().join('|');
    coupleByPair[key] = cn.id;
  }

  for (const m of members) {
    if (!m.parent1Id) continue;
    const p1 = m.parent1Id;
    const p2 = m.parent2Id;

    let sourceId;
    if (p2) {
      const key = [p1, p2].sort().join('|');
      sourceId = coupleByPair[key] || p1;
    } else {
      sourceId = p1;
    }

    edges.push({
      id: `parent-${m.id}`,
      source: sourceId,
      target: m.id,
      type: 'parent',
      data: { childId: m.id, parent1Id: p1, parent2Id: p2 || null },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12 },
    });
  }

  return { nodes, edges };
}
