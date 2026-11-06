import React from 'react';
import { useHashRoute } from './router/useHashRoute.js';
import { HomeDashboard } from './components/home/HomeDashboard.jsx';
import { StudioLayout } from './components/studio/StudioLayout.jsx';
import { PublicLandingPage } from './components/public/PublicLandingPage.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

export default function App() {
  const { route, navigate } = useHashRoute();

  return (
    <ErrorBoundary>
      {route.page === 'home' && (
        <HomeDashboard onNavigate={navigate} />
      )}

      {route.page === 'studio' && (
        <StudioLayout
          projectId={route.projectId}
          activeWorkspace={route.workspace}
          onNavigate={navigate}
        />
      )}

      {route.page === 'public' && (
        <PublicLandingPage
          slug={route.slug}
          onNavigate={navigate}
        />
      )}
    </ErrorBoundary>
  );
}
