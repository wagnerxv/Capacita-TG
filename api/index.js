// Small wrapper to run the Express app in a traditional Node server
const app = require('./server');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});