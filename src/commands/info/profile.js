const AvonCommand = require("../../structures/avonCommand");
const { Api } = require(`@top-gg/sdk`);
const config = require(`../../../config.json`);
const badge = require(`./badges.json`);
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const { MediaGalleryBuilder, MediaGalleryItemBuilder } = require("@discordjs/builders");

async function safeHasVoted(userId) {
    const apiKey = process.env.topggapi || config.topggapi;
    if (!apiKey) return false;
    try {
        const voteApi = new Api(apiKey);
        return await voteApi.hasVoted(userId);
    } catch (e) {
        return false;
    }
}

class Badges extends AvonCommand{
    get name(){ return 'profile'; }
    get aliases(){ return ['badges','badge','pr']; }
    get cat(){ return 'info' }
    async run(client, message, args, prefix){
        const member = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
        const avatar = member.displayAvatarURL({ dynamic: true });

        // Fetch custom profile data (icon + banner set via +customize)
        let customData = {};
        try {
            customData = await client.data4.get(`user_customize_${member.id}`) || {};
        } catch (e) {}

        const displayIcon   = customData.icon   || avatar;
        const displayBanner = customData.banner  || null;
        const hasPremiumProfile = !!(customData.icon || customData.banner);

        const buildAndSend = (text) => {
            const components = [];

            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(displayIcon))
                );
            components.push(container);

            if (displayBanner) {
                components.push(
                    new ContainerBuilder()
                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder().addItems(
                                new MediaGalleryItemBuilder().setURL(displayBanner)
                            )
                        )
                );
            }

            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components });
        };

        let guild;
        try {
            guild = await client.guilds.fetch('1509516630365835294');
        } catch (e) {
            console.error('[Profile] Failed to fetch support guild:', e.message);
            const premiumLine = hasPremiumProfile ? `\n\n${client.emoji.tick || '✨'} *Custom profile active*` : '';
            return buildAndSend(
                `**Profile for ${member.username}**\n\n__BADGES__\n\`No Badges Available\`\nYou must be in our [support server](${client.config.server}) to get badges.\nJoin **[here](${client.config.server})**.${premiumLine}`
            );
        }

        let guildMember;
        try {
            guildMember = await guild.members.fetch(member.id);
        } catch (e) {
            const voted = await safeHasVoted(member.id);
            const badges = voted ? `\n${client.emoji.voter} **Voter**` : `\`No Badges Available\`\nYou must be in our [support server](${client.config.server}) to get badges.\nJoin **[here](${client.config.server})**.`;
            const premiumLine = hasPremiumProfile ? `\n\n${client.emoji.tick || '✨'} *Custom profile active*` : '';
            return buildAndSend(`**Profile for ${member.username}**\n\n__BADGES__\n${badges}${premiumLine}`);
        }

        let badges = '';
        try {
            const sys = guildMember.roles.cache;
            if (sys.has(badge.dev))       badges += `\n${client.emoji.dev} **Developer**`;
            if (sys.has(badge.owner))     badges += `\n${client.emoji.owner} **Owner**`;
            if (sys.has(badge.codev))     badges += `\n${client.emoji.codev} **Co-Developer**`;
            if (sys.has(badge.admin))     badges += `\n${client.emoji.admin} **Admin**`;
            if (sys.has(badge.supporter)) badges += `\n${client.emoji.supporter} **Supporter**`;
            if (sys.has(badge.vip))       badges += `\n${client.emoji.vip} **Vip**`;
            if (sys.has(badge.staff))     badges += `\n${client.emoji.staff} **Staff**`;
            if (sys.has(badge.friend))    badges += `\n${client.emoji.friend} **Friends**`;
            if (sys.has(badge.bug))       badges += `\n${client.emoji.bug} **Bug Hunter**`;
        } catch (e) {
            console.error('[Profile] Role check error:', e.message);
        }

        const voted = await safeHasVoted(member.id);
        if (voted) badges += `\n${client.emoji.voter} **Voter**`;
        if (badges === '') badges += `\n${client.emoji.users} **User**`;

        const premiumLine = hasPremiumProfile ? `\n\n${client.emoji.tick || '✨'} *Custom profile active*` : '';
        return buildAndSend(`**Profile for ${member.username}**\n\n__BADGES__\n${badges}${premiumLine}`);
    }
}
module.exports = Badges;
