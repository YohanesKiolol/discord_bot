const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  MessageFlags,
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
        .addIntegerOption((option) =>
          option
            .setName("limit")
            .setDescription("The limit of the voice channel")
            .setMinValue(1)
            .setMaxValue(99)
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Custom name for this trigger channel setup")
        )
    )
    .addSubcommand((command) =>
      command
        .setName("remove")
        .setDescription("Remove a specific trigger channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The trigger channel to remove")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("list")
        .setDescription("List all trigger channels in this server")
    )
    .addSubcommand((command) =>
      command
        .setName("disable")
        .setDescription("Disable all voice channel creation systems")
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
    const { options } = interaction;
    const sub = options.getSubcommand();

    async function sendMessage(message) {
      const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(message);

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

        const channel = options.getChannel("channel");
        const limit = options.getInteger("limit");
        const customName = options.getString("name");

        // Check if this specific channel is already a trigger channel
        const existingChannel = await vccreate.findOne({
          Guild: interaction.guild.id,
          Channel: channel.id,
        });

        if (existingChannel) {
          return await sendMessage(
            `⚠️ <#${channel.id}> is already set up as a trigger channel.`
          );
        }

        await vccreate.create({
          Guild: interaction.guild.id,
          Channel: channel.id,
          Limit: limit,
          Category: channel.parentId,
          Name: customName || `Trigger ${channel.name}`,
        });

        await sendMessage(
          `🌍 Voice channel creation system has been set up in <#${
            channel.id
          }> with limit \`${limit || "unlimited"}\`${
            customName ? ` and name \`${customName}\`` : ""
          }.`
        );
        break;

      case "remove":
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return await sendMessage(
            "⚠️ Only administrators can use this command."
          );
        }

        const channelToRemove = options.getChannel("channel");
        const triggerChannel = await vccreate.findOne({
          Guild: interaction.guild.id,
          Channel: channelToRemove.id,
        });

        if (!triggerChannel) {
          return await sendMessage(
            `⚠️ <#${channelToRemove.id}> is not set up as a trigger channel.`
          );
        }

        await vccreate.deleteOne({
          Guild: interaction.guild.id,
          Channel: channelToRemove.id,
        });

        await sendMessage(
          `🗑️ Trigger channel <#${channelToRemove.id}> has been removed.`
        );
        break;

      case "list":
        const allTriggerChannels = await vccreate.find({
          Guild: interaction.guild.id,
        });

        if (allTriggerChannels.length === 0) {
          return await sendMessage(
            "⚠️ No trigger channels are set up in this server."
          );
        }

        const channelList = allTriggerChannels
          .map(
            (tc, index) =>
              `${index + 1}. <#${tc.Channel}> - Limit: \`${
                tc.Limit || "unlimited"
              }\` - Name: \`${tc.Name || "N/A"}\``
          )
          .join("\n");

        const embed = new EmbedBuilder()
          .setColor("Blurple")
          .setTitle("🌍 Trigger Channels")
          .setDescription(channelList)
          .setFooter({
            text: `Total: ${allTriggerChannels.length} trigger channel(s)`,
          });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

        const allChannels = await vccreate.find({
          Guild: interaction.guild.id,
        });
        if (allChannels.length === 0) {
          return await sendMessage(
            "⚠️ No voice channel creation systems are set up."
          );
        }

        await vccreate.deleteMany({ Guild: interaction.guild.id });
        await sendMessage(
          `🌍 All voice channel creation systems (${allChannels.length}) have been disabled.`
        );
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
