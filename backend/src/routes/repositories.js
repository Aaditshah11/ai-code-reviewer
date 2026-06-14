import { Router } from "express";
import axios from "axios";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Get all repositories for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, accessToken: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const response = await axios.get(
      "https://api.github.com/user/repos?sort=updated&per_page=20",
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "User-Agent": "ai-code-reviewer-backend",
        },
      },
    );

    const repositories = response.data.map((repo) => ({
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    }));

    res.json({ repositories });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

export default router;
