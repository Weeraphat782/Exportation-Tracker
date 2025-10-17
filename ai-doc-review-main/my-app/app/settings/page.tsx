import { SettingsForm } from "@/components/settings-form"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Configure your AI Document Review System</p>
        </div>

        <SettingsForm />
      </div>
    </div>
  )
}
