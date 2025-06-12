import ConnectionDebugger from '@/components/ConnectionDebugger';
import DirectConnectionTester from '@/components/DirectConnectionTester';
import HybridConnectionTester from '@/components/HybridConnectionTester';
import SimpleConnectionTester from '@/components/SimpleConnectionTester';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6">
        <SimpleConnectionTester />
      </div>
      <ConnectionDebugger />
      <div className="max-w-4xl mx-auto">
        <HybridConnectionTester />
        <DirectConnectionTester />
      </div>
    </div>
  );
}
