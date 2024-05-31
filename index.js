const { Client, Events, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require('fs');
const path = require('path');

const {token, speech_key, speech_region } = require('./config.json')

// Bot Init
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

const AZURE_VOICE_STYLES = [
    "angry",
    "cheerful",
    "excited",
    "hopeful",
    "sad",
    "shouting",
    "terrified",
    "unfriendly",
    "whispering",
    "Default"
];

const AZURE_PREFIXES = {
    "(angry)" : "angry",
    "(cheerful)" : "cheerful",
    "(excited)" : "excited",
    "(hopeful)" : "hopeful",
    "(sad)" : "sad",
    "(shouting)" : "shouting",
    "(shout)" : "shouting",
    "(terrified)" : "terrified",
    "(unfriendly)" : "unfriendly",
    "(whispering)" : "whispering",
    "(whisper)" : "whispering",
    "(default)" : "Default",
};

let ttsQueue = [];
let isPlaying = false;

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.channel.name.toLowerCase() === 'tts') {
        if (!message.member.voice.channel) {
            return message.reply('You need to join a voice channel first!');
        }

        // Add message to queue
        ttsQueue.push(message);
        if (!isPlaying) {
            playNext(message.member.voice.channel);
        }
    }
});

async function playNext(voiceChannel) {
    if (ttsQueue.length === 0) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    const message = ttsQueue.shift();

    // Extract voice style and text from the message content
    const { voiceStyle, text } = extractVoiceStyleAndText(message.content);

    // TTS Init
    const randomInt = Math.floor(Math.random() * 10000) + 1;
    const audioFile = `${message.author.displayName}-${randomInt}.mp3`;
    const tempFileName = path.join(__dirname, audioFile);
    const SPEECH_KEY = speech_key;
    const SPEECH_REGION = speech_region;

    const voice_name = 'en-US-DavisNeural';

    const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tempFileName);

    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    const ssml_text = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xmlns:emo='http://www.w3.org/2009/10/emotionml' xml:lang='en-US'><voice name='${voice_name}'><mstts:express-as style='${voiceStyle}'>${text}</mstts:express-as></voice></speak>`;

    speechSynthesizer.speakSsmlAsync(ssml_text,
        async function (result) {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("SynthesizingAudioCompleted result");

                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(tempFileName);
                player.play(resource);

                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    console.log("Audio playback finished");
                    fs.unlinkSync(tempFileName);  // Delete the audio file after playing
                    playNext(voiceChannel);
                });

                player.on('error', error => {
                    console.error(error);
                    fs.unlinkSync(tempFileName);  // Delete the audio file in case of error
                    playNext(voiceChannel);
                });

            } else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
            speechSynthesizer.close();
        },
        function (err) {
            console.trace("err - " + err);
            speechSynthesizer.close();
        });
}

function extractVoiceStyleAndText(messageContent) {
    for (let prefix in AZURE_PREFIXES) {
        if (messageContent.startsWith(prefix)) {
            const voiceStyle = AZURE_PREFIXES[prefix];
            const text = messageContent.replace(prefix, '').trim();
            return { voiceStyle, text };
        }
    }
    // Default to "Default" style if no prefix is found
    return { voiceStyle: "Default", text: messageContent };
}




// Log in to Discord with your client's token
client.login(token);
