const express = require('express');
const dotenv = require('dotenv');
dotenv.config();



const app = express()


const PORT = process.env.PORT;

app.get('/activity', async (req, res) => {
  const user = req.query.user;
  if (!user) {
    return res.status(400).json({ error: 'Missing "user" query parameter.' });
  }

  try{
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/events`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user activity.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});