import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    redirect("/");
  }

  try {
    const res = await fetch("http://localhost:5000/api/user/profile", {
      headers: { Cookie: `accessToken=${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      redirect("/");
    }

    return await res.json();
  } catch (error) {
    redirect("/");
  }
}

export default async function Dashboard() {
  const user = await getUser();

  async function logout() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">AI Code Reviewer</h1>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-2">
            <Image
              src={user.avatarUrl}
              alt={`${user.username}'s avatar`}
              width={32}
              height={32}
              className="rounded-full border border-zinc-700"
            />
            <span className="text-sm font-medium text-zinc-300">{user.username}</span>
          </div>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Logout
          </Button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-center">
            Welcome back, {user.username}!
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
