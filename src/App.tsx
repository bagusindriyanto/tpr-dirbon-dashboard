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
    <main className="min-h-dvh bg-muted p-3 sm:p-4 lg:p-6 2xl:p-8">
      <div className="mx-auto w-full max-w-[2400px]">
        <AppTitle />
        <div className="flex flex-col gap-3">
          <AppLegend />
          <AppFilter value={filter} onChange={setFilter} />
          <AppDashboard filter={filter} />
          <AppProblem filter={filter} />
        </div>
      </div>
    </main>
  );
}

export default App;
