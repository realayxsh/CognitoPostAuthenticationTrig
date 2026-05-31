const { WebhookClient, EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

let _web = null;

// Called from AvonReady — bot auto-creates/finds its own webhook in the log channel
async function initWebhook(client) {
    const channelId = process.env.logChannelId || config.logChannelId;
    if (!channelId) {
        console.warn('[Webhook] No logChannelId set — webhook logging disabled.');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            console.warn('[Webhook] Log channel not found or not a text channel.');
            return;
        }

        const hooks = await channel.fetchWebhooks();
        let hook = hooks.find(h => h.name === 'Avon Logs' && h.owner?.id === client.user.id);

        if (!hook) {
            hook = await channel.createWebhook({
                name: 'Avon Logs',
                avatar: client.user.displayAvatarURL(),
                reason: 'Auto-created by Avon for log delivery'
            });
            console.log('[Webhook] Created new webhook in log channel.');
        } else {
            console.log('[Webhook] Found existing webhook in log channel.');
        }

        _web = new WebhookClient({ id: hook.id, token: hook.token });
        console.log(`[Webhook] Ready — ID: ${hook.id}`);
    } catch (e) {
        console.error('[Webhook] Failed to init webhook:', e.message);
    }
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

module.exports = { web, send, info, error, initWebhook };
