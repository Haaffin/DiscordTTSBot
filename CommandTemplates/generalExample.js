const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
            .setName(`name`)
            .setDescription(`Description`),
    
    async execute(interaction) {
        //code here
    }
    
}