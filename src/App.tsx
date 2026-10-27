import AppDashboard from './layouts/AppDashboard';
import AppLegend from './layouts/AppLegend';
import AppProblem from './layouts/AppProblem';
import AppTitle from './layouts/AppTitle';

function App() {
  return (
    <main className="min-h-screen bg-muted p-6">
      <AppTitle />
      <AppLegend />
      <AppDashboard />
      <AppProblem />
    </main>
  );
}

export default App;
