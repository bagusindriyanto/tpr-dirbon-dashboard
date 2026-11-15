import { useEffect, useState } from 'react';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function useToday(): Date {
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const sync = () => {
      const next = startOfDay(new Date());
      setToday((prev) => (prev.getTime() === next.getTime() ? prev : next));
    };

    const interval = setInterval(sync, 60_000);

    return () => clearInterval(interval);
  }, []);

  return today;
}
