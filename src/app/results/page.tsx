// app/results/page.tsx
import { Suspense } from 'react';
import ResultsDisplay from './ResultsDisplay'; // Import the client component

// You can create a more sophisticated loading component if you like
function LoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-secondary">
      <p className="text-xl text-foreground">Loading Results...</p>
      {/* You could add a spinner here */}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsDisplay />
    </Suspense>
  );
}