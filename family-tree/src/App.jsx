import { useEffect } from 'react';
import { FamilyTreeProvider, useFamilyTree } from './FamilyTreeContext';
import Toolbar from './components/Toolbar';
import EmptyState from './components/EmptyState';
import FamilyTreeCanvas from './components/FamilyTreeCanvas';
import ModalRenderer from './components/ModalRenderer';
import ContextMenu from './components/ContextMenu';
import Legend from './components/Legend';

function AppInner() {
  const { members, loading, error, refresh } = useFamilyTree();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Toolbar />

      {loading && members.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading…
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ color: '#dc2626', fontSize: 16 }}>⚠️ {error}</div>
          <button onClick={refresh} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      ) : members.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          <FamilyTreeCanvas />
          <Legend />
        </div>
      )}

      <ModalRenderer />
      <ContextMenu />
    </div>
  );
}

export default function App() {
  return (
    <FamilyTreeProvider>
      <AppInner />
    </FamilyTreeProvider>
  );
}
