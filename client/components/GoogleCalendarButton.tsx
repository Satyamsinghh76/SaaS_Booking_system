'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';

interface GoogleCalendarButtonProps {
  bookingId?: string;
  onConnected?: () => void;
}

export default function GoogleCalendarButton({ bookingId, onConnected }: GoogleCalendarButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get Google OAuth URL
      const response = await api.get('/calendar/oauth/url');
      if (response.data.success) {
        // Redirect to Google OAuth
        window.location.href = response.data.url;
      } else {
        setError('Failed to connect to Google Calendar');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/calendar/status');
      if (response.data.success) {
        setIsConnected(response.data.connected);
      }
    } catch (err) {
      console.error('Failed to check calendar status:', err);
    }
  };

  // Check connection status on mount
  React.useEffect(() => {
    checkConnectionStatus();
  }, []);

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Google Calendar Connected
              </p>
              <p className="text-sm text-green-600">
                Events will be automatically created for new bookings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            Connect your Google Calendar to automatically create events when bookings are confirmed.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Automatic event creation</li>
            <li>Booking details included</li>
            <li>Real-time synchronization</li>
            <li>No manual entry required</li>
          </ul>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleConnectGoogle}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Connecting to Google...
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-2 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              Connect Google Calendar
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          By connecting, you authorize BookFlow to access your Google Calendar
        </div>
      </CardContent>
    </Card>
  );
}
