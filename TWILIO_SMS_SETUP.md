'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';

interface SMSPreferences {
  enable_confirmations: boolean;
  enable_reminders: boolean;
  enable_cancellations: boolean;
  enable_payment_notifications: boolean;
}

export default function SMSPreferences() {
  const [preferences, setPreferences] = useState<SMSPreferences>({
    enable_confirmations: true,
    enable_reminders: true,
    enable_cancellations: true,
    enable_payment_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/sms/preferences');
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch SMS preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: SMSPreferences) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put('/sms/preferences', newPreferences);
      if (response.data.success) {
        setPreferences(response.data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof SMSPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferences(newPreferences);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              SMS preferences updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="confirmations">Booking Confirmations</Label>
              <p className="text-sm text-gray-500">
                Receive SMS when your booking is confirmed
              </p>
            </div>
            <Switch
              id="confirmations"
              checked={preferences.enable_confirmations}
              onCheckedChange={(checked) => 
                handleToggle('enable_confirmations', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reminders">Appointment Reminders</Label>
              <p className="text-sm text-gray-500">
                Get reminder SMS before your appointments
              </p>
            </div>
            <Switch
              id="reminders"
              checked={preferences.enable_reminders}
              onCheckedChange={(checked) => 
                handleToggle('enable_reminders', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="cancellations">Cancellation Notices</Label>
              <p className="text-sm text-gray-500">
                Receive SMS when bookings are cancelled
              </p>
            </div>
            <Switch
              id="cancellations"
              checked={preferences.enable_cancellations}
              onCheckedChange={(checked) => 
                handleToggle('enable_cancellations', checked)
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="payments">Payment Notifications</Label>
              <p className="text-sm text-gray-500">
                Get SMS when payments are processed
              </p>
            </div>
            <Switch
              id="payments"
              checked={preferences.enable_payment_notifications}
              onCheckedChange={(checked) => 
                handleToggle('enable_payment_notifications', checked)
              }
              disabled={saving}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-gray-500 space-y-2">
            <p>
              <strong>Message rates may apply.</strong> Standard messaging rates from your carrier may apply.
            </p>
            <p>
              Reply STOP to unsubscribe from SMS notifications at any time.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
