const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

const DURATION_MS = {
    '30d':  30  * 24 * 60 * 60 * 1000,
    '90d':  90  * 24 * 60 * 60 * 1000,
    '180d': 180 * 24 * 60 * 60 * 1000,
    '365d': 365 * 24 * 60 * 60 * 1000,
    'lifetime': null
};

const DURATION_LABELS = {
    '30d': '30 Days', '90d': '90 Days', '180d': '180 Days',
    '365d': '1 Year', 'lifetime': 'Lifetime'
};

class Redeem extends AvonCommand{
    get name(){ return 'redeem'; }
    get aliases(){ return ['activatepremium','redeemcode']; }
    get cat(){ return 'premium'; }
    async run(client, message, args, prefix){
        try{
            if(!message.member.permissions.has(8n) && !client.config.owners.includes(message.author.id)){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Only server administrators can redeem a premium code.`)
                ]});
            }

            if(!args[0]){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Usage: \`${prefix}redeem <code>\``)
                ]});
            }

            let existing = await client.data3.get(`premium_${message.guild.id}`);
            if(existing){
                let isLifetime = existing.expiresAt === null;
                let isActive   = isLifetime || Date.now() < existing.expiresAt;
                if(isActive){
                    let expText = isLifetime ? '**Lifetime**' : `<t:${Math.floor(existing.expiresAt/1000)}:R>`;
                    return message.channel.send({embeds: [
                        new EmbedBuilder().setColor(client.config.color)
                            .setDescription(`${client.emoji.tick} | This server already has **Premium** active! Expires: ${expText}`)
                    ]});
                }
            }

            let code  = args[0].toUpperCase();
            let codes = await client.data3.get(`premium_codes`) || [];

            let entry = codes.find(c => (typeof c === 'object' ? c.code : c) === code);
            if(!entry){
                return message.channel.send({embeds: [
                    new EmbedBuilder().setColor(client.config.color)
                        .setDescription(`${client.emoji.cross} | Invalid or already used code.`)
                ]});
            }

            let durKey    = typeof entry === 'object' ? (entry.duration || '30d') : '30d';
            let durMs     = DURATION_MS[durKey] ?? DURATION_MS['30d'];
            let expiresAt = durMs !== null ? Date.now() + durMs : null;
            let label     = DURATION_LABELS[durKey] || '30 Days';

            let remaining = codes.filter(c => (typeof c === 'object' ? c.code : c) !== code);
            await client.data3.set(`premium_codes`, remaining);
            await client.data3.set(`premium_${message.guild.id}`, {
                active: true,
                expiresAt,
                activatedAt: Date.now()
            });

            let expText = expiresAt ? `<t:${Math.floor(expiresAt/1000)}:F>` : '**Never (Lifetime)**';

            return message.channel.send({embeds: [
                new EmbedBuilder().setColor(`#FFD700`)
                    .setAuthor({name: `| Premium Activated!`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(`${client.emoji.tick} | **${message.guild.name}** now has **Premium** (${label})!\n\nExpires: ${expText}\n\nAll filters and premium features are now unlocked.`)
                    .setThumbnail(message.guild.iconURL({dynamic: true}))
            ]});
        } catch(e){ console.log(e); }
    }
}
module.exports = Redeem;
