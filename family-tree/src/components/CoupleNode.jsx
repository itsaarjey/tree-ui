/**
 * Invisible couple node — acts as a midpoint anchor between two spouses.
 * Renders a small heart icon on hover. Right-click opens spouse relation menu.
 */
import { useCallback, useState, useEffect, useRef } from 'react';
import { Handle, Position, useInternalNode, useReactFlow } from '@xyflow/react';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

export default function CoupleNode({ id: nodeId, data }) {
  const { member1Id, member2Id, relationId, status } = data;
  const { openContextMenu, openModal, refresh, closeContextMenu, members } = useFamilyTree();
  const { setNodes } = useReactFlow();

  // Subscribe to both member positions so we can snap to the midpoint
  const m1Node = useInternalNode(member1Id);
  const m2Node = useInternalNode(member2Id);
  const [hovered, setHovered] = useState(false);

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // UI-side reconcile eligibility check:
      // Neither spouse may have a *different* current spouse relation.
      // (The API enforces this too, but we disable the option proactively.)
      const m1 = members.find((m) => m.id === member1Id);
      const m2 = members.find((m) => m.id === member2Id);
      const m1HasOtherCurrentSpouse = (m1?.spouses ?? []).some(
        (s) => s.status === 'current' && s.id !== relationId
      );
      const m2HasOtherCurrentSpouse = (m2?.spouses ?? []).some(
        (s) => s.status === 'current' && s.id !== relationId
      );
      const canReconcile = status === 'divorced' && !m1HasOtherCurrentSpouse && !m2HasOtherCurrentSpouse;

      const items = [
        {
          label: '👶 Add child of both',
          action: () => {
            closeContextMenu();
            openModal('addChild', { parentId: member1Id, parent2Id: member2Id });
          },
        },
        { separator: true },
        ...(status === 'current'
          ? [
              {
                label: '💔 Mark as divorced',
                action: async () => {
                  closeContextMenu();
                  if (!window.confirm('Mark this couple as divorced?')) return;
                  try {
                    await api.divorceSpouse(relationId);
                    await refresh();
                  } catch (err) {
                    alert(err.message);
                  }
                },
              },
            ]
          : []),
        ...(status === 'divorced'
          ? [
              {
                label: canReconcile
                  ? '💚 Reconcile (undo divorce)'
                  : '💚 Reconcile (blocked — a spouse has another current partner)',
                disabled: !canReconcile,
                action: async () => {
                  if (!canReconcile) return;
                  closeContextMenu();
                  if (!window.confirm('Restore this couple as current spouses?')) return;
                  try {
                    await api.reconcileSpouse(relationId);
                    await refresh();
                  } catch (err) {
                    alert(err.message);
                  }
                },
              },
            ]
          : []),
        { separator: true },
        {
          label: '🗑️ Remove spouse relation',
          danger: true,
          action: async () => {
            closeContextMenu();
            if (!window.confirm('Remove this spouse relationship entirely?')) return;
            try {
              await api.removeSpouse(relationId);
              await refresh();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ];

      openContextMenu(e.clientX, e.clientY, items);
    },
    [member1Id, member2Id, relationId, status, members, openContextMenu, openModal, refresh, closeContextMenu]
  );

  const isDivorced = status === 'divorced';
  const color = isDivorced ? '#ef4444' : '#ec4899';
  const bg = isDivorced ? '#fca5a5' : '#fbcfe8';

  // Compute target midpoint
  const midPos = (() => {
    if (!m1Node || !m2Node) return null;
    const m1W = m1Node.measured?.width  ?? 180;
    const m1H = m1Node.measured?.height ?? 80;
    const m2W = m2Node.measured?.width  ?? 180;
    const m2H = m2Node.measured?.height ?? 80;
    const m1P = m1Node.internals.positionAbsolute;
    const m2P = m2Node.internals.positionAbsolute;
    return {
      x: (m1P.x + m1W / 2 + m2P.x + m2W / 2) / 2 - 20,
      y: (m1P.y + m1H / 2 + m2P.y + m2H / 2) / 2 - 20,
    };
  })();

  // Snap couple node position in an effect to avoid setState-during-render
  const lastMidRef = useRef(null);
  useEffect(() => {
    if (!midPos) return;
    const last = lastMidRef.current;
    // Only update if position actually changed (avoid infinite loop)
    if (last && Math.abs(last.x - midPos.x) < 0.5 && Math.abs(last.y - midPos.y) < 0.5) return;
    lastMidRef.current = midPos;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, position: { x: midPos.x, y: midPos.y } } : n
      )
    );
  }, [midPos?.x, midPos?.y, nodeId, setNodes]);

  return (
    // Outer wrapper: large transparent hit area (40×40) for easy dragging + right-click
    <div
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Right-click for options (${isDivorced ? 'divorced' : 'current'})`}
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Handles positioned relative to the outer 40×40 wrapper */}
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Right} id="right" style={{ opacity: 0, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 8, height: 8 }} />

      {/* Visual circle */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: bg,
          border: `2px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          boxShadow: hovered ? `0 0 0 4px ${color}44` : '0 1px 4px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.15s',
          pointerEvents: 'none', // let the outer div handle all events
        }}
      >
        {isDivorced ? '✂' : '♥'}
      </div>
    </div>
  );
}
