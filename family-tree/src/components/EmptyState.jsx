import { useFamilyTree } from '../FamilyTreeContext';

export default function EmptyState() {
  const { openModal } = useFamilyTree();

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: '#f9fafb',
        color: '#374151',
      }}
    >
      <div style={{ fontSize: 64 }}>🌳</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#111827' }}>
        Start Your Family Tree
      </h1>
      <p style={{ margin: 0, fontSize: 16, color: '#6b7280', maxWidth: 380, textAlign: 'center' }}>
        Add the first family member (the root) to begin building your tree.
      </p>
      <button
        onClick={() => openModal('addMember')}
        style={{
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '14px 32px',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
        }}
      >
        ➕ Add Root Member
      </button>
    </div>
  );
}
