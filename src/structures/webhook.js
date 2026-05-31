const { WebhookClient, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

const WEBHOOK_URL = process.env.logwebhook || process.env.guildwebhook || process.env.errorswebhook || config.logwebhook || config.guildwebhook || '';
let _web = null;

if (WEBHOOK_URL) {
    // Parse the URL manually to extract id + token, bypassing discord.js URL validation
    const match = WEBHOOK_URL.match(/webhooks\/(\d+)\/([^/?#\s]+)/);
    if (match) {
        try {
            _web = new WebhookClient({ id: match[1], token: match[2] });
            console.log(`[Webhook] Initialised — ID: ${match[1]}`);
        } catch(e) {
            console.error('[Webhook] Failed to create WebhookClient:', e.message);
        }
    } else {
        console.warn('[Webhook] Could not parse webhook URL — logs will not be sent to Discord.');
    }
} else {
    console.warn('[Webhook] No webhook URL configured — logs will not be sent to Discord.');
}

function web() { return _web; }

function send(embed) {
    if (!_web) return;
    _web.send({ embeds: [embed] }).catch((e) => {
        console.error('[Webhook] Failed to send log:', e.message);
    });
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
