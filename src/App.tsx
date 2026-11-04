import AppDashboard from './layouts/AppDashboard';
import AppFilter from './layouts/AppFilter';
import AppLegend from './layouts/AppLegend';
import AppProblem from './layouts/AppProblem';
import AppTitle from './layouts/AppTitle';
import type { GetDataFilter } from './types/output';
import { useState } from 'react';

function App() {
  const [filter, setFilter] = useState<GetDataFilter>({});

  return (
    <main className="min-h-screen bg-muted p-6">
      <AppTitle />
      <div className="flex flex-col gap-3">
        <AppLegend />
        <AppFilter value={filter} onChange={setFilter} />
        <AppDashboard filter={filter} />
        <AppProblem filter={filter} />
      </div>
    </main>
  );
}

export default App;
