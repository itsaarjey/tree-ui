import { getStraightPath } from '@xyflow/react';
import { useFamilyTree } from '../FamilyTreeContext';
import { useCallback } from 'react';
import * as api from '../api';

/**
 * Parent-child edge. Right-click to unlink.
 */
export default function ParentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}) {
  const { openContextMenu, refresh, closeContextMenu } = useFamilyTree();

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const items = [
        {
          label: '🔗 Unlink parent(s)',
          danger: true,
          action: async () => {
            closeContextMenu();
            if (!window.confirm('Remove all parent links from this child?')) return;
            try {
              await api.unlinkParent(data.childId);
              await refresh();
            } catch (err) {
              alert(err.message);
            }
          },
        },
      ];
      openContextMenu(e.clientX, e.clientY, items);
    },
    [data, openContextMenu, refresh, closeContextMenu]
  );

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="#6b7280"
        strokeWidth={2}
        markerEnd="url(#arrowclosed)"
        onContextMenu={handleContextMenu}
        style={{ cursor: 'context-menu' }}
      />
    </>
  );
}
