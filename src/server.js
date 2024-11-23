const app = require('./app');
const WhatsAppBot = require('./services/whatsapp-bot');
const Claude = require('./services/claude');

// Initialize WhatsApp bot
// const whatsappBot = new WhatsAppBot();
// whatsappBot.initialize();

const claude = new Claude();
const model = "claude-3-5-sonnet-20241022"
const messages = [{ role: "user", content: "Hello, Claude" }]
claude.generateText(model).then((msg) => { 
    console.log(msg)});


// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
