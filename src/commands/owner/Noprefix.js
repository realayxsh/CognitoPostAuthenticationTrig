const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Noprefix extends AvonCommand{
    get name(){ return 'noprefix'; }
    get aliases(){ return ['np','nop']; }
    async run(client, message, args, prefix){
        try{
            let ok = ["282494845753491456"];
            if(!ok.includes(message.author.id)) return;

            const send = (text, thumb) => {
                const section = new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
                if(thumb) section.setThumbnailAccessory(new ThumbnailBuilder().setURL(thumb));
                const container = new ContainerBuilder().addSectionComponents(section);
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };

            if(!args[0]) return send(`${client.emoji.cross} | Usage: \`${prefix}noprefix <add/remove/show> <user/user_id> <server/all>\``);

            let op = args[0].toLowerCase();

            if(op === `add`){
                let us = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
                if(!us) return send(`${client.emoji.cross} | Please provide a valid user`);
                let pk = args[2];
                if(pk === `all`){
                    let db = await client.data2.get(`noprefix_${client.user.id}`);
                    if(!db || db === null) client.data.set(`noprefix_${client.user.id}`, []);
                    let um = [];
                    db.forEach(x => um.push(x));
                    if(um.includes(us.id)) return send(`${client.emoji.tick} | This user is already in all-server no prefix`);
                    um.push(us.id);
                    await client.data2.set(`noprefix_${client.user.id}`, um);
                    return send(`${client.emoji.tick} | Added ${us} to all-server no prefix`);
                } else {
                    let guild = await client.guilds.fetch(args[2]);
                    if(!guild) return send(`${client.emoji.cross} | Please provide a valid server`);
                    let db2 = await client.data2.get(`noprefix_${guild.id}`);
                    if(!db2 || db2 === null) client.data2.set(`noprefix_${guild.id}`, []);
                    let oo = [];
                    db2.forEach(x => oo.push(x));
                    if(oo.includes(message.author.id)) return send(`${client.emoji.cross} | This user is already in ${guild.name}'s no prefix`);
                    oo.push(us.id);
                    await client.data2.set(`noprefix_${guild.id}`, oo);
                    return send(`${client.emoji.tick} | Added ${us} to ${guild.name}'s no prefix`);
                }
            }

            if(op === `remove`){
                let us = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
                if(!us) return send(`${client.emoji.cross} | Please provide a valid user`);
                let pk = args[2];
                if(pk === `all`){
                    let db = await client.data2.get(`noprefix_${client.user.id}`);
                    if(!db || db === null) client.data.set(`noprefix_${client.user.id}`, []);
                    let um = [];
                    db.forEach(x => um.push(x));
                    if(!um.includes(us.id)) return send(`${client.emoji.tick} | This user is not in all-server no prefix`);
                    let bhai = um.filter(x => x !== us.id);
                    await client.data2.set(`noprefix_${client.user.id}`, bhai);
                    return send(`${client.emoji.tick} | Removed ${us} from all-server no prefix`);
                } else {
                    let guild = await client.guilds.fetch(args[2]);
                    if(!guild) return send(`${client.emoji.cross} | Please provide a valid server`);
                    let db2 = await client.data2.get(`noprefix_${guild.id}`);
                    if(!db2 || db2 === null) client.data2.set(`noprefix_${guild.id}`, []);
                    let oo = [];
                    db2.forEach(x => oo.push(x));
                    if(!oo.includes(message.author.id)) return send(`${client.emoji.cross} | This user is not in ${guild.name}'s no prefix`);
                    let sh = oo.filter(x => x !== us.id);
                    await client.data2.set(`noprefix_${guild.id}`, sh);
                    return send(`${client.emoji.tick} | Removed ${us} from ${guild.name}'s no prefix`);
                }
            }

            if(op === `show` || op === `list`){
                let pk = args[1];
                if(pk === `all`){
                    let db = await client.data2.get(`noprefix_${client.user.id}`);
                    if(!db || db === null) return send(`${client.emoji.cross} | No users.`);
                    let lol = [];
                    let index = 1;
                    db.forEach(x => lol.push(`\`${index++}\` <@${x}> | ${x}`));
                    return send(`**| All Server's No-Prefix List**\n\n${lol.sort().join('\n')}`, message.author.displayAvatarURL({ dynamic: true }));
                } else {
                    let guild = await client.guilds.fetch(args[1]);
                    if(!guild) return send(`${client.emoji.cross} | Please provide a valid server`);
                    let db = await client.data.get(`noprefix_${guild.id}`);
                    if(!db || db === null) return send(`${client.emoji.cross} | No users`);
                    let lu = [];
                    let index = 1;
                    db.forEach(x => lu.push(`\`${index++}\` <@${x}> | ${x}`));
                    return send(`**| ${guild.name}'s No-Prefix List**\n\n${lu.sort().join('\n')}`, guild.iconURL({ dynamic: true }));
                }
            }
        } catch(e){ console.log(e) }
    }
}
module.exports = Noprefix;
