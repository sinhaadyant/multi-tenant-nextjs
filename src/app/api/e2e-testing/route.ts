import { NextRequest, NextResponse } from 'next/server';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
  message: string;
  timestamp: string;
  details?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, modules } = await request.json();
    
    if (action === 'run-tests') {
      // Start the E2E test process
      const { spawn } = require('child_process');
      
      // Pass selected modules as arguments
      const args = ['scripts/run-tenant-e2e-tests.js'];
      if (modules && modules.length > 0) {
        args.push('--modules', modules.join(','));
      }
      
      const testProcess = spawn('node', args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      
      testProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      
      testProcess.stderr.on('data', (data: Buffer) => {
        output += data.toString();
      });
      
      testProcess.on('close', (code: number) => {
        console.log(`E2E test process exited with code ${code}`);
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `E2E tests started for modules: ${modules ? modules.join(', ') : 'all'}. Check the browser window for real-time execution.`,
        testId: Date.now().toString(),
        selectedModules: modules || []
      });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid action' });
    
  } catch (error) {
    console.error('E2E Testing API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'E2E Testing API is running',
    endpoints: {
      'POST /api/e2e-testing': 'Run E2E tests',
      'GET /api/e2e-testing': 'Get API status'
    }
  });
} 