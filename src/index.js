require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => console.log(`Express running on port ${PORT}`));

app.use('/ping', (req, res) => {
  res.send(new Date());
});
const Avon = require("./structures/avonClient.js");
const client = new Avon();
module.exports = client;