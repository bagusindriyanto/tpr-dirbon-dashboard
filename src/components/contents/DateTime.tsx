import { useEffect, useState } from 'react';

export default function DateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeDisplay = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).format(now);

  const dateDisplay = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  return (
    <div className="flex flex-col sm:flex-row justify-center sm:justify-between sm:items-end mt-3 mb-2 px-2">
      <h2 className="font-bold text-3xl text-center sm:text-start">
        {timeDisplay}
      </h2>
      <h3 className="font-inter font-light text-xl text-center sm:text-end">
        {dateDisplay}
      </h3>
    </div>
  );
}
