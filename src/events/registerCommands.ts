import { type EventData } from '..'
import { ApplicationCommandData } from 'discord.js'

export default {
    name: 'ready',
    run: (client) => {
        const commands = [...client.commands.values()].map(c => c.data) as ApplicationCommandData[]

        client.testGuilds?.forEach(guild => {
            client.guilds.cache.get(guild)?.commands.set(commands)
        })

        client.application?.commands.set(client.testGuilds ? [] : commands)
    }
} as EventData<'ready'>