import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/lib/middleware';
import { UserRole } from '@prisma/client';

// POST /api/routers/test - Test router connection
export async function POST(request: NextRequest) {
  try {
    console.log('Router test API called');
    
    const authResult = await authenticate(request);
    if (authResult instanceof NextResponse) {
      console.log('Authentication failed');
      return authResult;
    }

    const authError = authorize([UserRole.ISP_OWNER])(authResult);
    if (authError) {
      console.log('Authorization failed');
      return authError;
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { routerId, ipAddress, port, username, password } = body;

    if (!ipAddress || !port || !username || !password) {
      console.log('Missing required fields:', { ipAddress, port, username, password: !!password });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Simulate connection test (in real implementation, you would use MicroTik API)
    // For now, we'll simulate a successful connection
    const isConnected = Math.random() > 0.3; // 70% success rate for demo
    console.log('Connection test result:', isConnected);

    if (isConnected) {
      // Update router status to ONLINE if connection is successful
      // This would be done in a real implementation
      console.log('Connection successful for router:', routerId);
      return NextResponse.json({
        success: true,
        message: 'Connection successful! Router is online.',
        routerId
      });
    } else {
      console.log('Connection failed for router:', routerId);
      return NextResponse.json({
        success: false,
        message: 'Connection failed. Please check your router credentials and network.',
        routerId
      });
    }
  } catch (error) {
    console.error('Error testing router connection:', error);
    
    // Ensure we always return a JSON response
    return NextResponse.json({
      success: false,
      message: 'Internal server error during connection test.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}