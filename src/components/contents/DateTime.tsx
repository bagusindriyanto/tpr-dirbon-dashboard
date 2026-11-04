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

  return (
    <div className="flex flex-col">
      <h2 className="font-bold text-xl sm:text-2xl tabular-nums">
        {timeDisplay}
      </h2>
      <h3 className="font-light sm:text-lg">{dateDisplay}</h3>
    </div>
  );
}
