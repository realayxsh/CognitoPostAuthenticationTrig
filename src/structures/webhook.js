const { WebhookClient, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

const WEBHOOK_URL = process.env.logwebhook || process.env.guildwebhook || process.env.errorswebhook || config.logwebhook || config.guildwebhook || '';
let _web = null;
try { _web = WEBHOOK_URL ? new WebhookClient({ url: WEBHOOK_URL }) : null; } catch(e) {}

function web() { return _web; }

function send(embed) {
    if (!_web) return;
    _web.send({ embeds: [embed] }).catch(() => {});
}

function info(title, desc, color = 0x5865F2) {
    send(new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp());
}

function error(title, err) {
    const stack = err?.stack || String(err);
    const truncated = stack.length > 3800 ? stack.slice(0, 3800) + '\n...(truncated)' : stack;
    send(new EmbedBuilder().setTitle(`🔴 ${title}`).setDescription(`\`\`\`js\n${truncated}\`\`\``).setColor(0xFF0000).setTimestamp());
}

module.exports = { web, send, info, error };
