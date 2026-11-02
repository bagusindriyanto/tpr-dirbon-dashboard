import { isWithinShift } from '@/lib/shift';
import { useEffect, useState } from 'react';

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function DateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeDisplay = timeFormat.format(now);
  const dateDisplay = dateFormat.format(now);

  const shiftDisplay = isWithinShift('1', now) ? 'Shift 1' : 'Shift 2';

  return (
    <div className="flex justify-between sm:items-end mt-3 mb-2 px-2">
      <div className="text-start">
        <h2 className="font-bold text-2xl sm:text-3xl tabular-nums">
          {timeDisplay}
        </h2>
        <h3 className="font-light text-lg sm:text-xl">{dateDisplay}</h3>
      </div>
      <div className="text-end">
        <h2 className="font-bold text-2xl sm:text-3xl tabular-nums">
          {shiftDisplay}
        </h2>
        <h3 className="font-light text-lg sm:text-xl">Jam ke-1</h3>
      </div>
    </div>
  );
}
