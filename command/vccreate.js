const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const vccreate = require("../schema/vccreate");
const vccreateuser = require("../schema/vccreateuser");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vccreate")
    .setDescription("Create a voice channel")
    .addSubcommand((command) =>
      command
        .setName("setup")
        .setDescription("Setup a voice channel creation system")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to send the creation vc")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the voice channel")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("limit")
            .setDescription("The limit of the voice channel")
            .setMinValue(1)
            .setMaxValue(99)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("disable")
        .setDescription("Disable the voice channel creation system")
    )
    .addSubcommand((command) =>
      command
        .setName("rename")
        .setDescription("Rename your voice channel")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The new name of the voice channel")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const options = interaction;
    const sub = options.getSubcommand();
    const serverData = await vccreate.findOne({ Guild: interaction.guild.id });

    async function sendMessage(message) {
      const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(message);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    switch (sub) {
      case "setup":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return await sendMessage(
            "⚠️ Only administrators can use this command."
          );
        }
        if (serverData) {
          return await sendMessage(
            "⚠️ Voice channel creation system is already set up."
          );
        } else {
          const channel = options.getChannel("channel");
          const name = options.getString("name");
          const limit = options.getInteger("limit");

          await vccreate.create({
            Guild: interaction.guild.id,
            Channel: channel.id,
            Name: name,
            Limit: limit,
            Category: channel.parentId,
          });

          await sendMessage(
            `🌍 Voice channel creation system has been set up in <#${channel.id}> with the name \`${name}\` and limit \`${limit}\`.`
          );
        }
        break;
      case "disable":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return await sendMessage(
            "⚠️ Only administrators can use this command."
          );
        }
        if (!serverData) {
          return await sendMessage(
            "⚠️ Voice channel creation system is not set up yet."
          );
        } else {
          vccreate.deleteOne({ Guild: interaction.guild.id });
          await sendMessage(
            "🌍 Voice channel creation system has been disabled."
          );
        }
        break;
      case "rename":
        const userData = await vccreateuser.findOne({
          User: interaction.user.id,
          Guild: interaction.guild.id,
        });
        if (!userData) {
          return await sendMessage("⚠️ You dont own a voice channel.");
        } else {
          const rename = options.getString("name");
          const vc = await interaction.guild.channels.fetch(userData.Channel);
          if (!vc) {
            return await sendMessage("⚠️ The voice channel does not exist.");
          }

          try {
            await vc.setName(rename);
            await sendMessage(
              `✅ The voice channel has been renamed to \`${rename}\`.`
            );
          } catch (error) {
            console.error(error);
            await sendMessage(
              "⚠️ An error occurred while renaming the voice channel."
            );
          }
        }
        break;
    }
  },
};
