require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  ChannelType,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');

const requiredEnvironment = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
const deporterUserId = '1522959087153713238';
const sayUserIds = new Set(['1522959087153713238', '967075477267308544']);
const bookingApproverIds = new Set(['1522959087153713238', '967075477267308544']);
const gioFannysApproverIds = new Set(['1522959087153713238', '1502522046071046208']);
const prescribeUserIds = new Set(['967075477267308544', '1522959087153713238', '1535469368786292808']);
const logChannelId = '1549790069253210132';
const diveAndSpreadChannelId = '1549796995592618065';
const papSmearChannelId = '1549797031042621553';
const pharmacyChannelId = '1549801940198629406';
const scanChannelId = '1550037247070437416';
const purchaseChannelId = '1549804205336698900';
const dmCategoryId = '1549789771159568456';
const dmUserId = '1522959087153713238';
const noCooldownUserIds = new Set(['1522959087153713238', '967075477267308544']);
const superAdminUserIds = new Set(['1522959087153713238']);
const activeDmChannels = new Map();
const dmChannelRecipients = new Map();
const activeBookings = new Map();
const appointmentLocks = new Set();
const unauthorizedBookingAttempts = new Map();
const interactionCooldowns = new Map();

// ============================================================
// ECONOMY SETTINGS
// ============================================================
const WORK_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ROB_COOLDOWN_MS = 30 * 60 * 1000;
const CRIME_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SCAN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// ============================================================
// WORK / CRIME EMBED SETTINGS - EDIT THESE
// ============================================================
const WORK_EMBED_TITLE = 'Thanks for slaving away!';
const WORK_EMBED_COLOR = 0x57f287;
const CRIME_SUCCESS_EMBED_TITLE = 'You cheeky bugger';
const CRIME_SUCCESS_EMBED_COLOR = 0x57f287;
const CRIME_FAILURE_EMBED_TITLE = 'You got busted!';
const CRIME_FAILURE_EMBED_COLOR = 0xed4245;
const SCAN_EMBED_TITLE = 'Scan complete';
const SCAN_EMBED_COLOR = 0x5865f2;

// ============================================================
// WORK OPTIONS - EDIT THESE
// ============================================================
const WORK_OPTIONS = [
  // WORK OPTION 1
  { text: 'You danced on a stripping pole at a strip club', payout: 700 },
  // WORK OPTION 2
  { text: 'You worked as a doctor at Britney\'s STD/STI Clinic for a day.', payout: 750 },
  // WORK OPTION 3
  { text: 'You worked as a doordasher for kyle.', payout: 1000 },
  // WORK OPTION 4
  { text: 'You helped gio get past his Grindr ban, he was very grateful.', payout: 1500 },
  // WORK OPTION 5
  { text: 'You set up Britney with a man, Polo found out, but she still payed you anyway because he had a big dick.', payout: 2000 },
];

// ============================================================
// CRIME OPTIONS - EDIT THESE
// ============================================================
const CRIME_OPTIONS = [
  // CRIME OPTION 1
  { text: 'You emptied out a homeless person\'s money jar and took their money.', payout: 50, bust_chance: 0.15, fine: 2000 },
  // CRIME OPTION 2
  { text: 'You robbed pnds adult store.', payout: 1000, bust_chance: 0.10, fine: 6000 },
  // CRIME OPTION 3
  { text: 'You stole the operation tools from Britney\'s STD/STI Clinic and sold them.', payout: 15000, bust_chance: 0.20, fine: 7500 },
  // CRIME OPTION 4
  { text: 'You smuggled drugs across the border, and gio didnt catch you.', payout: 20000, bust_chance: 0.05, fine: 13000 },
  // CRIME OPTION 5
  { text: 'You stole hard drugs from Kia\'s STD/STI Pharmacy and sold them, you got more than you expected.', payout: 25000, bust_chance: 0.10, fine: 15000 },
];

// ============================================================
// SCAN OPTIONS - EDIT THESE
// ============================================================
const SCAN_OPTIONS = [
  { text: 'You put your finger up their ass and found cocaine.', payout: 6000 },
  { text: 'While conducting a pat search, you notice a bulge that looks like a gun, it was not a gun.', payout: 0 },
  { text: 'While conducting a pat down you found a dildo shoved up their ass, you take out the dildo and notice methamphetamine was hidden inside of the dildo. Dildo was taken for examination', payout: 1300 },
  { text: 'While doing a bag search at the immigration checkpoint, you found a hidden compartment with MDMA.', payout: 1200 },
  { text: 'You noticed a potentially dangerous individual who was about to board a flight, you stop them and search their carry on, which looks like its bursting at the seams, you found a gun and a bomb.', payout: 2900 },
];

// ============================================================
// SHOP PRODUCTS - EDIT THESE 30 SPACES
// ============================================================
const SHOP_PRODUCTS = [
  { name: 'Realistic 5 Inch Dildo', price: 200 },
  { name: 'Realistic 6 Inch Dildo', price: 300 },
  { name: 'Realistic 7 Inch Dildo', price: 400 },
  { name: 'Realistic 8 Inch Dildo', price: 500 },
  { name: 'Realistic 9 Inch Dildo', price: 600 },
  { name: 'Realistic 10 Inch Dildo', price: 700 },
  { name: 'Squirting Dildo 7.5 Inch Realistic Dildo', price: 850 },
  { name: 'Monster Hole Stretching 11 Inch Dildo', price: 970 },
  { name: 'Rose Toy', price: 200 },
  { name: 'Vibrating Dildo 8 Inch', price: 970 },
  { name: 'Male Sex Doll', price: 1400 },
  { name: 'Women Sex Doll', price: 1350 },
  { name: 'Tight Pocket Pussy', price: 300 },
  { name: 'Used Dildo 5 Inch', price: 100 },
  { name: 'Used Dildo 6 Inch', price: 120 },
  { name: 'Used Dildo 7 Inch', price: 140 },
  { name: 'Used Dildo 8 Inch', price: 160 },
  { name: 'Used Dildo 9 Inch', price: 180 },
  { name: 'Used Dildo 10 Inch', price: 200 },
  { name: 'Used Pocket Pussy', price: 70 },
  { name: 'Cock Ring', price: 150 },
  { name: 'Lovense Sex Machine (Attachable to Dildo)', price: 1000 },
  { name: 'Lovense Cock Ring and Vibrator', price: 400 },
];

