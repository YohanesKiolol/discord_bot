const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  MessageFlags,
} = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prank")
    .setDescription("Play a scary sound in a voice channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The voice channel to prank")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("sound")
        .setDescription("Choose a scary sound")
        .setRequired(true)
        .addChoices(
          { name: "👻 Scream", value: "scream" },
          { name: "😱 Horror Ambient", value: "horror" },
          { name: "🔪 Jumpscare", value: "jumpscare" },
          { name: "👹 Evil Laugh", value: "laugh" },
          { name: "🚪 Door Creak", value: "door" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("volume")
        .setDescription("Volume level (1-100, default: 100)")
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addBooleanOption((option) =>
      option
        .setName("stealth")
        .setDescription(
          "Wait for someone to speak before playing (more sneaky)"
        )
    )
    .addUserOption((option) =>
      option
        .setName("disguise")
        .setDescription(
          "Disguise the bot as this user (changes nickname temporarily)"
        )
    ),
  async execute(interaction) {
    // Check permissions
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers)
    ) {
      return await interaction.reply({
        content: "⚠️ You need 'Mute Members' permission to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.options.getChannel("channel");
    const soundChoice = interaction.options.getString("sound");
    const volume = (interaction.options.getInteger("volume") || 100) / 100;
    const stealth = interaction.options.getBoolean("stealth") || false;
    const disguiseUser = interaction.options.getUser("disguise");

    // Validate it's a voice channel
    if (channel.type !== 2) {
      // 2 = GuildVoice
      return await interaction.reply({
        content: "⚠️ Please select a voice channel!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check if anyone is in the channel
    if (channel.members.size === 0) {
      return await interaction.reply({
        content: "⚠️ No one is in that voice channel!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Map sound choices to file names (you'll need to add actual sound files)
    const soundFiles = {
      scream: "scream.mp3",
      horror: "horror.mp3",
      jumpscare: "jumpscare.mp3",
      laugh: "laugh.mp3",
      door: "door.mp3",
    };

    const soundFile = soundFiles[soundChoice];
    const soundPath = path.join(__dirname, "..", "sounds", soundFile);

    // Check if sound file exists
    if (!fs.existsSync(soundPath)) {
      return await interaction.reply({
        content: `⚠️ Sound file not found! Please add \`${soundFile}\` to the sounds folder.\n\n**Quick Setup:**\n1. Create a \`sounds\` folder in your bot directory\n2. Add MP3 files with these names: ${Object.values(
          soundFiles
        ).join(
          ", "
        )}\n3. You can download free scary sounds from freesound.org or similar sites`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Store original bot nickname to restore later
    let originalNickname = null;
    let shouldRestoreNickname = false;
    let disguiseName = null;

    try {
      // Defer reply since this might take a moment
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error("Failed to defer reply:", error);
      return; // Interaction already handled
    }

    try {
      const botMember = await interaction.guild.members.fetch(
        interaction.client.user.id
      );
      originalNickname = botMember.nickname;

      // Determine disguise name
      if (disguiseUser) {
        // If user is specified, use their name
        const targetMember = await interaction.guild.members.fetch(
          disguiseUser.id
        );
        disguiseName = targetMember.displayName || disguiseUser.username;
      } else if (process.env.DISGUISE_NAME) {
        // If no user specified but DISGUISE_NAME exists, use it
        disguiseName = process.env.DISGUISE_NAME;
      }

      // Apply disguise if we have a name
      if (disguiseName) {
        await botMember.setNickname(disguiseName);
        shouldRestoreNickname = true;

        await interaction.editReply({
          content: `🎭 Disguised as "${disguiseName}"... Executing prank... 🎃`,
        });
      } else {
        await interaction.editReply({
          content: `👻 Executing prank... 🎃`,
        });
      }

      // Join the voice channel
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      // Wait for connection to be ready
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      // If stealth mode, wait a few seconds for people to ignore the join
      if (stealth) {
        await interaction.editReply({
          content: `🤫 Stealth mode: Waiting for the right moment...`,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
      }

      // Create audio player with volume control
      const player = createAudioPlayer();
      const resource = createAudioResource(soundPath, {
        inlineVolume: true,
      });

      // Set volume
      if (resource.volume) {
        resource.volume.setVolume(volume);
      }

      // Subscribe connection to player and play immediately
      connection.subscribe(player);
      player.play(resource);

      // When audio finishes, disconnect immediately and restore nickname
      player.on(AudioPlayerStatus.Idle, async () => {
        connection.destroy();

        // Restore original nickname after prank
        if (shouldRestoreNickname) {
          setTimeout(async () => {
            try {
              const botMember = await interaction.guild.members.fetch(
                interaction.client.user.id
              );
              await botMember.setNickname(originalNickname);
            } catch (err) {
              console.error("Failed to restore nickname:", err);
            }
          }, 1000); // Wait 1 second before restoring
        }
      });

      // Safety timeout - force disconnect after 15 seconds
      setTimeout(async () => {
        if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
          connection.destroy();
        }

        // Also restore nickname in timeout
        if (shouldRestoreNickname) {
          try {
            const botMember = await interaction.guild.members.fetch(
              interaction.client.user.id
            );
            await botMember.setNickname(originalNickname);
          } catch (err) {
            console.error("Failed to restore nickname in timeout:", err);
          }
        }
      }, 15000);

      // Update reply when done
      setTimeout(async () => {
        await interaction.editReply({
          content: `✅ Prank completed! 😈\nPlayed **${
            soundChoice.charAt(0).toUpperCase() + soundChoice.slice(1)
          }** in ${channel.name}${
            disguiseName ? `\n🎭 Disguised as "${disguiseName}"` : ""
          }`,
        });
      }, 2000);
    } catch (error) {
      console.error("Error executing prank:", error);

      // Restore nickname even if error occurs
      if (shouldRestoreNickname && originalNickname !== null) {
        try {
          const botMember = await interaction.guild.members.fetch(
            interaction.client.user.id
          );
          await botMember.setNickname(originalNickname);
        } catch (err) {
          console.error("Failed to restore nickname after error:", err);
        }
      }

      // Try to edit reply, but don't crash if it fails
      try {
        await interaction.editReply({
          content: `⚠️ Failed to execute prank: ${error.message}`,
        });
      } catch (editError) {
        console.error("Failed to edit reply:", editError);
      }
    }
  },
};
