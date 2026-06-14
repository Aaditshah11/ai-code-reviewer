import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";

interface Repository {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  language: string | null;
  updatedAt: string;
  url: string;
}

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

async function getRepositories() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    redirect("/");
  }

  try {
    const res = await fetch("http://localhost:5000/api/repositories", {
      headers: { Cookie: `accessToken=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { repositories: [] };
    const data: { repositories: Repository[] } = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return { repositories: [] };
  }
}

export default async function Dashboard() {
  const user = await getUser();
  const { repositories }: { repositories: Repository[] } =
    await getRepositories();

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
            <span className="text-sm font-medium text-zinc-300">
              {user.username}
            </span>
          </div>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Logout
          </Button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-10">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {user.username}!
            </h2>
            <p className="text-zinc-400 text-sm">
              Select a repository to get started with code review.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold text-white">
              Your Repositories
            </h3>

            {repositories.length === 0 ? (
              <Card className="border-zinc-800 bg-zinc-900/50 text-zinc-100 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-zinc-400">No repositories found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {repositories.map((repo) => (
                  <Card
                    key={repo.githubId}
                    className="border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300 backdrop-blur-sm text-zinc-100"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-white hover:text-blue-400 transition-colors text-lg break-all"
                          >
                            {repo.name}
                          </a>
                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            {repo.private && (
                              <Badge
                                variant="destructive"
                                className="bg-red-500/10 text-red-400 border-red-500/20"
                              >
                                Private
                              </Badge>
                            )}
                            {repo.language && (
                              <Badge
                                variant="secondary"
                                className="bg-zinc-800 text-zinc-300 border-zinc-700"
                              >
                                {repo.language}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p
                          className={`text-sm line-clamp-2 ${repo.description ? "text-zinc-400" : "text-zinc-500 italic"}`}
                        >
                          {repo.description || "No description"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/60 text-xs text-zinc-500">
                        <span className="truncate max-w-[200px]">
                          {repo.fullName}
                        </span>
                        <span>
                          Updated:{" "}
                          {new Date(repo.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
