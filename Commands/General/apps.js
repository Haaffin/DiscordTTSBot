const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
            .setName(`apps`)
            .setDescription(`Returns a link to the BingBong website`),
    
    async execute(interaction) {
        await interaction.reply({ content: 'You can find a list of BingBong Apps [here](https://bingbong.ddns.net)', ephemeral: true })
    }
    
}