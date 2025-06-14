'use client';

import { useState, useEffect } from 'react';

export default function MinimalHome() {
  console.log('🚀 MINIMAL PAGE: Component is rendering');
  console.log('🚀 MINIMAL PAGE: typeof window:', typeof window);
  
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('🧪 MINIMAL PAGE: useEffect is executing!');
    console.log('🧪 MINIMAL PAGE: typeof window in useEffect:', typeof window);
    setCount(1);
  }, []);

  console.log('🚀 MINIMAL PAGE: About to return JSX, count:', count);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Minimal Test Page</h1>
      <p>Count: {count}</p>
      <p>Window available: {typeof window !== 'undefined' ? 'Yes' : 'No'}</p>
    </div>
  );
}
