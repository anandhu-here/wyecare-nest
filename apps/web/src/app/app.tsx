import { Suspense } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routing/routes';

// You can add global error boundary and loading component
const LoadingFallback = () => (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center">
    <div>Loading application...</div>
  </div>
);

// Create the router instance
const router = createBrowserRouter(routes);

export function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;