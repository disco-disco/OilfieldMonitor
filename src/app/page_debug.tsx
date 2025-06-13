'use client';

import { useState, useEffect } from 'react';

export default function HomeDebug() {
  console.log('🏠 DEBUG Home component is rendering!');
  const [data, setData] = useState<string>('initial');

  console.log('🔄 About to register useEffect hook DEBUG');

  useEffect(() => {
    console.log('🔄 DEBUG useEffect triggered!');
    setData('loaded via useEffect');
  }, []);

  console.log('🔄 About to return JSX DEBUG');

  return (
    <div>
      <h1>DEBUG PAGE</h1>
      <p>Data: {data}</p>
    </div>
  );
}
