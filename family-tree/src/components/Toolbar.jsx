import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

export default function Toolbar() {
  const { openModal, refresh, members } = useFamilyTree();

  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-tree.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        await api.importData(parsed);
        await refresh();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  const handleClear = async () => {
    if (!window.confirm('Clear ALL data? This cannot be undone.')) return;
    try {
      await api.clearData();
      await refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: '#1f2937',
        borderBottom: '1px solid #374151',
        flexShrink: 0,
      }}
    >
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginRight: 8 }}>🌳 Family Tree</span>

      <div style={{ flex: 1 }} />

      <Btn onClick={() => openModal('addMember')} color="#3b82f6">
        ➕ Add Member
      </Btn>
      <Btn onClick={handleImport} color="#6b7280">
        📥 Import
      </Btn>
      <Btn onClick={handleExport} color="#6b7280" disabled={members.length === 0}>
        📤 Export
      </Btn>
      <Btn onClick={handleClear} color="#dc2626" disabled={members.length === 0}>
        🗑️ Clear All
      </Btn>
    </div>
  );
}

function Btn({ children, onClick, color, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color,
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
