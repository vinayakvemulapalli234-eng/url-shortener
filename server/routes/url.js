const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

// Shorten a URL (protected)
router.post('/shorten', authMiddleware, async (req, res) => {
  const { long_url } = req.body;

  if (!long_url) return res.status(400).json({ error: 'URL is required' });

  // Basic URL validation
  try { new URL(long_url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const short_code = nanoid(6);

  const { data, error } = await supabase.from('urls').insert({
    user_id: req.user.id,
    long_url,
    short_code,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    short_url: `${req.protocol}://${req.get('host')}/${short_code}`,
    short_code,
    long_url,
    id: data.id,
  });
});

// Get all URLs for logged-in user
router.get('/my-urls', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('urls')
    .select('*, clicks(count)')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get click analytics for a specific URL
router.get('/analytics/:id', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('clicks')
    .select('*')
    .eq('url_id', req.params.id)
    .order('clicked_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;