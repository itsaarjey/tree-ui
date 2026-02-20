const BASE = import.meta.env.VITE_API_BASE ?? '';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json.data;
}

// Members
export const listMembers = () => request('GET', '/api/members');
export const createMember = (body) => request('POST', '/api/members', body);
export const updateMember = (id, body) => request('PUT', `/api/members/${id}`, body);
export const deleteMember = (id) => request('DELETE', `/api/members/${id}`);

// Per-member relations
export const getMemberSpouses = (id) => request('GET', `/api/members/${id}/spouses`);
export const getMemberParents = (id) => request('GET', `/api/members/${id}/parents`);
export const getMemberChildren = (id) => request('GET', `/api/members/${id}/children`);

// Relationships
export const linkChild = (body) => request('POST', '/api/relationships/link-child', body);
export const linkSpouse = (body) => request('POST', '/api/relationships/link-spouse', body);
export const unlinkParent = (childId) => request('DELETE', `/api/relationships/parent/${childId}`);
export const removeSpouse = (relationId) => request('DELETE', '/api/relationships/spouse', { relationId });
export const divorceSpouse = (relationId) => request('PUT', '/api/relationships/divorce', { relationId });
export const reconcileSpouse = (relationId) => request('PUT', '/api/relationships/reconcile', { relationId });

// Tree root
export const getRoot = () => request('GET', '/api/tree/root');
export const setRoot = (rootMemberId) => request('PUT', '/api/tree/root', { rootMemberId });

// Eligibility
export const eligibleSpouses = (memberId) => request('GET', `/api/eligibility/spouses/${memberId}`);
export const eligibleParents = (childId) => request('GET', `/api/eligibility/parents/${childId}`);
export const eligibleChildren = (parentId) => request('GET', `/api/eligibility/children/${parentId}`);

// Data
export const exportData = () => request('GET', '/api/export');
export const importData = (body) => request('POST', '/api/import', body);
export const clearData = () => request('DELETE', '/api/clear');
