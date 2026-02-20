import { useState, useEffect } from 'react';
import Modal from './Modal';
import MemberForm from './MemberForm';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

export default function AddSpouseModal({ memberId }) {
  const { closeModal, refresh, members } = useFamilyTree();
  const [mode, setMode] = useState('choose'); // 'choose' | 'new' | 'existing'
  const [eligible, setEligible] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const member = members.find((m) => m.id === memberId);

  useEffect(() => {
    if (mode === 'existing') {
      setLoadingEligible(true);
      api.eligibleSpouses(memberId)
        .then((d) => setEligible(d.eligible))
        .catch((e) => setError(e.message))
        .finally(() => setLoadingEligible(false));
    }
  }, [mode, memberId]);

  const linkSpouse = async (spouseId) => {
    setLoading(true);
    setError(null);
    try {
      await api.linkSpouse({ memberId, spouseId });
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
      await api.linkSpouse({ memberId, spouseId: newMember.id });
      await refresh();
      closeModal();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const title = member ? `Add Spouse for ${member.firstName} ${member.lastName}` : 'Add Spouse';

  return (
    <Modal title={title} onClose={closeModal}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>How would you like to add a spouse?</p>
          <button onClick={() => setMode('new')} style={btnStyle('#3b82f6')}>
            ➕ Create new family member as spouse
          </button>
          <button onClick={() => setMode('existing')} style={btnStyle('#10b981')}>
            🔗 Link an existing family member
          </button>
        </div>
      )}

      {mode === 'new' && (
        <>
          <button onClick={() => setMode('choose')} style={backBtn}>← Back</button>
          <MemberForm onSubmit={handleCreateAndLink} submitLabel="Create & Link as Spouse" loading={loading} />
        </>
      )}

      {mode === 'existing' && (
        <>
          <button onClick={() => setMode('choose')} style={backBtn}>← Back</button>
          {loadingEligible ? (
            <p style={{ color: '#6b7280' }}>Loading eligible members…</p>
          ) : eligible.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No eligible members available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {eligible.map((m) => (
                <button
                  key={m.id}
                  onClick={() => linkSpouse(m.id)}
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
