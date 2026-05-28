const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Vibrato extends AvonCommand {
    get name() { return 'vibrato' }
    get aliases() { return null; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters' }
    get vote() { return true; }
    get player() { return true; }
    get premium() { return true; }
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
            let db = player.data.get(`vib`);
            if (!db || db === false || db === undefined) {
                player.send({ op: 'filters', guildId: message.guild.id, vibrato: { frequency: 4.0, depth: 0.75 } });
                player.data.set(`vib`, true);
                return send(`**| Enabled Vibrato**`);
            }
            if (db === true) {
                player.send({ guildId: message.guild.id, op: 'filters' });
                player.data.set(`vib`, false);
                return send(`**| Disabled Vibrato**`);
            }
        } catch (e) { console.log(e) }
    }
}
module.exports = Vibrato;
