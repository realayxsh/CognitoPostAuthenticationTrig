const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require("@discordjs/builders");
const AvonCommand = require("../../structures/avonCommand");
const { invalidateServerBrandCache } = require("../../structures/serverBrand");

function isImageUrl(str) {
    try {
        const url = new URL(str);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
        return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(str)
            || str.includes('cdn.discordapp.com')
            || str.includes('i.imgur.com')
            || str.includes('media.discordapp.net')
            || str.includes('images-ext-');
    } catch { return false; }
}

class Customize extends AvonCommand {
    get name() { return 'customize'; }
    get aliases() { return ['customise', 'setbot', 'botbrand', 'serverbrand']; }
    get cat() { return 'set'; }
    get premium() { return true; }

    async run(client, message, args, prefix) {
        try {
            if (!message.member.permissions.has(8n) && !client.config.owners.includes(message.author.id)) {
                const c = new ContainerBuilder().addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${client.emoji.cross} | Only server administrators can customize the bot's appearance.`)
                );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [c] });
            }

            const send = (text, thumb) => {
                const container = new ContainerBuilder();
                if (thumb) {
                    container.addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb))
                    );
                } else {
                    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
                }
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };

            const dbKey = `server_brand_${message.guild.id}`;
            const sub = (args[0] || '').toLowerCase();

            // ── View current server branding ──
            if (!sub || sub === 'view' || sub === 'show') {
                const data = await client.data4.get(dbKey) || {};
                const icon   = data.icon   || null;
                const banner = data.banner || null;

                let text =
                    `**| Bot Appearance — ${message.guild.name}**\n\n` +
                    `${client.emoji.tick || '✅'} **Icon:** ${icon   ? `[View](${icon})`   : '`Not set — using default bot avatar`'}\n` +
                    `${client.emoji.tick || '✅'} **Banner:** ${banner ? `[View](${banner})` : '`Not set`'}\n\n` +
                    `**How to customize:**\n` +
                    `\`${prefix}customize icon <url>\` — Set a custom bot icon for this server\n` +
                    `\`${prefix}customize banner <url>\` — Set a custom banner for this server\n` +
                    `\`${prefix}customize reset icon\` — Remove custom icon\n` +
                    `\`${prefix}customize reset banner\` — Remove custom banner\n` +
                    `\`${prefix}customize reset\` — Remove all customization\n\n` +
                    `-# Changes apply to how the bot appears in **this server only**. ✨ Premium`;

                const components = [];
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon || client.user.displayAvatarURL({ dynamic: true })))
                    );
                components.push(container);

                if (banner) {
                    components.push(
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent('**Current Banner:**'))
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder().addItems(
                                    new MediaGalleryItemBuilder().setURL(banner)
                                )
                            )
                    );
                }

                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components });
            }

            // ── Set icon ──
            if (sub === 'icon') {
                const url = args[1];
                if (!url) return send(`${client.emoji.cross || '❌'} | Please provide an image URL.\nUsage: \`${prefix}customize icon <url>\``);
                if (!isImageUrl(url)) return send(
                    `${client.emoji.cross || '❌'} | That doesn't look like a valid image URL.\n` +
                    `Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`, or use a Discord/Imgur CDN link.`
                );

                const data = await client.data4.get(dbKey) || {};
                data.icon = url;
                await client.data4.set(dbKey, data);
                invalidateServerBrandCache(message.guild.id);

                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                `**| Bot Icon Updated**\n\n` +
                                `${client.emoji.tick || '✅'} | Custom icon set for **${message.guild.name}**!\n\n` +
                                `The bot will now use this icon in messages on this server.\n\n` +
                                `-# Use \`${prefix}customize reset icon\` to remove it.`
                            ))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(url))
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            }

            // ── Set banner ──
            if (sub === 'banner') {
                const url = args[1];
                if (!url) return send(`${client.emoji.cross || '❌'} | Please provide an image URL.\nUsage: \`${prefix}customize banner <url>\``);
                if (!isImageUrl(url)) return send(
                    `${client.emoji.cross || '❌'} | That doesn't look like a valid image URL.\n` +
                    `Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`, or use a Discord/Imgur CDN link.`
                );

                const data = await client.data4.get(dbKey) || {};
                data.banner = url;
                await client.data4.set(dbKey, data);
                invalidateServerBrandCache(message.guild.id);

                const components = [
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `**| Bot Banner Updated**\n\n` +
                                    `${client.emoji.tick || '✅'} | Custom banner set for **${message.guild.name}**!\n\n` +
                                    `The bot will now display this banner in the help menu and other panels.\n\n` +
                                    `-# Use \`${prefix}customize reset banner\` to remove it.`
                                ))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ dynamic: true })))
                        ),
                    new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('**Banner Preview:**'))
                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder().addItems(
                                new MediaGalleryItemBuilder().setURL(url)
                            )
                        )
                ];
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components });
            }

            // ── Reset ──
            if (sub === 'reset') {
                const target = (args[1] || '').toLowerCase();
                const data = await client.data4.get(dbKey) || {};

                if (target === 'icon') {
                    delete data.icon;
                    await client.data4.set(dbKey, data);
                    invalidateServerBrandCache(message.guild.id);
                    return send(`${client.emoji.tick || '✅'} | Custom icon removed. The bot's default avatar will be used again.`);
                }
                if (target === 'banner') {
                    delete data.banner;
                    await client.data4.set(dbKey, data);
                    invalidateServerBrandCache(message.guild.id);
                    return send(`${client.emoji.tick || '✅'} | Custom banner removed.`);
                }

                await client.data4.delete(dbKey);
                invalidateServerBrandCache(message.guild.id);
                return send(`${client.emoji.tick || '✅'} | All bot customizations for **${message.guild.name}** have been reset.`);
            }

            // ── Unknown subcommand ──
            return send(
                `**| Customize Bot Appearance**\n\n` +
                `${client.emoji.cross || '❌'} | Unknown option \`${sub}\`.\n\n` +
                `**Available options:**\n` +
                `\`${prefix}customize\` — View current server customization\n` +
                `\`${prefix}customize icon <url>\` — Set a custom bot icon\n` +
                `\`${prefix}customize banner <url>\` — Set a custom banner\n` +
                `\`${prefix}customize reset [icon|banner]\` — Remove customization\n\n` +
                `-# ✨ This is a **Premium** feature for server admins.`
            );

        } catch (e) { console.error(e); }
    }
}
module.exports = Customize;
