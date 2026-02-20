import { useInternalNode } from '@xyflow/react';

/**
 * Spouse edge — straight line from member card side to the midpoint between both spouses.
 *
 * Both spouse edges (member1→couple and member2→couple) subscribe to ALL THREE nodes
 * (member1, member2, coupleNode) so they re-render whenever any of them moves.
 *
 * The line endpoint is computed as the true live midpoint between the two member cards,
 * not the couple node's stored position — so dragging either card updates both lines.
 *
 * Solid pink for current, dashed red for divorced.
 */
export default function SpouseEdge({ id, source, target, data }) {
  const isDivorced = data?.status === 'divorced';
  const { member1Id, member2Id } = data ?? {};

  // Subscribe to all three nodes so any drag triggers a re-render of both edges
  const memberNode  = useInternalNode(source);
  const coupleNode  = useInternalNode(target);
  const member1Node = useInternalNode(member1Id);
  const member2Node = useInternalNode(member2Id);

  if (!memberNode || !coupleNode || !member1Node || !member2Node) return null;

  const mW  = memberNode.measured?.width  ?? 180;
  const mH  = memberNode.measured?.height ?? 80;
  const m1W = member1Node.measured?.width  ?? 180;
  const m1H = member1Node.measured?.height ?? 80;
  const m2W = member2Node.measured?.width  ?? 180;
  const m2H = member2Node.measured?.height ?? 80;

  const mPos  = memberNode.internals.positionAbsolute;
  const m1Pos = member1Node.internals.positionAbsolute;
  const m2Pos = member2Node.internals.positionAbsolute;
  const cPos  = coupleNode.internals.positionAbsolute;
  const cW    = coupleNode.measured?.width  ?? 40;
  const cH    = coupleNode.measured?.height ?? 40;

  // Live midpoint between the two member card centres
  const midX = (m1Pos.x + m1W / 2 + m2Pos.x + m2W / 2) / 2;
  const midY = (m1Pos.y + m1H / 2 + m2Pos.y + m2H / 2) / 2;

  // This member's centre X — determines which side the line exits from
  const memberCX = mPos.x + mW / 2;
  const memberIsLeft = memberCX <= midX;

  // Source: mid-left or mid-right of this member card
  const sx = memberIsLeft ? mPos.x + mW : mPos.x;
  const sy = mPos.y + mH / 2;

  // Target: the live midpoint (where the couple node visually should be)
  const tx = midX;
  const ty = midY;

  const d = `M ${sx} ${sy} L ${tx} ${ty}`;

  return (
    <path
      id={id}
      d={d}
      fill="none"
      stroke={isDivorced ? '#ef4444' : '#ec4899'}
      strokeWidth={2.5}
      strokeDasharray={isDivorced ? '7 4' : undefined}
      style={{ cursor: 'default' }}
    />
  );
}
