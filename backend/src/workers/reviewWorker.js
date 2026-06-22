import { Worker } from "bullmq";
import { connection } from "../lib/queue.js";

const worker = new Worker(
  "code-review",
  async (job) => {
    console.log("Processing review job:", job.data);
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
