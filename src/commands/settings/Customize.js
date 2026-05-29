const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, MessageFlags } = require("discord.js");
const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require("@discordjs/builders");
const AvonCommand = require("../../structures/avonCommand");

function isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch { return false; }
}

function isImageUrl(str) {
    if (!isValidUrl(str)) return false;
    return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(str) || str.includes('cdn.discordapp.com') || str.includes('i.imgur.com') || str.includes('media.discordapp.net');
}

class Customize extends AvonCommand {
    get name() { return 'customize'; }
    get aliases() { return ['customise', 'setprofile', 'profileset']; }
    get cat() { return 'set'; }
    get premium() { return true; }

    async run(client, message, args, prefix) {
        try {
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

            const dbKey = `user_customize_${message.author.id}`;
            const sub = (args[0] || '').toLowerCase();

            // ── View current customization ──
            if (!sub || sub === 'view' || sub === 'show') {
                const data = await client.data4.get(dbKey) || {};
                const icon   = data.icon   || null;
                const banner = data.banner || null;

                const hasAny = icon || banner;
                let text =
                    `**| Your Custom Profile**\n\n` +
                    `${client.emoji.tick || '✅'} **Icon:** ${icon   ? `[View](${icon})`   : '`Not set`'}\n` +
                    `${client.emoji.tick || '✅'} **Banner:** ${banner ? `[View](${banner})` : '`Not set`'}\n\n` +
                    `**Commands:**\n` +
                    `\`${prefix}customize icon <url>\` — Set your custom icon\n` +
                    `\`${prefix}customize banner <url>\` — Set your custom banner\n` +
                    `\`${prefix}customize reset icon\` — Remove icon\n` +
                    `\`${prefix}customize reset banner\` — Remove banner\n` +
                    `\`${prefix}customize reset\` — Remove everything\n\n` +
                    `-# Your icon & banner appear in \`${prefix}profile\``;

                const components = [];
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(icon || message.author.displayAvatarURL({ dynamic: true })))
                    );
                components.push(container);

                if (banner) {
                    components.push(new ContainerBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent('**Your Banner Preview:**'))
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
                if (!isImageUrl(url)) return send(`${client.emoji.cross || '❌'} | That doesn't look like a valid image URL. Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`.`);

                const data = await client.data4.get(dbKey) || {};
                data.icon = url;
                await client.data4.set(dbKey, data);

                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                `**| Custom Icon Set**\n\n` +
                                `${client.emoji.tick || '✅'} | Your custom icon has been updated!\n\n` +
                                `It will now appear in \`${prefix}profile\`.\n\n` +
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
                if (!isImageUrl(url)) return send(`${client.emoji.cross || '❌'} | That doesn't look like a valid image URL. Make sure it ends in \`.png\`, \`.jpg\`, \`.gif\`, or \`.webp\`.`);

                const data = await client.data4.get(dbKey) || {};
                data.banner = url;
                await client.data4.set(dbKey, data);

                const components = [
                    new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `**| Custom Banner Set**\n\n` +
                                    `${client.emoji.tick || '✅'} | Your custom banner has been updated!\n\n` +
                                    `It will now appear in \`${prefix}profile\`.\n\n` +
                                    `-# Use \`${prefix}customize reset banner\` to remove it.`
                                ))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
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
                    return send(`${client.emoji.tick || '✅'} | Your custom icon has been removed. Your Discord avatar will be used instead.`);
                }
                if (target === 'banner') {
                    delete data.banner;
                    await client.data4.set(dbKey, data);
                    return send(`${client.emoji.tick || '✅'} | Your custom banner has been removed.`);
                }

                // Reset everything
                await client.data4.delete(dbKey);
                return send(`${client.emoji.tick || '✅'} | All your customizations have been reset.`);
            }

            // ── Unknown subcommand ──
            return send(
                `**| Customize Your Profile**\n\n` +
                `${client.emoji.cross || '❌'} | Unknown option \`${sub}\`.\n\n` +
                `**Available options:**\n` +
                `\`${prefix}customize\` — View your current customization\n` +
                `\`${prefix}customize icon <url>\` — Set your custom icon\n` +
                `\`${prefix}customize banner <url>\` — Set your custom banner\n` +
                `\`${prefix}customize reset [icon|banner]\` — Remove customization\n\n` +
                `-# This is a **Premium** feature.`
            );

        } catch (e) { console.error(e); }
    }
}
module.exports = Customize;
