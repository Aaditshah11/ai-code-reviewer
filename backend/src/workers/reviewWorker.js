import { Worker } from "bullmq";
import axios from "axios";
import { connection } from "../lib/queue.js";

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
    console.log("PR diff fetched, length:", prDiff.length);

    // AI service call will go here next
    return { status: "processed" };
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
