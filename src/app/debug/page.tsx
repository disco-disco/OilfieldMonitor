import ConnectionDebugger from '@/components/ConnectionDebugger';
import DirectConnectionTester from '@/components/DirectConnectionTester';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ConnectionDebugger />
      <div className="max-w-4xl mx-auto">
        <DirectConnectionTester />
      </div>
    </div>
  );
}
