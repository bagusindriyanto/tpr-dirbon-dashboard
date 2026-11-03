import KanbanAside from '@/components/contents/KanbanAside';
import OutputContent from '@/components/contents/OutputContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Tab } from '@/types/tab';
import { useState } from 'react';

const TABS = [
  { value: 'tpr', label: 'TPR' },
  { value: 'dirbon', label: 'Dirbon' },
] as const satisfies { value: Tab; label: string }[];

function isTabValue(value: unknown): value is Tab {
  return TABS.some((tab) => tab.value === value);
}

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('tpr');

  return (
    <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <Tabs
        className="min-w-0"
        value={activeTab}
        onValueChange={(value) => {
          if (isTabValue(value)) setActiveTab(value);
        }}
      >
        <TabsList className="bg-background border">
          {TABS.map((tab) => (
            <TabsTrigger
              className="data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground"
              value={tab.value}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <OutputContent section={tab.value} />
          </TabsContent>
        ))}
      </Tabs>

      <KanbanAside />
    </div>
  );
}
