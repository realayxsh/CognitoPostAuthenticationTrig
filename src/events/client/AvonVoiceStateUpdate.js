const delay = require(`delay`);
const AvonClientEvent = require("../../structures/Eventhandler");

class AvonVoiceStateUpdate extends AvonClientEvent {
    get name() { return 'voiceStateUpdate'; }
    async run(os, ns) {
        let guild = ns.guild || os.guild;
        let player = this.client.poru.players.get(guild.id);

        // Unmute if server-muted
        if (ns.guild.members.me.serverMute === true) {
            ns.guild.members.me.voice.setMute(false).catch(() => {});
        }

        // Bot's own voice state changed
        if (os.id === this.client.user.id) {
            // Bot was disconnected from VC
            if (!ns.channelId) {
                if (player) player.destroy().catch(() => {});
                return;
            }

            // Bot moved to a different channel — update player voiceId
            if (player && ns.channelId && ns.channelId !== os.channelId) {
                player.voiceId = ns.channelId;
                // Re-apply quality EQ after channel move since Lavalink may reset filters
                if (player.data.get('qualityInit')) {
                    const QUALITY_EQ = [
                        { band: 0,  gain: -0.05 }, { band: 1,  gain:  0.00 }, { band: 2,  gain:  0.03 },
                        { band: 3,  gain:  0.05 }, { band: 4,  gain:  0.04 }, { band: 5,  gain:  0.00 },
                        { band: 6,  gain: -0.03 }, { band: 7,  gain:  0.00 }, { band: 8,  gain:  0.03 },
                        { band: 9,  gain:  0.04 }, { band: 10, gain:  0.04 }, { band: 11, gain:  0.03 },
                        { band: 12, gain:  0.02 }, { band: 13, gain:  0.02 },
                    ];
                    const anyFilterActive = player.data.get('8d') || player.data.get('bass') ||
                        player.data.get('night') || player.data.get('vib') || player.data.get('trem') ||
                        player.data.get('treble') || player.data.get('slow') || player.data.get('chip') ||
                        player.data.get('china') || player.data.get('vapor') || player.data.get('dolbyatmos');
                    if (!anyFilterActive) {
                        player.shoukaku.setFilters({ equalizer: QUALITY_EQ }).catch(() => {});
                    }
                }
            }
            return;
        }

        if (!player) return;

        // All humans left the VC — check 247 mode before auto-leaving
        const vc = guild.channels.cache.get(player.voiceId);
        if (!vc) return;
        const humanCount = vc.members.filter(m => !m.user.bot).size;
        if (humanCount > 0) return;

        const is247 = await this.client.data.get(`${guild.id}-247`);
        if (is247 === `enabled`) return; // stay in VC in 247 mode

        // Wait 1 minute — if still empty, leave
        await delay(60000);
        const freshPlayer = this.client.poru.players.get(guild.id);
        if (!freshPlayer) return;
        const freshVc = guild.channels.cache.get(freshPlayer.voiceId);
        if (!freshVc) return;
        const stillEmpty = freshVc.members.filter(m => !m.user.bot).size === 0;
        if (!stillEmpty) return;

        freshPlayer.destroy().catch(() => {});
        const ch = this.client.channels.cache.get(freshPlayer.textId);
        if (ch) {
            const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                    `${this.client.emoji.cross} | Left the voice channel — no one was listening.`
                ));
            ch.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
        }
    }
}
module.exports = AvonVoiceStateUpdate;
