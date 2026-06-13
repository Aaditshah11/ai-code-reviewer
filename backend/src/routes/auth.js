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
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save this refreshToken to the database for this user
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Set cookies and redirect to dashboard
    res.cookie('accessToken', jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Error during GitHub authentication callback:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to complete GitHub authentication.' });
  }
});

// Refresh Access Token route
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Access denied. No refresh token provided.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid or revoked refresh token.' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error in refresh token route:', error.message);
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

export default router;
