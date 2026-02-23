import { createContext, useContext, useState, useCallback } from 'react';
import * as api from './api';

const Ctx = createContext(null);

export function FamilyTreeProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [rootMemberId, setRootMemberId] = useState(null);
  const [selfMemberId, setSelfMemberId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected member (ego) for point-of-view layout.
  // Stored here so refresh() can auto-default it to self.
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch members and tree metadata in parallel
      const [membersData, treeData] = await Promise.all([
        api.listMembers(),
        api.getTree(),
      ]);
      setMembers(membersData.members);
      setRootMemberId(membersData.rootMemberId);

      const newSelfId = treeData.selfMemberId ?? null;
      setSelfMemberId(newSelfId);

      // Auto-select self as ego on first load only (don't override a user's
      // explicit mid-session choice).
      setSelectedMemberId((prev) => {
        if (prev !== null) return prev;   // user already chose someone
        return newSelfId ?? null;         // default to self (or null)
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set (or clear) which member represents "me". Pass null to unmark.
  const setSelfMember = useCallback(async (memberId) => {
    try {
      const data = await api.setSelf(memberId);
      const newSelfId = data.selfMemberId ?? null;
      setSelfMemberId(newSelfId);
      // If we just cleared self and it was also the current ego, clear ego too
      if (newSelfId === null) {
        setSelectedMemberId((prev) => (prev === memberId ? null : prev));
      }
    } catch (e) {
      alert(e.message);
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

  const selectMember = useCallback((id) => {
    setSelectedMemberId((prev) => (prev === id ? null : id)); // toggle off if same
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const value = {
    members,
    rootMemberId,
    selfMemberId,
    loading,
    error,
    refresh,
    setSelfMember,
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
