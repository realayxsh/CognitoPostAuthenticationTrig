const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");
const ms = require("ms");

function buildBar(position, total, size = 15) {
    if (!total || total <= 0) return `${'▬'.repeat(size)}`;
    let filled = Math.min(Math.round((position / total) * size), size - 1);
    return `${'▬'.repeat(filled)}●${'▬'.repeat(size - 1 - filled)}`;
}

function buildEmbed(client, track, player) {
    let position = player.position || 0;
    let duration = track.length || 0;
    let bar = buildBar(position, duration);
    let loopMode = player.loop === 'track' ? '🔂 Track' : player.loop === 'queue' ? '🔁 Queue' : '➡️ Off';

    return new EmbedBuilder()
        .setColor(client.config.color)
        .setAuthor({ name: '| Now Playing', iconURL: client.user.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(track.thumbnail || null)
        .setDescription(
            `**[${track.title}](${track.uri || client.config.server})**\n\n` +
            `${bar}\n` +
            `\`${ms(position)} / ${ms(duration)}\`\n\n` +
            `${client.emoji.users} **Requester:** ${track.requester}\n` +
            `${client.emoji.music} **Loop:** ${loopMode}\n` +
            `${client.emoji.ping} **Volume:** ${player.volume}%`
        )
        .setFooter({ text: 'Updates every 5 seconds' });
}

class NowPlaying extends AvonCommand {
    get name() { return 'nowplaying'; }
    get aliases() { return ['np', 'current', 'playing']; }
    get cat() { return 'music'; }
    get player() { return true; }
    get inVoice() { return false; }
    get sameVoice() { return false; }

    async run(client, message, args, prefix, player) {
        try {
            let track = player.queue.current;
            if (!track) {
                return message.channel.send({ embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | No track is currently playing.`)
                ]});
            }

            let msg = await message.channel.send({ embeds: [buildEmbed(client, track, player)] });

            let updates = 0;
            let interval = setInterval(async () => {
                try {
                    updates++;
                    let currentPlayer = client.poru.players.get(message.guild.id);
                    let currentTrack = currentPlayer?.queue?.current;

                    if (!currentPlayer || !currentTrack || updates >= 24) {
                        clearInterval(interval);
                        if (msg.editable) {
                            let finalEmbed = new EmbedBuilder()
                                .setColor(client.config.color)
                                .setAuthor({ name: '| Now Playing', iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                                .setDescription(`${client.emoji.music} No longer updating.`)
                                .setFooter({ text: 'Stopped updating' });
                            await msg.edit({ embeds: [finalEmbed] }).catch(() => {});
                        }
                        return;
                    }

                    await msg.edit({ embeds: [buildEmbed(client, currentTrack, currentPlayer)] }).catch(() => {
                        clearInterval(interval);
                    });
                } catch (e) {
                    clearInterval(interval);
                }
            }, 5000);

        } catch (e) { console.log(e); }
    }
}
module.exports = NowPlaying;
