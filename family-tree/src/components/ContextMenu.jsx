import { useEffect, useRef } from 'react';
import { useFamilyTree } from '../FamilyTreeContext';

export default function ContextMenu() {
  const { contextMenu, closeContextMenu } = useFamilyTree();
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('scroll', closeContextMenu, true);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [closeContextMenu]);

  if (!contextMenu) return null;

  // Adjust position so menu stays within viewport
  const menuW = 260;
  const menuH = contextMenu.items.length * 38;
  let { x, y } = contextMenu;
  if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
  if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        zIndex: 2000,
        minWidth: menuW,
        overflow: 'hidden',
      }}
    >
      {contextMenu.items.map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, background: '#e5e7eb', margin: '2px 0' }} />
        ) : (
          <button
            key={i}
            onClick={item.disabled ? undefined : item.action}
            disabled={item.disabled}
            title={item.disabled ? item.label : undefined}
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 14px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: 13,
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              color: item.disabled ? '#9ca3af' : item.danger ? '#dc2626' : '#1f2937',
              fontWeight: item.danger ? 600 : 400,
              opacity: item.disabled ? 0.6 : 1,
              // Truncate long disabled labels gracefully
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 300,
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.target.style.background = item.danger ? '#fee2e2' : '#f3f4f6';
            }}
            onMouseLeave={(e) => (e.target.style.background = 'none')}
          >
            {item.disabled
              ? item.label.split('(')[0].trim()  // show just "💚 Reconcile", tooltip has full text
              : item.label}
          </button>
        )
      )}
    </div>
  );
}
