const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Rotation extends AvonCommand {
    get name() { return '8d' }
    get aliases() { return [] }
    get player() { return true }
    get vote() { return true; }
    get cat() { return 'filters' }
    get premium() { return true; }
    get inVoice() { return true }
    get sameVoice() { return true }
    async run(client, message, args, prefix, player) {
        try {
            const accentColor = parseInt(client.config.color.replace('#', ''), 16);
            const send = (text) => {
                const container = new ContainerBuilder()
                    .setAccentColor(accentColor)
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };
            let data = player.data.get('8d');
            if (!data || data === false || data === undefined) {
                player.send({ guildId: message.guild.id, op: 'filters', rotation: { rotationHz: 0.2 } });
                player.data.set(`8d`, true);
                return send(`**| Enabled 8D**`);
            }
            if (data === true) {
                player.send({ guildId: message.guild.id, op: 'filters', rotation: { rotationHz: null } });
                player.data.set(`8d`, false);
                return send(`**| Disabled 8D**`);
            }
        } catch (e) { console.log(e) }
    }
}
module.exports = Rotation;
