import React, { Suspense, lazy } from 'react';
import { useHashRoute } from './router/useHashRoute.js';
import { WelcomeIntro } from './components/welcome/WelcomeIntro.jsx';
import { HomeDashboard } from './components/home/HomeDashboard.jsx';
import { PublicLandingPage } from './components/public/PublicLandingPage.jsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx';

const StudioLayout = lazy(() =>
  import('./components/studio/StudioLayout.jsx').then((m) => ({ default: m.StudioLayout }))
);

export default function App() {
  const { route, navigate } = useHashRoute();

  return (
    <ErrorBoundary>
      {route.page === 'welcome' && (
        <WelcomeIntro onNavigate={navigate} />
      )}

      {route.page === 'home' && (
        <HomeDashboard onNavigate={navigate} />
      )}

      {route.page === 'studio' && (
        <Suspense fallback={null}>
          <StudioLayout
            key={route.projectId}
            projectId={route.projectId}
            activeWorkspace={route.workspace}
            onNavigate={navigate}
          />
        </Suspense>
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
