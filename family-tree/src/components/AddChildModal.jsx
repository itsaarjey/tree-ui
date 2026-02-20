import { useState, useEffect } from 'react';
import Modal from './Modal';
import MemberForm from './MemberForm';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

/**
 * parentId  — the primary parent (always supplied)
 * parent2Id — the secondary parent (supplied when called from a couple node)
 */
export default function AddChildModal({ parentId, parent2Id }) {
  const { closeModal, refresh, members } = useFamilyTree();
  const [mode, setMode] = useState('choose');
  const [eligible, setEligible] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parent = members.find((m) => m.id === parentId);
  const parent2 = parent2Id ? members.find((m) => m.id === parent2Id) : null;

  useEffect(() => {
    // We query eligible children from parent1's perspective.
    // The API will filter correctly.
    if (mode === 'existing') {
      setLoadingEligible(true);
      api.eligibleChildren(parentId)
        .then((d) => setEligible(d.eligible))
        .catch((e) => setError(e.message))
        .finally(() => setLoadingEligible(false));
    }
  }, [mode, parentId]);

  const doLink = async (childId) => {
    setLoading(true);
    setError(null);
    try {
      // First link parent1 → child
      const body = { parentId, childId };
      if (parent2Id) body.parent2Id = parent2Id;
      await api.linkChild(body);
      await refresh();
      closeModal();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleCreateAndLink = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await api.createMember(payload);
      const body = { parentId, childId: newMember.id };
      if (parent2Id) body.parent2Id = parent2Id;
      await api.linkChild(body);
      await refresh();
      closeModal();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const parentLabel = parent
    ? parent2
      ? `${parent.firstName} & ${parent2.firstName}`
      : parent.firstName + ' ' + parent.lastName
    : 'Parent';

  const title = `Add Child of ${parentLabel}`;

  return (
    <Modal title={title} onClose={closeModal}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {parent2Id && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#1d4ed8' }}>
          Child will be linked to both <strong>{parent?.firstName}</strong> and <strong>{parent2?.firstName}</strong> as parents.
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>How would you like to add a child?</p>
          <button onClick={() => setMode('new')} style={btnStyle('#3b82f6')}>
            ➕ Create new family member as child
          </button>
          <button onClick={() => setMode('existing')} style={btnStyle('#10b981')}>
            🔗 Link an existing family member as child
          </button>
        </div>
      )}

      {mode === 'new' && (
        <>
          <button onClick={() => setMode('choose')} style={backBtn}>← Back</button>
          <MemberForm onSubmit={handleCreateAndLink} submitLabel="Create & Link as Child" loading={loading} />
        </>
      )}

      {mode === 'existing' && (
        <>
          <button onClick={() => setMode('choose')} style={backBtn}>← Back</button>
          {loadingEligible ? (
            <p style={{ color: '#6b7280' }}>Loading eligible members…</p>
          ) : eligible.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No eligible members available to link as child.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {eligible.map((m) => (
                <button
                  key={m.id}
                  onClick={() => doLink(m.id)}
                  disabled={loading}
                  style={memberBtn}
                >
                  <span style={{ fontWeight: 600 }}>{m.firstName} {m.lastName}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {m.birthDate || '?'} · {m.gender}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

const btnStyle = (bg) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
});

const backBtn = {
  background: 'none',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: 13,
  padding: '0 0 12px 0',
  display: 'block',
};

const memberBtn = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  background: '#f9fafb',
  cursor: 'pointer',
  fontSize: 14,
  textAlign: 'left',
};
