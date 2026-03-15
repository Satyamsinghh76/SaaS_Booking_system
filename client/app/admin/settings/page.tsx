"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Building2,
  Clock,
  Globe,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Mail,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn, MotionCard } from "@/components/ui/motion"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast.success("Settings saved successfully")
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your business preferences and configuration
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </FadeIn>

      <SlideIn direction="up" delay={0.1}>
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {[
              { value: "business", label: "Business", icon: Building2 },
              { value: "booking", label: "Booking", icon: Clock },
              { value: "notifications", label: "Notifications", icon: Bell },
              { value: "payments", label: "Payments", icon: CreditCard },
              { value: "appearance", label: "Appearance", icon: Palette },
              { value: "security", label: "Security", icon: Shield },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 rounded-lg border bg-card px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" defaultValue="BookFlow Agency" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input id="email" type="email" defaultValue="hello@bookflow.io" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://bookflow.io" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    defaultValue="123 Business Street, Suite 100, San Francisco, CA 94102"
                  />
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Globe className="h-5 w-5 text-primary" />
                Localization
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      <SelectItem value="mst">Mountain Time (MT)</SelectItem>
                      <SelectItem value="cst">Central Time (CT)</SelectItem>
                      <SelectItem value="est">Eastern Time (ET)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select defaultValue="12h">
                    <SelectTrigger id="timeFormat">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="booking" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Clock className="h-5 w-5 text-primary" />
                Booking Rules
              </h2>
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minAdvance">Minimum Advance Booking</Label>
                    <Select defaultValue="24">
                      <SelectTrigger id="minAdvance">
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="2">2 hours</SelectItem>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="48">48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAdvance">Maximum Advance Booking</Label>
                    <Select defaultValue="30">
                      <SelectTrigger id="maxAdvance">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buffer">Buffer Between Appointments</Label>
                    <Select defaultValue="15">
                      <SelectTrigger id="buffer">
                        <SelectValue placeholder="Select minutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No buffer</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancellation">Cancellation Policy</Label>
                    <Select defaultValue="24">
                      <SelectTrigger id="cancellation">
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Anytime</SelectItem>
                        <SelectItem value="1">1 hour before</SelectItem>
                        <SelectItem value="24">24 hours before</SelectItem>
                        <SelectItem value="48">48 hours before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Rescheduling</Label>
                      <p className="text-sm text-muted-foreground">
                        Let customers reschedule their appointments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Confirmation</Label>
                      <p className="text-sm text-muted-foreground">
                        Manually confirm each booking before it becomes active
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Multiple Bookings</Label>
                      <p className="text-sm text-muted-foreground">
                        Let customers book multiple appointments at once
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Mail className="h-5 w-5 text-primary" />
                Email Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Confirmation</Label>
                    <p className="text-sm text-muted-foreground">
                      Send confirmation email when booking is made
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Reminder</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminder 24 hours before appointment
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cancellation Notice</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when a booking is cancelled
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reschedule Notice</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when a booking is rescheduled
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </MotionCard>

            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                Admin Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Booking Alert</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a new booking is made
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary of bookings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Report</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly analytics report
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Online Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments through the booking system
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Deposit</Label>
                    <p className="text-sm text-muted-foreground">
                      Require a deposit to confirm booking
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Deposit Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="25" className="w-24" />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Palette className="h-5 w-5 text-primary" />
                Branding
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed">
                      <span className="text-2xl font-bold text-primary">BF</span>
                    </div>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary" />
                    <Input defaultValue="#6366f1" className="w-32" />
                  </div>
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>
            </MotionCard>
          </TabsContent>
        </Tabs>
      </SlideIn>
    </div>
  )
}
