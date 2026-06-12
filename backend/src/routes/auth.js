import { Router } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Redirect to GitHub OAuth authorize URL
router.get('/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    console.error('GitHub authentication failed: GITHUB_CLIENT_ID is missing from environment variables.');
    return res.status(500).json({ error: 'GitHub client ID is not configured on the server.' });
  }

  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
  res.redirect(redirectUrl);
});

// GitHub OAuth callback URL
router.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = response.data.access_token;
    console.log('GitHub Access Token:', accessToken);

    if (!accessToken) {
      return res.status(401).json({ error: 'Failed to retrieve access token from GitHub.' });
    }

    // Fetch GitHub user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ai-code-reviewer-backend',
      },
    });

    // Upsert user in the database
    const user = await prisma.user.upsert({
      where: {
        githubId: String(userResponse.data.id),
      },
      update: {
        username: userResponse.data.login,
        email: userResponse.data.email,
        avatarUrl: userResponse.data.avatar_url,
        accessToken: accessToken,
      },
      create: {
        githubId: String(userResponse.data.id),
        username: userResponse.data.login,
        email: userResponse.data.email,
        avatarUrl: userResponse.data.avatar_url,
        accessToken: accessToken,
      },
    });

    console.log('Database User upserted:', user);

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/auth/success?token=${jwtToken}`);
  } catch (error) {
    console.error('Error during GitHub authentication callback:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to complete GitHub authentication.' });
  }
});

export default router;
