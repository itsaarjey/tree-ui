import { useState } from 'react';
import Modal from './Modal';
import MemberForm from './MemberForm';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

export default function AddMemberModal() {
  const { closeModal, refresh } = useFamilyTree();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      await api.createMember(payload);
      await refresh();
      closeModal();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Family Member" onClose={closeModal}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}
      <MemberForm onSubmit={handleSubmit} submitLabel="Add Member" loading={loading} />
    </Modal>
  );
}
