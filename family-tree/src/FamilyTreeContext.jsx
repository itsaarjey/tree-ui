import { createContext, useContext, useState, useCallback } from 'react';
import * as api from './api';

const Ctx = createContext(null);

export function FamilyTreeProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [rootMemberId, setRootMemberId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listMembers();
      setMembers(data.members);
      setRootMemberId(data.rootMemberId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Modal state
  const [modal, setModal] = useState(null); // { type, props }

  const openModal = useCallback((type, props = {}) => {
    setModal({ type, props });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null); // { x, y, items[] }

  const openContextMenu = useCallback((x, y, items) => {
    setContextMenu({ x, y, items });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Selected member (ego) for point-of-view layout
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const selectMember = useCallback((id) => {
    setSelectedMemberId((prev) => (prev === id ? null : id)); // toggle off if same
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const value = {
    members,
    rootMemberId,
    loading,
    error,
    refresh,
    modal,
    openModal,
    closeModal,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    selectedMemberId,
    selectMember,
    clearSelection,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFamilyTree() {
  return useContext(Ctx);
}
