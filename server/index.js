const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/url');
const supabase = require('./supabase');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);

app.get('/:code', async (req, res) => {
  const { code } = req.params;

  const { data: url, error } = await supabase
    .from('urls')
    .select('*')
    .eq('short_code', code)
    .single();

  if (error || !url) {
    return res.status(404).send('Short URL not found');
  }

  await supabase.from('clicks').insert({
    url_id: url.id,
    ip_address: req.ip,
  });

  res.redirect(url.long_url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));