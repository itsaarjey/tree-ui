import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

function genderColor(gender) {
  if (gender === 'male') return '#dbeafe';
  if (gender === 'female') return '#fce7f3';
  return '#f3f4f6';
}

function genderBorder(gender) {
  if (gender === 'male') return '#3b82f6';
  if (gender === 'female') return '#ec4899';
  return '#6b7280';
}

export default function MemberNode({ data, id }) {
  const { member } = data;
  const { openContextMenu, openModal, refresh, closeContextMenu } = useFamilyTree();

  const hasCurrentSpouse = (member.spouses || []).some((s) => s.status === 'current');

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const items = [
        {
          label: '✏️ Edit member',
          action: () => {
            closeContextMenu();
            openModal('editMember', { member });
          },
        },
        ...(!hasCurrentSpouse
          ? [{
              label: '💍 Add spouse',
              action: () => {
                closeContextMenu();
                openModal('addSpouse', { memberId: member.id });
              },
            }]
          : []),
        {
          label: '👶 Add child',
          action: () => {
            closeContextMenu();
            openModal('addChild', { parentId: member.id, parent2Id: null });
          },
        },
        { separator: true },
        {
          label: '🗑️ Delete member',
          danger: true,
          action: async () => {
            closeContextMenu();
            if (!window.confirm(`Delete ${member.firstName} ${member.lastName}? This cannot be undone.`)) return;
            try {
              await api.deleteMember(member.id);
              await refresh();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ];

      openContextMenu(e.clientX, e.clientY, items);
    },
    [member, hasCurrentSpouse, openContextMenu, openModal, refresh, closeContextMenu]
  );

  const bg = genderColor(member.gender);
  const border = genderBorder(member.gender);
  const isDead = !!member.deathDate;

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 10,
        padding: '8px 12px',
        minWidth: 160,
        maxWidth: 200,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'context-menu',
        opacity: isDead ? 0.75 : 1,
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top: receives parent→child arrows */}
      <Handle type="target" position={Position.Top} style={{ background: border, width: 10, height: 10 }} />
      {/* Bottom: sends parent→child arrows */}
      <Handle type="source" position={Position.Bottom} style={{ background: border, width: 10, height: 10 }} />
      {/* Left side: spouse connection (source handle, id="left") */}
      <Handle type="source" position={Position.Left} id="left" style={{ background: border, width: 10, height: 10, top: '50%' }} />
      {/* Right side: spouse connection (source handle, id="right") */}
      <Handle type="source" position={Position.Right} id="right" style={{ background: border, width: 10, height: 10, top: '50%' }} />

      <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {member.firstName} {member.lastName}
        {isDead && ' †'}
      </div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
        {member.birthDate || '?'}{member.deathDate ? ` – ${member.deathDate}` : ''}
      </div>
      {member.notes && (
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.notes}
        </div>
      )}
      <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 10, color: border }}>
        {member.gender === 'male' ? '♂' : member.gender === 'female' ? '♀' : '⚧'}
      </div>
    </div>
  );
}
