import { Router } from "express";
import axios from "axios";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/connect", authMiddleware, async (req, res) => {
  try {
    const { githubId, name, fullName, private: isPrivate } = req.body;

    if (!githubId || !name || !fullName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, accessToken: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    try {
      await axios.post(
        `https://api.github.com/repos/${fullName}/hooks`,
        {
          name: "web",
          active: true,
          events: ["pull_request"],
          config: {
            url: process.env.NGROK_URL + "/webhooks/github",
            content_type: "json",
            secret: process.env.WEBHOOK_SECRET,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "User-Agent": "ai-code-reviewer-backend",
          },
        }
      );
    } catch (webhookError) {
      // If hook already exists, GitHub API returns 422. We can proceed since the hook is active.
      const errorMsg = webhookError.response?.data?.errors?.[0]?.message || webhookError.message;
      if (webhookError.response?.status === 422 && errorMsg.includes("Hook already exists")) {
        console.log(`Webhook already exists for ${fullName}, proceeding with database upsert.`);
      } else {
        console.error("GitHub webhook creation failed:", webhookError.response?.data || webhookError.message);
        return res.status(500).json({ error: `Failed to create GitHub webhook: ${errorMsg}` });
      }
    }

    const savedRepo = await prisma.repository.upsert({
      where: { githubId: Number(githubId) },
      update: { name, fullName, private: isPrivate },
      create: {
        githubId: Number(githubId),
        name,
        fullName,
        private: isPrivate,
        userId: user.id,
      },
    });

    return res.json({ success: true, repository: savedRepo });
  } catch (error) {
    console.error("Error connecting repository:", error);
    return res.status(500).json({ error: error.message || "Failed to connect repository" });
  }
});

export default router;
