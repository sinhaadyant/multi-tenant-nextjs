import { NextRequest } from 'next/server';
import { createServer } from 'http';
import notificationServer from '@/lib/websocket-server';

// This is a placeholder route for WebSocket connections
// The actual WebSocket server is initialized in the Next.js server
export async function GET(req: NextRequest) {
  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export async function POST(req: NextRequest) {
  return new Response('WebSocket endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
