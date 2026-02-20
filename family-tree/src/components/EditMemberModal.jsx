import { useState } from 'react';
import Modal from './Modal';
import MemberForm from './MemberForm';
import { useFamilyTree } from '../FamilyTreeContext';
import * as api from '../api';

export default function EditMemberModal({ member }) {
  const { closeModal, refresh } = useFamilyTree();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      await api.updateMember(member.id, payload);
      await refresh();
      closeModal();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Edit — ${member.firstName} ${member.lastName}`} onClose={closeModal}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
          {error}
        </div>
      )}
      <MemberForm initial={member} onSubmit={handleSubmit} submitLabel="Save Changes" loading={loading} />
    </Modal>
  );
}
