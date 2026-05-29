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
            const em = client.emoji;

            if (!message.member.permissions.has(8n) && !client.config.owners.includes(message.author.id)) {
                return message.channel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [new ContainerBuilder().addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${em.cross} | Only server administrators can customize the bot's appearance.`)
                    )]
                });
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

                const text =
                    `**| Bot Appearance — ${message.guild.name}**\n\n` +
                    `${em.customize_icon} **Icon:** ${icon   ? `[View](${icon})`   : '`Not set — using default bot avatar`'}\n` +
                    `${em.customize_banner} **Banner:** ${banner ? `[View](${banner})` : '`Not set`'}\n\n` +
                    `**How to customize:**\n` +
                    `${em.customize_icon} \`${prefix}customize icon <url>\` — Set a custom bot icon\n` +
                    `${em.customize_banner} \`${prefix}customize banner <url>\` — Set a custom banner\n` +
                    `${em.customize_view} \`${prefix}customize\` — View this panel\n` +
                    `${em.customize_reset} \`${prefix}customize reset icon\` — Remove icon\n` +
                    `${em.customize_reset} \`${prefix}customize reset banner\` — Remove banner\n` +
                    `${em.customize_reset} \`${prefix}customize reset\` — Remove everything\n\n` +
                    `-# Changes apply to how the bot appears in **this server only**. ${em.premium} Premium`;

                const components = [];
                components.push(
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon || client.user.displayAvatarURL({ dynamic: true })))
                        )
                );

                if (banner) {
                    components.push(
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${em.customize_banner} **Current Banner:**`))
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
                if (!url) return send(
                    `${em.cross} | Please provide an image URL.\n` +
                    `${em.customize_icon} Usage: \`${prefix}customize icon <url>\``
                );
                if (!isImageUrl(url)) return send(
                    `${em.cross} | That doesn't look like a valid image URL.\n` +
                    `Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`, or use a Discord/Imgur CDN link.`
                );

                const data = await client.data4.get(dbKey) || {};
                data.icon = url;
                await client.data4.set(dbKey, data);
                invalidateServerBrandCache(message.guild.id);

                return message.channel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [
                        new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                        `**| Bot Icon Updated**\n\n` +
                                        `${em.customize_icon} | Custom icon set for **${message.guild.name}**!\n\n` +
                                        `The bot will now use this icon in messages on this server.\n\n` +
                                        `-# ${em.customize_reset} Use \`${prefix}customize reset icon\` to remove it.`
                                    ))
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(url))
                            )
                    ]
                });
            }

            // ── Set banner ──
            if (sub === 'banner') {
                const url = args[1];
                if (!url) return send(
                    `${em.cross} | Please provide an image URL.\n` +
                    `${em.customize_banner} Usage: \`${prefix}customize banner <url>\``
                );
                if (!isImageUrl(url)) return send(
                    `${em.cross} | That doesn't look like a valid image URL.\n` +
                    `Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`, or use a Discord/Imgur CDN link.`
                );

                const data = await client.data4.get(dbKey) || {};
                data.banner = url;
                await client.data4.set(dbKey, data);
                invalidateServerBrandCache(message.guild.id);

                return message.channel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [
                        new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                        `**| Bot Banner Updated**\n\n` +
                                        `${em.customize_banner} | Custom banner set for **${message.guild.name}**!\n\n` +
                                        `The bot will display this banner in the help menu and other panels.\n\n` +
                                        `-# ${em.customize_reset} Use \`${prefix}customize reset banner\` to remove it.`
                                    ))
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL({ dynamic: true })))
                            ),
                        new ContainerBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${em.customize_banner} **Banner Preview:**`))
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder().addItems(
                                    new MediaGalleryItemBuilder().setURL(url)
                                )
                            )
                    ]
                });
            }

            // ── Reset ──
            if (sub === 'reset') {
                const target = (args[1] || '').toLowerCase();
                const data = await client.data4.get(dbKey) || {};

                if (target === 'icon') {
                    delete data.icon;
                    await client.data4.set(dbKey, data);
                    invalidateServerBrandCache(message.guild.id);
                    return send(`${em.customize_reset} | Custom icon removed. The bot's default avatar will be used again.`);
                }
                if (target === 'banner') {
                    delete data.banner;
                    await client.data4.set(dbKey, data);
                    invalidateServerBrandCache(message.guild.id);
                    return send(`${em.customize_reset} | Custom banner removed.`);
                }

                await client.data4.delete(dbKey);
                invalidateServerBrandCache(message.guild.id);
                return send(`${em.customize_reset} | All bot customizations for **${message.guild.name}** have been reset.`);
            }

            // ── Unknown subcommand ──
            return send(
                `**| Customize Bot Appearance**\n\n` +
                `${em.cross} | Unknown option \`${sub}\`.\n\n` +
                `**Available options:**\n` +
                `${em.customize_view} \`${prefix}customize\` — View current server customization\n` +
                `${em.customize_icon} \`${prefix}customize icon <url>\` — Set a custom bot icon\n` +
                `${em.customize_banner} \`${prefix}customize banner <url>\` — Set a custom banner\n` +
                `${em.customize_reset} \`${prefix}customize reset [icon|banner]\` — Remove customization\n\n` +
                `-# ${em.premium} This is a **Premium** feature for server admins.`
            );

        } catch (e) { console.error(e); }
    }
}
module.exports = Customize;
