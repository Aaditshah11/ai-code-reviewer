import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">AI Code Reviewer</h1>
        <Button variant="outline" size="sm">
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-center">
            Welcome to your Dashboard
          </h2>
          <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Your repositories will appear here
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
