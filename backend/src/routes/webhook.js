import { Router } from "express";
import crypto from "crypto";
import { reviewQueue } from "../lib/queue.js";

const router = Router();

router.post("/github", async (req, res) => {
  try {
    const sig = req.headers["x-hub-signature-256"];
    if (!sig) {
      return res.status(401).json({ error: "Missing signature" });
    }

    if (!process.env.WEBHOOK_SECRET) {
      console.error("WEBHOOK_SECRET is not configured in environmental variables.");
      return res.status(500).json({ error: "Webhook secret configuration error" });
    }

    const expectedSig =
      "sha256=" +
      crypto
        .createHmac("sha256", process.env.WEBHOOK_SECRET)
        .update(req.body) // req.body is raw Buffer here
        .digest("hex");

    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch (parseError) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    const event = req.headers["x-github-event"];
    if (event !== "pull_request") {
      return res.status(200).json({ message: "Event ignored" });
    }

    if (payload.action !== "opened") {
      return res.status(200).json({ message: "Action ignored" });
    }

    console.log("New PR opened:", {
      repo: payload.repository?.full_name,
      prNumber: payload.pull_request?.number,
      prTitle: payload.pull_request?.title,
      author: payload.pull_request?.user?.login,
    });

    await reviewQueue.add("review-pr", {
      prNumber: payload.pull_request.number,
      prTitle: payload.pull_request.title,
      prDiff: payload.pull_request.diff_url,
      repoFullName: payload.repository.full_name,
      repoId: payload.repository.id,
      author: payload.pull_request.user.login
    });

    console.log('Review job queued for PR:', payload.pull_request.number);

    return res.status(200).json({ message: "Webhook received" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
