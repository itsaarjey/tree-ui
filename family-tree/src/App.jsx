import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { FamilyTreeProvider, useFamilyTree } from './FamilyTreeContext';
import Toolbar from './components/Toolbar';
import EmptyState from './components/EmptyState';
import FamilyTreeCanvas from './components/FamilyTreeCanvas';
import ModalRenderer from './components/ModalRenderer';
import ContextMenu from './components/ContextMenu';
import Legend from './components/Legend';
import { setTokenGetter } from './api';

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
  const { isLoading, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const path = window.location.pathname;

  // /logout is a static page — Auth0 redirects here after logout completes.
  if (path === '/logout') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}>
        You have been signed out.
      </div>
    );
  }

  // Auth0Provider processes the ?code= exchange during isLoading.
  // Show a spinner for both the initial load AND the /callback redirect.
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {path === '/callback' ? 'Signing in…' : 'Loading…'}
      </div>
    );
  }

  if (!isAuthenticated) {
    loginWithRedirect();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Redirecting to login…
      </div>
    );
  }

  // Wire the Auth0 token getter into the API layer
  setTokenGetter(getAccessTokenSilently);

  return (
    <FamilyTreeProvider>
      <AppInner />
    </FamilyTreeProvider>
  );
}
