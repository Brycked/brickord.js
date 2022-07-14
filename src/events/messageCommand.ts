import { EventData, ChatCommand, CommandNotFound, CommandError, TooManyArguments, AttachmentNotFound, getBoolean, getMember, getChannel, getRole, getMentionable, getInt, getNumber, MissingRequiredArgument } from '..'
import { MessagePayload, ReplyMessageOptions, Message, CommandInteraction } from 'discord.js'

export default {
    name: 'messageCreate',
    run: async (client, message) => {
        if (message.author.bot) return
        
        let prefix = (await client.prefix.resolve(message)).find((prefix) =>
            typeof(prefix) === 'string'
            ? message.content.toLowerCase().startsWith(prefix)
            : prefix?.test(message.content)
        )

        if (!prefix) return
        
        const options = message.content.replace(prefix, '').trim().split(/ +/g)
        const name = options.shift()?.toLowerCase()!
        
        let command = client.commands.get(name)

        const attachments = message.attachments.toJSON()
        
        try {
            if (!command) throw new CommandNotFound(name)

            if (!command.data.options)
                command.data.options = []
                
            if (options.length > command.data.options.length)
                throw new TooManyArguments(command.data.options.length, options.length)
                
            const args = await Promise.all(command.data.options.map(async (option, i) => {
                const query: string = options[i]
                if (!query)
                    if (option.required)
                        throw new MissingRequiredArgument(option.name)
                    else return
                
                const arg = await (
                    async () => {switch (option.type) {
                        case 3: return query
                        case 4: return getInt(query)
                        case 5: return getBoolean(query)
                        case 6: return await getMember(message, query)
                        case 7: return getChannel(message, query)
                        case 8: return getRole(message, query)
                        case 9: return getMentionable(message, query)
                        case 10: return getNumber(query)
                        case 11: 
                            const result = attachments.shift()
                            if (!result) throw new AttachmentNotFound()
                            return result
                    }
                })()
                return arg
            }))

            const context = Object.assign(message, {
                commandData: command,
                reply: sendDefaultMessage(message.reply, message, command)
            })

            command.run(context, ...args)
        }
        catch (err) {
            if(err instanceof CommandError)
                client.emit('commandError', message, err)
            else
                console.error(err)
        }
    }
} as EventData<'messageCreate'>

export function sendDefaultMessage(func: Message['reply'], object: Object, command: ChatCommand) {
    function send(options: Parameters<Message['reply']>[0]){
        if (typeof(options) === 'string')
            options = {
                embeds: [{
                    description: options
                }]
            }
        
        if ('embeds' in options && options.embeds)
            options.embeds = options.embeds.map(e => ({
                title: command.data.name.replace(/\b\w/g, c => c.toUpperCase()),
                color: 'BLURPLE',
                ...e
            }) as Exclude<ReplyMessageOptions['embeds'], undefined>[number])
            
        return func.bind(object)(options)
    }
    return send
}