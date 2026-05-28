const AvonCommand = require("../../structures/avonCommand");
const api = require(`@top-gg/sdk`);
const { topggapi } = require(`../../../config.json`);
const vote = new api.Api(topggapi);
const badge = require(`./badges.json`);
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Badges extends AvonCommand{
    get name(){ return 'profile'; }
    get aliases(){ return ['badges','badge','pr']; }
    get cat(){ return 'info' }
    get vote(){ return true; }
    async run(client, message, args, prefix){
        try{
            let badges = '';
            let member = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
            let guild  = await client.guilds.fetch('1102574606289739788');
            let user   = await guild.members.fetch(member.id).catch(() => {
                badges += `\`No Badges Available\`\nYou must be in our [support server](${client.config.server}) to get badges.\nJoin **[here](${client.config.server})**.`;
            });
            let voted = await vote.hasVoted(member.id);

            try{
                let sys = user.roles.cache;
                if(sys.has(badge.dev))       badges += `\n${client.emoji.dev} **Developer**`;
                if(sys.has(badge.owner))     badges += `\n${client.emoji.owner} **Owner**`;
                if(sys.has(badge.codev))     badges += `\n${client.emoji.codev} **Co-Developer**`;
                if(sys.has(badge.admin))     badges += `\n${client.emoji.admin} **Admin**`;
                if(sys.has(badge.supporter)) badges += `\n${client.emoji.supporter} **Supporter**`;
                if(sys.has(badge.vip))       badges += `\n${client.emoji.vip} **Vip**`;
                if(sys.has(badge.staff))     badges += `\n${client.emoji.staff} **Staff**`;
                if(sys.has(badge.friend))    badges += `\n${client.emoji.friend} **Friends**`;
                if(sys.has(badge.bug))       badges += `\n${client.emoji.bug} **Bug Hunter**`;
                if(voted)                    badges += `\n${client.emoji.voter} **Voter**`;
                if(badges === '')            badges += `\n${client.emoji.users} **User**`;
            } catch(e){
                badges = `\`No Badges Available\`\nYou must be in our [support server](${client.config.server}) to get badges.\nJoin **[here](${client.config.server})**.`;
            }

            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Profile for ${member.tag}**\n\n__BADGES__\n${badges}`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(member.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        } catch(e){
            console.log(e);
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Profile — Badges**\n\n\`No Badges Available\`\nYou must be in our [support server](${client.config.server}) to get badges.\nJoin **[here](${client.config.server})**.`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        }
    }
}
module.exports = Badges;
