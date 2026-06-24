import { Worker } from "bullmq";
import axios from "axios";
import { connection } from "../lib/queue.js";
import prisma from "../lib/prisma.js";

const worker = new Worker(
  "code-review",
  async (job) => {
    console.log("Processing review job:", job.data);

    const url =
      job.data.repoFullName && job.data.prNumber
        ? `https://api.github.com/repos/${job.data.repoFullName}/pulls/${job.data.prNumber}`
        : job.data.prDiff;

    const headers = {
      Accept: "application/vnd.github.v3.diff",
      "User-Agent": "ai-code-reviewer-backend",
    };

    if (job.data.githubToken) {
      headers.Authorization = `Bearer ${job.data.githubToken}`;
    }

    const diffResponse = await axios.get(url, { headers });
    const prDiff = diffResponse.data;
    console.log("Diff type:", typeof prDiff);
    console.log("Diff preview:", String(prDiff).substring(0, 200));

    console.log("PR diff fetched, length:", prDiff.length);

    const aiResponse = await axios.post("http://localhost:8000/review/", {
      pr_title: job.data.prTitle,
      pr_diff: typeof prDiff === "string" ? prDiff : JSON.stringify(prDiff),
      repo_name: job.data.repoFullName,
      author: job.data.author,
    });
    const review = aiResponse.data;
    console.log("AI Review received:", review);

    await prisma.review.create({
      data: {
        prNumber: job.data.prNumber,
        prTitle: job.data.prTitle,
        prDiff: typeof prDiff === "string" ? prDiff : JSON.stringify(prDiff),
        aiReview: review.summary,
        suggestions: [],
        severity:
          review.score >= 7 ? "low" : review.score >= 4 ? "medium" : "high",
        status: "completed",
        userId: job.data.userId,
        repositoryId: job.data.repositoryId,
      },
    });
    console.log("Review saved to database");

    return { status: "completed", review };
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("Job failed:", job.id, err.message);
});

export default worker;