const dataDirectory = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const economyFilePath = path.join(dataDirectory, 'economy.json');
const robCooldowns = new Map();
const workCooldowns = new Map();
const crimeCooldowns = new Map();
const scanCooldowns = new Map();

function loadEconomy() {
  try {
    return JSON.parse(fs.readFileSync(economyFilePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not load economy data:', error.message);
    return { users: {}, approvedAppointments: {}, appointments: {} };
  }
}

const economy = loadEconomy();
economy.users ||= {};
economy.approvedAppointments ||= {};
economy.appointments ||= {};

function saveEconomy() {
  fs.mkdirSync(path.dirname(economyFilePath), { recursive: true });
  const temporaryPath = `${economyFilePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(economy, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, economyFilePath);
}

function getAccount(userId) {
  economy.users[userId] ||= { wallet: 0, bank: 0 };
  return economy.users[userId];
}

function formatMoney(amount) {
  return amount < 0 ? `-$${Math.abs(amount).toLocaleString('en-US')}` : `$${amount.toLocaleString('en-US')}`;
}

function formatBalances(account) {
  return `Wallet: ${formatMoney(account.wallet)}\nBank: ${formatMoney(account.bank)}`;
}

function isSuperAdmin(userId) {
  return superAdminUserIds.has(userId);
}

function cooldownMessage(cooldowns, userId, cooldownMs) {
  if (noCooldownUserIds.has(userId)) return null;
  const expiresAt = cooldowns.get(userId) || 0;
  if (expiresAt <= Date.now()) return null;
  const seconds = Math.ceil((expiresAt - Date.now()) / 1000);
  const minutes = Math.ceil(seconds / 60);
  return `Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} before using this again.`;
}

function takeFine(account, fine) {
  const walletTaken = Math.min(Math.max(account.wallet, 0), fine);
  account.wallet -= walletTaken;
  account.bank -= fine - walletTaken;
}

function hasResponded(interaction) {
  return interaction.replied || interaction.deferred;
}

async function respondToInteraction(interaction, payload) {
  try {
    if (hasResponded(interaction)) return await interaction.editReply(payload);
    return await interaction.reply(payload);
  } catch (error) {
    console.error('Could not respond to interaction:', error.message);
    return null;
  }
}

function parseTimeoutDuration(input) {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized || !/^(?:\d+d\s*)?(?:\d+hr?\s*)?(?:\d+m\s*)?$/.test(normalized)) return null;

  const matches = [...normalized.matchAll(/(\d+)\s*(d|hr?|m)/g)];
  if (!matches.length || matches.map((match) => match[0]).join('').replace(/\s/g, '') !== normalized.replace(/\s/g, '')) return null;

  let milliseconds = 0;
  const units = { d: 24 * 60 * 60 * 1000, h: 60 * 60 * 1000, hr: 60 * 60 * 1000, m: 60 * 1000 };
  for (const [, amountText, unit] of matches) milliseconds += Number(amountText) * units[unit];
  return Number.isSafeInteger(milliseconds) && milliseconds > 0 && milliseconds <= 28 * 24 * 60 * 60 * 1000
    ? milliseconds
    : null;
}

function rememberUnauthorizedBookingAttempt(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const record = unauthorizedBookingAttempts.get(key) || { count: 0, expiresAt: 0 };
  if (record.expiresAt <= Date.now()) record.count = 0;
  record.count += 1;
  record.expiresAt = Date.now() + 5 * 60 * 1000;
  unauthorizedBookingAttempts.set(key, record);
  return record.count;
}

function bookingApproversFor(clinicCode) {
  return clinicCode === 'gio-fannys' ? gioFannysApproverIds : bookingApproverIds;
}

if (missingEnvironment.length > 0) {
  console.error(`Missing environment variables: ${missingEnvironment.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the Discord application values.');
  process.exitCode = 1;
  return;
}

const bookingOptions = [
  {
    name: 'Britney\'s Dive and Spread Clinic',
    value: 'Britney\'s Dive and Spread Clinic',
  },
  {
    name: 'Britney\'s Pap Smear Clinic',
    value: 'Britney\'s Pap Smear Clinic',
  },
];

const commands = [
  new SlashCommandBuilder()
    .setName('deport')
    .setDescription('Deport a member from the server.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member to deport.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Why the member is being deported.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder()
    .setName('arrest')
    .setDescription('Timeout a member for a specified duration.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member to arrest.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('Duration such as 25m, 1hr, or 2d 5hr 30m.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Why the member is being arrested.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The server member to message.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message to send.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('book')
    .setDescription('Book an appointment at one of Britney\'s clinics.')
    .addStringOption((option) =>
      option
        .setName('clinic')
        .setDescription('Choose who you are booking an appointment with.')
        .setRequired(true)
        .addChoices(...bookingOptions),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the appointment.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('date-time')
        .setDescription('The requested appointment date and time.')
        .setRequired(true)
        .setMaxLength(24),
    ),
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Repeat a message in this channel.')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message for the bot to repeat.')
        .setRequired(true)
        .setMaxLength(2000),
    ),
  new SlashCommandBuilder()
    .setName('cancel-booking')
    .setDescription('Cancel an active appointment booking.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose appointment should be cancelled.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Why the appointment is being cancelled.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('finish-appointment')
    .setDescription('Mark an active appointment as finished.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose appointment is finished.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages from this channel.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The number of messages to delete, from 1 to 100.')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Deposit all of your wallet money into your bank.'),
  new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw money from your bank into your wallet.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The whole-dollar amount to withdraw.')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(999000000000000),
    ),
  new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('View a user\'s wallet and bank balances.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose wallet and bank you want to view.')
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Attempt to rob another user\'s wallet.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose wallet you want to rob.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work a job for a random payout.'),
  new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Attempt a crime for a risky payout.'),
  new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Scan a user for a random payout.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user being scanned.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('prescribe')
    .setDescription('Prescribe medication to a user.')
    .addStringOption((option) =>
      option
        .setName('medicine')
        .setDescription('The medicine being prescribed.')
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user receiving the prescription.')
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName('purchase')
    .setDescription('Purchase an item from the shop.')
    .addStringOption((option) =>
      option
        .setName('item')
        .setDescription('The item to purchase.')
        .setRequired(true)
        .addChoices(...SHOP_PRODUCTS
          .filter((product) => product.name.trim() && product.price > 0)
          .map((product) => ({ name: product.name, value: product.name }))),
    ),
  new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Pay money from your wallet to another user.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user receiving the payment.')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The whole-dollar amount to pay.')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(999000000000000),
    ),
  new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('Add money to your wallet or another user\'s wallet.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The whole-dollar amount to add.')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(999000000000000),
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user receiving the money. Leave blank to add money to yourself.')
        .setRequired(false),
    ),
].map((command) => command.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function discordTimestamp(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function dmChannelName(username) {
  const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'user';
  return `dm-with-${safeUsername}`.slice(0, 100);
}

function disabledBookingComponents(components) {
  return components.map((row) =>
    new ActionRowBuilder().addComponents(
      row.components.map((component) => ButtonBuilder.from(component).setDisabled(true)),
    ),
  );
}

async function sendLog({ title, description, user }) {
  try {
    const channel = await client.channels.fetch(logChannelId);

    if (!channel?.isTextBased()) {
      console.warn(`Log channel ${logChannelId} is not a text channel.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x2b2d31)
      .setTimestamp();

    if (user) {
      embed.setThumbnail(user.displayAvatarURL({ size: 128 }));
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Could not send log entry:', error.message);
  }
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );

  console.log(`Registered ${commands.length} slash commands for guild ${process.env.GUILD_ID}.`);
}

client.once('ready', (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}.`);
});

client.on('guildMemberAdd', async (member) => {
  await sendLog({
    title: 'Join Notification',
    description: `**${member.user.username}** has joined bonnie blue bang bus.`,
    user: member.user,
  });
});

client.on('guildMemberRemove', async (member) => {
  await sendLog({
    title: 'Leave Notification',
    description: `**${member.user.username}** has left bonnie blue bang bus.`,
    user: member.user,
  });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.author?.bot) return;

  const before = oldMessage.partial ? '(message content was unavailable)' : oldMessage.content || '(empty message)';
  const after = newMessage.content || '(empty message)';

  await sendLog({
    title: 'Message Edited',
    description: `**${newMessage.author?.username || 'Unknown user'}** edited a message on ${discordTimestamp()}\n\n**Before:**\n${before}\n\n**After:**\n${after}`,
    user: newMessage.author,
  });
});

client.on('messageDelete', async (message) => {
  if (message.author?.bot) return;

  await sendLog({
    title: 'Message Deleted',
    description: `**${message.author?.username || 'Unknown user'}** deleted a message on ${discordTimestamp()}\n\n${message.content || '(message content unavailable)'}`,
    user: message.author,
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.type !== ChannelType.DM) {
    if (message.author.id !== dmUserId) return;

    const recipientId = dmChannelRecipients.get(message.channelId);
    if (!recipientId) return;

    try {
      const recipient = await client.users.fetch(recipientId);
      const files = message.attachments.map((attachment) => ({
        attachment: attachment.url,
        name: attachment.name || undefined,
      }));

      await recipient.send({
        content: message.content || undefined,
        files,
      });
      await message.delete();
    } catch (error) {
      console.error(`Could not relay channel message to ${recipientId}:`, error.message);
    }

    return;
  }

  const dmChannelId = activeDmChannels.get(message.author.id);
  if (!dmChannelId) return;

  try {
    const responseChannel = await client.channels.fetch(dmChannelId);
    if (!responseChannel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(message.author.username)
      .setDescription(`${message.content || (message.attachments.size ? 'Media attachment' : '(message had no text content)')}\n\n${discordTimestamp()}`)
      .setColor(0x2b2d31)
      .setThumbnail(message.author.displayAvatarURL({ size: 128 }));
    const files = message.attachments.map((attachment) => ({
      attachment: attachment.url,
      name: attachment.name || undefined,
    }));

    await responseChannel.send({ embeds: [embed], files });
  } catch (error) {
    console.error(`Could not forward DM from ${message.author.tag}:`, error.message);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith('booking:')) return;
    try {
      const [, action, userId, clinicCode, encodedDateTime, appointmentId] = interaction.customId.split(':');
      const approverIds = bookingApproversFor(clinicCode);
      if (!approverIds.has(interaction.user.id)) {
        const attempts = rememberUnauthorizedBookingAttempt(interaction.guildId, interaction.user.id);
        if (attempts > 3 && interaction.member?.moderatable) {
          await interaction.member.timeout(5 * 60 * 1000, 'Repeated unauthorized appointment button clicks');
          unauthorizedBookingAttempts.delete(`${interaction.guildId}:${interaction.user.id}`);
          await respondToInteraction(interaction, { content: 'You have been timed out for 5 minutes due to repeated unauthorized appointment button clicks.', ephemeral: true });
        } else {
          await respondToInteraction(interaction, { content: "You don't have permission to approve or decline appointments.", ephemeral: true });
        }
        return;
      }

      const appointment = economy.appointments[appointmentId];
      if (!appointment || !['approve', 'decline'].includes(action) || appointment.patientId !== userId || appointment.clinicCode !== clinicCode) {
        await respondToInteraction(interaction, { content: 'This appointment button is no longer valid.', ephemeral: true });
        return;
      }
      if (appointment.status !== 'PENDING') {
        await respondToInteraction(interaction, { content: `This appointment has already been ${appointment.status.toLowerCase()}.`, ephemeral: true });
        return;
      }
      if (appointmentLocks.has(appointmentId)) {
        await respondToInteraction(interaction, { content: 'This appointment is already being processed.', ephemeral: true });
        return;
      }

      appointmentLocks.add(appointmentId);
      const approved = action === 'approve';
      appointment.status = approved ? 'ACTIVE' : 'DECLINED';
      appointment.approvedBy = approved ? interaction.user.id : null;
      appointment.decidedAt = new Date().toISOString();
      saveEconomy();

      const status = approved ? 'Approved' : 'Declined';
      const originalEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle(`Appointment ${status}`)
        .setDescription(`${originalEmbed.description}\n\n**Status:** ${status} by ${interaction.user.username} at ${discordTimestamp()}`);
      await interaction.update({ embeds: [updatedEmbed], components: disabledBookingComponents(interaction.message.components) });

      const payoutByClinic = { 'dive-spread': 600, 'pap-smear': 450 };
      let payoutMessage = '';
      if (approved && !economy.approvedAppointments[appointmentId]) {
        const payout = payoutByClinic[clinicCode] || 0;
        getAccount(interaction.user.id).wallet += payout;
        economy.approvedAppointments[appointmentId] = { approvedBy: interaction.user.id, payout, approvedAt: appointment.decidedAt };
        saveEconomy();
        if (payout > 0) payoutMessage = ` You received ${formatMoney(payout)} in your wallet.`;
      }

      try {
        const user = await client.users.fetch(userId);
        const doctorName = clinicCode === 'gio-fannys' ? 'Dr. Gio' : 'Dr. Britney';
        await user.send(approved
          ? `**Appointment Approved**\nYour appointment at ${appointment.clinicName}, with ${doctorName}, is active for ${appointment.dateTime}.\n${appointment.dateTime} • bonnie blue bang bus`
          : `**Appointment Declined**\nYour appointment at ${appointment.clinicName}, with ${doctorName}, was declined. You can reschedule.\n${appointment.dateTime} • bonnie blue bang bus`);
      } catch (error) {
        console.error(`Could not send appointment decision to ${userId}:`, error.message);
      }
      if (payoutMessage) await interaction.followUp({ content: `Appointment approved.${payoutMessage}`, ephemeral: true });
    } catch (error) {
      console.error('Error handling appointment button:', error);
      await respondToInteraction(interaction, { content: 'That appointment action could not be completed.', ephemeral: true });
    } finally {
      const appointmentId = interaction.customId.split(':')[5];
      appointmentLocks.delete(appointmentId);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (!noCooldownUserIds.has(interaction.user.id)) {
    const cooldownKey = `${interaction.user.id}:${interaction.commandName}`;
    const lastInteractionAt = interactionCooldowns.get(cooldownKey) || 0;
    if (Date.now() - lastInteractionAt < 1000) {
      await respondToInteraction(interaction, { content: 'Please wait a moment before using this command again.', ephemeral: true });
      return;
    }
    interactionCooldowns.set(cooldownKey, Date.now());
  }

  try {
    await interaction.deferReply({ ephemeral: interaction.commandName === 'dm' || interaction.commandName === 'say' });
  } catch (error) {
    console.error(`Could not acknowledge /${interaction.commandName}:`, error.message);
    return;
  }

  await sendLog({
    title: 'Bot Command Log',
    description: `**${interaction.user.username}** ran **/${interaction.commandName}** in <#${interaction.channelId}> at ${discordTimestamp()}.`,
    user: interaction.user,
  });

  try {
    if (interaction.commandName === 'deport') {
      if (!isSuperAdmin(interaction.user.id) && interaction.user.id !== deporterUserId) {
        await interaction.editReply({ content: 'You are not authorized to use this command.' });
        return;
      }

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.editReply({ content: 'You need Ban Members permission to use this command.' });
        return;
      }

      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason', true);
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.bannable) {
        await interaction.editReply({ content: 'I cannot deport that member. Check my role position and permissions.' });
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const deportationNotice = [
        '**Deportation Notice**',
        `You have been deported from bonnie blue bang bus for ${reason}. You were deported by pnd.`,
        `<t:${timestamp}:F> • bonnie blue bang bus`,
      ].join('\n');

      try {
        await user.send(deportationNotice);
      } catch (error) {
        console.warn(`Could not DM ${user.tag} before deportation:`, error.message);
      }

      await member.ban({ reason });
      await sendLog({
        title: 'Deportation Notice',
        description: `**${user.username}** was deported by pndishotx for ${reason}.`,
        user,
      });
      await interaction.editReply(`${user.tag} has been deported. Reason: ${reason}`);
      return;
    }

    if (interaction.commandName === 'arrest') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.editReply({ content: 'You need Moderate Members permission to use this command.' });
        return;
      }

      const user = interaction.options.getUser('user', true);
      const durationInput = interaction.options.getString('time', true);
      const reason = interaction.options.getString('reason', true).trim();
      const duration = parseTimeoutDuration(durationInput);
      if (!duration || !reason) {
        await interaction.editReply({ content: 'Use a valid positive duration such as 25m, 1hr, or 2d 5hr 30m, plus a reason.' });
        return;
      }

      const member = await interaction.guild.members.fetch(user.id);
      if (!member.moderatable) {
        await interaction.editReply({ content: 'I cannot timeout that member. Check my permissions and role position.' });
        return;
      }
      await member.timeout(duration, reason);
      await interaction.editReply({ content: `${user.tag} was timed out for ${durationInput}. Reason: ${reason}` });
      return;
    }

    if (interaction.commandName === 'dm') {
      if (!isSuperAdmin(interaction.user.id) && interaction.user.id !== dmUserId) {
        await interaction.editReply({ content: 'You are not authorized to use this command.' });
        return;
      }

      const user = interaction.options.getUser('user', true);
      const message = interaction.options.getString('message', true);
      const category = await interaction.guild.channels.fetch(dmCategoryId);

      if (!category || category.type !== ChannelType.GuildCategory) {
        await interaction.editReply({ content: 'The configured DM category could not be found.' });
        return;
      }

      const dmChannel = await interaction.guild.channels.create({
        name: dmChannelName(user.username),
        type: ChannelType.GuildText,
        parent: dmCategoryId,
      });

      try {
        await user.send(message);
      } catch (error) {
        await dmChannel.delete().catch(() => {});
        throw error;
      }

      activeDmChannels.set(user.id, dmChannel.id);
        dmChannelRecipients.set(dmChannel.id, user.id);
      await interaction.editReply({ content: `Message sent to ${user.tag}. Replies will appear in ${dmChannel}.` });
      return;
    }

    if (interaction.commandName === 'say') {
      if (!isSuperAdmin(interaction.user.id) && !sayUserIds.has(interaction.user.id)) {
        await interaction.editReply({ content: 'You are not authorized to use this command.' });
        return;
      }

      const message = interaction.options.getString('message', true);
      await interaction.channel.send(message);
      await interaction.deleteReply();
      return;
    }

    if (interaction.commandName === 'purge') {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.editReply({ content: 'You need Manage Messages permission to use this command.' });
        return;
      }

      if (!interaction.channel?.isTextBased() || typeof interaction.channel.bulkDelete !== 'function') {
        await interaction.editReply({ content: 'This command cannot be used in this channel.' });
        return;
      }

      const amount = interaction.options.getInteger('amount', true);
      const deletedMessages = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ content: `Deleted ${deletedMessages.size} message${deletedMessages.size === 1 ? '' : 's'}.` });
      return;
    }

    if (interaction.commandName === 'pay') {
      if (interaction.user.id !== deporterUserId) {
        await interaction.editReply({ content: 'You do not have permission to use this command.' });
        return;
      }

      const recipient = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const senderAccount = getAccount(interaction.user.id);

      if (amount <= 0 || !Number.isSafeInteger(amount) || amount > 999000000000000) {
        await interaction.editReply({ content: 'Payment amounts must be whole dollars between $1 and $999,000,000,000,000.' });
        return;
      }

      if (senderAccount.wallet < amount) {
        await interaction.editReply({
          content: `You do not have enough money in your wallet. Your wallet contains ${formatMoney(senderAccount.wallet)}.`,
        });
        return;
      }

      const recipientAccount = getAccount(recipient.id);
      senderAccount.wallet -= amount;
      recipientAccount.wallet += amount;
      saveEconomy();

      const paymentEmbed = new EmbedBuilder()
        .setTitle('💸 Payment Sent')
        .setDescription(`<@${interaction.user.id}> paid <@${recipient.id}> **${formatMoney(amount)}**.`)
        .addFields(
          { name: 'Sender', value: interaction.user.toString(), inline: true },
          { name: 'Recipient', value: recipient.toString(), inline: true },
          { name: 'Amount', value: formatMoney(amount), inline: true },
        )
        .setColor(0x57f287)
        .setTimestamp();

      await interaction.editReply({ embeds: [paymentEmbed] });
      return;
    }

    if (interaction.commandName === 'addmoney') {
      if (interaction.user.id !== '1522959087153713238') {
        await interaction.editReply({ content: 'You do not have permission to use this command.' });
        return;
      }

      const amount = interaction.options.getInteger('amount', true);
      const recipient = interaction.options.getUser('user') || interaction.user;
      const recipientAccount = getAccount(recipient.id);

      if (amount <= 0 || !Number.isSafeInteger(amount) || amount > 999000000000000) {
        await interaction.editReply({ content: 'Amounts must be whole dollars between $1 and $999,000,000,000,000.' });
        return;
      }

      recipientAccount.wallet += amount;
      saveEconomy();
      await interaction.editReply({
        content: `Added ${formatMoney(amount)} to ${recipient.id === interaction.user.id ? 'your' : `${recipient.tag}'s`} wallet. Their wallet now contains ${formatMoney(recipientAccount.wallet)}.`,
      });
      return;
    }

    if (interaction.commandName === 'wallet') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const account = getAccount(targetUser.id);
      const walletEmbed = new EmbedBuilder()
        .setTitle('Economy Wallet')
        .setDescription(`Cash: ${formatMoney(account.wallet)}\nBank: ${formatMoney(account.bank)}\n${targetUser.toString()}`)
        .setColor(0x5865f2)
        .setTimestamp();

      await interaction.editReply({ embeds: [walletEmbed] });
      return;
    }

    if (interaction.commandName === 'bank') {
      const account = getAccount(interaction.user.id);
      if (account.wallet <= 0) {
        await interaction.editReply({ content: `You have no money to deposit.\n\n${formatBalances(account)}` });
        return;
      }

      const deposited = account.wallet;
      account.wallet = 0;
      account.bank += deposited;
      saveEconomy();
      await interaction.editReply({
        content: `Deposited ${formatMoney(deposited)} into your bank.\n\n${formatBalances(account)}`,
      });
      return;
    }

    if (interaction.commandName === 'withdraw') {
      const amount = interaction.options.getInteger('amount', true);
      const account = getAccount(interaction.user.id);

      if (amount <= 0 || !Number.isSafeInteger(amount) || amount > 999000000000000) {
        await interaction.editReply({ content: 'Withdrawal amounts must be whole dollars between $1 and $999,000,000,000,000.' });
        return;
      }

      if (account.bank < amount) {
        await interaction.editReply({ content: `You do not have enough money in your bank. Your bank contains ${formatMoney(account.bank)}.` });
        return;
      }

      account.bank -= amount;
      account.wallet += amount;
      saveEconomy();
      await interaction.editReply({
        content: `Withdrew ${formatMoney(amount)} from your bank into your wallet.\n\n${formatBalances(account)}`,
      });
      return;
    }

    if (interaction.commandName === 'rob') {
      const cooldown = cooldownMessage(robCooldowns, interaction.user.id, ROB_COOLDOWN_MS);
      if (cooldown) {
        await interaction.editReply({ content: cooldown });
        return;
      }

      const target = interaction.options.getUser('user', true);
      if (target.id === interaction.user.id) {
        await interaction.editReply({ content: 'You cannot rob yourself.' });
        return;
      }
      if (target.bot) {
        await interaction.editReply({ content: 'You cannot rob a bot.' });
        return;
      }

      robCooldowns.set(interaction.user.id, Date.now() + ROB_COOLDOWN_MS);
      const robberAccount = getAccount(interaction.user.id);
      const targetAccount = getAccount(target.id);
      if (targetAccount.wallet <= 0) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle('Robbery Failed').setDescription(`${target.username} has no money in their wallet to steal.`).setColor(0xed4245)],
        });
        return;
      }

      const maxRobAmount = Math.max(1, Math.floor(targetAccount.wallet * 0.35));
      const stolen = Math.max(1, Math.floor(Math.random() * maxRobAmount) + 1);
      targetAccount.wallet -= stolen;
      robberAccount.wallet += stolen;
      saveEconomy();
      await interaction.editReply({
        embeds: [new EmbedBuilder().setTitle('Robbery Successful').setDescription(`You stole ${formatMoney(stolen)} from ${target.username}'s wallet.\n\nYour wallet: ${formatMoney(robberAccount.wallet)}\n${target.username}'s wallet: ${formatMoney(targetAccount.wallet)}`).setColor(0x57f287)],
      });
      return;
    }

    if (interaction.commandName === 'work') {
      const cooldown = cooldownMessage(workCooldowns, interaction.user.id, WORK_COOLDOWN_MS);
      if (cooldown) {
        await interaction.editReply({ content: cooldown });
        return;
      }

      workCooldowns.set(interaction.user.id, Date.now() + WORK_COOLDOWN_MS);
      const option = WORK_OPTIONS[Math.floor(Math.random() * WORK_OPTIONS.length)];
      const account = getAccount(interaction.user.id);
      account.wallet += option.payout;
      saveEconomy();
      await interaction.editReply({
        embeds: [new EmbedBuilder().setTitle(WORK_EMBED_TITLE).setDescription(`${option.text}\n\nYou earned ${formatMoney(option.payout)}.\n\n${formatBalances(account)}`).setColor(WORK_EMBED_COLOR)],
      });
      return;
    }

    if (interaction.commandName === 'crime') {
      const cooldown = cooldownMessage(crimeCooldowns, interaction.user.id, CRIME_COOLDOWN_MS);
      if (cooldown) {
        await interaction.editReply({ content: cooldown });
        return;
      }

      crimeCooldowns.set(interaction.user.id, Date.now() + CRIME_COOLDOWN_MS);
      const option = CRIME_OPTIONS[Math.floor(Math.random() * CRIME_OPTIONS.length)];
      const account = getAccount(interaction.user.id);
      const caught = Math.random() < option.bust_chance;

      if (caught) {
        takeFine(account, option.fine);
        saveEconomy();
        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle(CRIME_FAILURE_EMBED_TITLE).setDescription(`${option.text}\n\nYou were caught and fined ${formatMoney(option.fine)}.\n\n${formatBalances(account)}`).setColor(CRIME_FAILURE_EMBED_COLOR)],
        });
        return;
      }

      account.wallet += option.payout;
      saveEconomy();
      await interaction.editReply({
        embeds: [new EmbedBuilder().setTitle(CRIME_SUCCESS_EMBED_TITLE).setDescription(`${option.text}\n\nYou earned ${formatMoney(option.payout)}.\n\n${formatBalances(account)}`).setColor(CRIME_SUCCESS_EMBED_COLOR)],
      });
      return;
    }

    if (interaction.commandName === 'scan') {
      const cooldown = cooldownMessage(scanCooldowns, interaction.user.id, SCAN_COOLDOWN_MS);
      if (cooldown) {
        await interaction.editReply({ content: cooldown });
        return;
      }

      const target = interaction.options.getUser('user', true);
      if (target.bot) {
        await interaction.editReply({ content: 'You cannot scan a bot.' });
        return;
      }

      scanCooldowns.set(interaction.user.id, Date.now() + SCAN_COOLDOWN_MS);
      const foundCash = Math.random() < 0.5;
      const option = foundCash ? SCAN_OPTIONS[Math.floor(Math.random() * SCAN_OPTIONS.length)] : null;
      const payout = option ? option.payout : 0;
      const scannerAccount = getAccount(interaction.user.id);
      const scanChannel = await client.channels.fetch(scanChannelId);

      try {
        await target.send(`You were scanned by ${interaction.user.tag}.`);
      } catch (error) {
        console.warn(`Could not DM scanned user ${target.tag}:`, error.message);
      }

      if (foundCash) {
        scannerAccount.wallet += payout;
        saveEconomy();
      }

      const scanEmbed = new EmbedBuilder()
        .setTitle(SCAN_EMBED_TITLE)
        .setDescription(
          foundCash && option
            ? `${option.text}\n\n${interaction.user.toString()} found ${formatMoney(payout)}.`
            : `${interaction.user.toString()} scanned ${target.toString()} but found nothing.`,
        )
        .setColor(SCAN_EMBED_COLOR)
        .setTimestamp();

      if (scanChannel?.isTextBased()) {
        await scanChannel.send({ embeds: [scanEmbed] });
      }

      await interaction.editReply({
        content: foundCash
          ? `${interaction.user.tag} scanned ${target.tag} and found ${formatMoney(payout)}.`
          : `${interaction.user.tag} scanned ${target.tag} but found nothing.`,
      });
      return;
    }

    if (interaction.commandName === 'prescribe') {
      if (!isSuperAdmin(interaction.user.id) && !prescribeUserIds.has(interaction.user.id)) {
        await interaction.editReply({ content: 'You are not authorized to prescribe medication.' });
        return;
      }

      const medicine = interaction.options.getString('medicine', true);
      const user = interaction.options.getUser('user', true);
      const prescriberAccount = getAccount(interaction.user.id);
      prescriberAccount.wallet += 700;
      saveEconomy();

      const pharmacyChannel = await client.channels.fetch(pharmacyChannelId);
      if (pharmacyChannel?.isTextBased()) {
        await pharmacyChannel.send({
          embeds: [new EmbedBuilder()
            .setTitle('Medication Prescribed')
            .setDescription(`${medicine} was prescribed to ${user.toString()} by ${interaction.user.toString()}`)
            .setColor(0x5865f2)
            .setTimestamp()],
        });
      }

      await interaction.editReply({
        content: `Prescription recorded. ${medicine} was prescribed to ${user.tag}. ${interaction.user.tag} received ${formatMoney(700)}.`,
      });
      return;
    }

    if (interaction.commandName === 'purchase') {
      const itemName = interaction.options.getString('item', true).trim().toLowerCase();
      const product = SHOP_PRODUCTS.find((shopProduct) =>
        shopProduct.name.trim().toLowerCase() === itemName,
      );
      if (!product) {
        await interaction.editReply({ content: `I could not find a product named ${itemName}.` });
        return;
      }

      const buyerAccount = getAccount(interaction.user.id);
      if (buyerAccount.wallet < product.price) {
        await interaction.editReply({ content: `You do not have enough money in your wallet for ${product.name}. It costs ${formatMoney(product.price)}.` });
        return;
      }

      buyerAccount.wallet -= product.price;
      saveEconomy();
      const purchaseChannel = await client.channels.fetch(purchaseChannelId);
      if (!purchaseChannel?.isTextBased()) {
        await interaction.editReply({ content: 'Your purchase was processed, but the purchase confirmation channel could not be found.' });
        return;
      }

      const purchaseEmbed = new EmbedBuilder()
        .setTitle('Purchase Confirmation')
        .setDescription(`${interaction.user.toString()} purchased **${product.name}**.`)
        .addFields({ name: 'Price', value: formatMoney(product.price), inline: true })
        .setColor(0x57f287)
        .setTimestamp();

      await purchaseChannel.send({ embeds: [purchaseEmbed] });
      await interaction.deleteReply();
      return;
    }

    if (interaction.commandName === 'cancel-booking' || interaction.commandName === 'finish-appointment') {
      const user = interaction.options.getUser('user', true);
      const appointment = Object.values(economy.appointments)
        .filter((candidate) => candidate.patientId === user.id)
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0];

      if (!appointment || (interaction.commandName === 'finish-appointment' && appointment.status !== 'ACTIVE')) {
        await interaction.editReply({ content: 'No active appointment was found for that user.' });
        return;
      }

      if (!bookingApproversFor(appointment.clinicCode).has(interaction.user.id)) {
        await interaction.editReply({ content: 'You are not authorized to manage appointments for this clinic.' });
        return;
      }

      const isCancellation = interaction.commandName === 'cancel-booking';
      const reason = isCancellation ? interaction.options.getString('reason', true) : null;
      const status = isCancellation ? 'Cancelled' : 'Finished';
      const bookingChannel = await client.channels.fetch(appointment.channelId);
      const bookingMessage = bookingChannel?.isTextBased() ? await bookingChannel.messages.fetch(appointment.messageId) : null;
      if (!bookingMessage) {
        await interaction.editReply({ content: 'The appointment message could not be found.' });
        return;
      }
      const originalEmbed = bookingMessage.embeds[0];
      const statusDetails = isCancellation
        ? `**Status:** Cancelled by ${interaction.user.username} at ${discordTimestamp()}\n**Reason:** ${reason}`
        : `**Status:** Finished by ${interaction.user.username} at ${discordTimestamp()}`;
      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .setTitle(`Appointment ${status}`)
        .setDescription(`${originalEmbed.description}\n\n${statusDetails}`);

      appointment.status = isCancellation ? 'DECLINED' : 'FINISHED';
      appointment.finishedBy = isCancellation ? null : interaction.user.id;
      appointment.finishedAt = new Date().toISOString();
      saveEconomy();
      await bookingMessage.edit({
        embeds: [updatedEmbed],
        components: disabledBookingComponents(bookingMessage.components),
      });
      activeBookings.delete(user.id);

      if (!isCancellation) {
        const patientAccount = getAccount(user.id);
        const approverAccount = getAccount(interaction.user.id);
        const transferAmount = 1000;
        const availableFromWallet = Math.min(patientAccount.wallet, transferAmount);
        const bankDeduction = transferAmount - availableFromWallet;

        patientAccount.wallet -= availableFromWallet;
        patientAccount.bank -= bankDeduction;
        approverAccount.wallet += transferAmount;
        saveEconomy();
      }

      const notice = isCancellation
        ? [
          '**Appointment Cancelled**',
          `Your appointment at ${appointment.clinicName} with Dr. Britney has been cancelled. Reason: ${reason}`,
          `${appointment.dateTime} • bonnie blue bang bus`,
        ].join('\n')
        : [
          '**Appointment Finished**',
          `Your appointment at ${appointment.clinicName} with Dr. Britney has been marked as finished. ${formatMoney(1000)} was transferred to the approving staff member.`,
          `${appointment.dateTime} • bonnie blue bang bus`,
        ].join('\n');

      await user.send(notice);
      await interaction.editReply({ content: `Appointment for ${user.tag} marked as ${status.toLowerCase()}.` });
      return;
    }

    if (interaction.commandName === 'book') {
      const clinic = interaction.options.getString('clinic', true);
      const reason = interaction.options.getString('reason', true);
      const dateTime = interaction.options.getString('date-time', true);
      const clinicDetails = {
        [bookingOptions[0].value]: {
          channelId: diveAndSpreadChannelId,
          name: 'Dive and Spread Clinic',
          code: 'dive-spread',
          doctor: 'Dr. Britney',
        },
        [bookingOptions[1].value]: {
          channelId: papSmearChannelId,
          name: 'Pap Smear Clinic',
          code: 'pap-smear',
          doctor: 'Dr. Britney',
        },
      }[clinic];
      const clinicChannelId = clinicDetails.channelId;
      const clinicName = clinicDetails.name;
      const clinicCode = clinicDetails.code;
      const doctorName = clinicDetails.doctor;
      const encodedDateTime = Buffer.from(dateTime, 'utf8').toString('base64url');
      const appointmentId = randomUUID().replace(/-/g, '').slice(0, 12);
      const bookingChannel = await client.channels.fetch(clinicChannelId);

      if (!bookingChannel?.isTextBased()) {
        await interaction.editReply({ content: 'The configured booking channel could not be found.' });
        return;
      }

      const bookingEmbed = new EmbedBuilder()
        .setTitle('Appointment Pending Approval')
        .setDescription(`**${interaction.user.username}** has booked an appointment with ${doctorName} at the ${clinicName}. **${interaction.user.username}**'s reason is: ${reason}. The appointment will be at ${dateTime}.`)
        .setColor(0x2b2d31)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .setTimestamp();
      const bookingButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`booking:approve:${interaction.user.id}:${clinicCode}:${encodedDateTime}:${appointmentId}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`booking:decline:${interaction.user.id}:${clinicCode}:${encodedDateTime}:${appointmentId}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger),
      );

      const bookingMessage = await bookingChannel.send({ embeds: [bookingEmbed], components: [bookingButtons] });
      economy.appointments[appointmentId] = {
        id: appointmentId,
        patientId: interaction.user.id,
        clinicName,
        clinicCode,
        doctorName,
        reason,
        dateTime,
        channelId: bookingChannel.id,
        messageId: bookingMessage.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      saveEconomy();
      activeBookings.set(interaction.user.id, {
        message: bookingMessage,
        clinicName,
        clinicCode,
        dateTime,
        appointmentId,
      });
      await interaction.editReply({
        content: `Appointment request sent to the ${clinicName}.`,
      });
      await sendLog({
        title: 'Appointment Booked',
        description: `**${interaction.user.username}** booked an appointment with **${clinicName}** for ${reason} at ${dateTime}.`,
        user: interaction.user,
      });
    }
  } catch (error) {
    console.error(`Error handling /${interaction.commandName}:`, error);

    if (interaction.commandName === 'dm' && error.code === 50278) {
      await interaction.editReply({
        content: 'Discord would not allow me to DM that user because they do not share a server with this bot. They must join this server first.',
      });
      return;
    }

    await respondToInteraction(interaction, { content: 'That command could not be completed. Check the bot permissions and try again.' });
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

async function start() {
  await registerCommands();
  await client.login(process.env.DISCORD_TOKEN);
}

start().catch((error) => {
  console.error('Bot failed to start:', error);
  process.exitCode = 1;
});