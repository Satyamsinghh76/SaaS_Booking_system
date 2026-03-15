"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Bell, Shield, CreditCard, Save, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FadeIn, SlideIn, MotionCard } from "@/components/ui/motion"
import { toast } from "sonner"

export default function UserSettingsPage() {
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
              Manage your account preferences
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
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {[
              { value: "profile", label: "Profile", icon: User },
              { value: "notifications", label: "Notifications", icon: Bell },
              { value: "security", label: "Security", icon: Shield },
              { value: "billing", label: "Billing", icon: CreditCard },
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

          <TabsContent value="profile" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-6 flex items-center gap-2 font-semibold">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </h2>

              <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold">John Doe</h3>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Member since January 2024
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-6 flex items-center gap-2 font-semibold">
                <Bell className="h-5 w-5 text-primary" />
                Email Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email when your booking is confirmed
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Booking Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded 24 hours before your appointment
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Promotional Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new services and offers
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly tips and insights delivered to your inbox
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-6 flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 font-medium">Change Password</h3>
                  <div className="grid gap-4 sm:max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button className="w-fit">Update Password</Button>
                  </div>
                </div>
              </div>
            </MotionCard>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <MotionCard className="p-6">
              <h2 className="mb-6 flex items-center gap-2 font-semibold">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Methods
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-blue-800">
                      <span className="text-xs font-bold text-white">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>
            </MotionCard>

            <MotionCard className="p-6">
              <h2 className="mb-4 font-semibold">Billing History</h2>
              <div className="space-y-3">
                {[
                  { date: "Dec 15, 2024", amount: "$150.00", service: "Business Strategy" },
                  { date: "Nov 28, 2024", amount: "$200.00", service: "Marketing Audit" },
                  { date: "Nov 10, 2024", amount: "$125.00", service: "Financial Planning" },
                ].map((invoice, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{invoice.service}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{invoice.amount}</p>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </MotionCard>
          </TabsContent>
        </Tabs>
      </SlideIn>
    </div>
  )
}
