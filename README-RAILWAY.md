# Discord Bot Deployment to Railway 🚂

## 🎯 Why Railway is Perfect for Discord Bots

- ✅ **Long-running processes** (no time limits!)
- ✅ **Real-time voice state updates** work perfectly
- ✅ **WebSocket connections** fully supported
- ✅ **Built-in databases** (PostgreSQL/MongoDB)
- ✅ **GitHub integration** for auto-deployment
- ✅ **$5/month** for hobby projects (500 hours free)

## 📋 Prerequisites

1. **GitHub Account** (to connect with Railway)
2. **Railway Account** ([railway.app](https://railway.app))
3. **MongoDB Atlas** (free tier) or Railway's PostgreSQL
4. **Discord Application** with Bot Token

## 🚀 Step-by-Step Deployment

### 1. Set up MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. **IMPORTANT**: Set up Network Access:
   - Go to "Network Access" tab
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (`0.0.0.0/0`)
   - This is required for Railway's dynamic IPs
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`

### 2. Get Discord Application Details

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Copy these values:
   - **Application ID** (Client ID) - from General Information
   - **Bot Token** - from Bot section

### 3. Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Discord bot setup"

# Create GitHub repository and push
gh repo create discord-bot --public
git remote add origin https://github.com/yourusername/discord-bot.git
git push -u origin main
```

### 4. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `discord-bot` repository
6. Railway will automatically detect Node.js and deploy

### 5. Set Environment Variables

In Railway dashboard:

1. Go to your project
2. Click **"Variables"** tab
3. Add these variables:

```env
DISCORD_TOKEN=your_actual_bot_token
DISCORD_CLIENT_ID=your_actual_client_id
MONGODB_URI=your_mongodb_atlas_connection_string
NODE_ENV=production
```

### 6. Deploy Slash Commands

After deployment, you can deploy commands locally:

```bash
# Create .env file with your credentials
cp .env.example .env
# Edit .env with your actual values

# Deploy commands
npm run deploy
```

Or deploy them from Railway by adding a build step in railway.json.

## 🎮 Testing Your Bot

1. **Invite bot to server**:

   - Go to Discord Developer Portal
   - OAuth2 → URL Generator
   - Select `bot` and `applications.commands` scopes
   - Select permissions: `Manage Channels`, `Move Members`, `Connect`, `Speak`
   - Use generated URL to invite bot

2. **Test commands**:

   ```
   /vccreate setup channel:#general name:"My Voice Channel" limit:5
   /vccreate disable
   /vccreate rename name:"New Channel Name"
   ```

3. **Test voice functionality**:
   - Join the setup voice channel
   - Bot should create a new channel and move you there
   - Leave the channel - it should be deleted automatically

## 📊 Railway Dashboard Features

- **Real-time logs** - See your bot's console output
- **Metrics** - CPU, Memory, Network usage
- **Deployments** - History of all deployments
- **Environment Variables** - Secure config management
- **Custom domains** - If you need web interface later

## 💰 Pricing

- **$5/month** for hobby projects
- **500 hours free** every month
- **$0.000463 per GB-hour** for usage beyond free tier
- **Much cheaper** than most alternatives for Discord bots

## 🔧 Advanced Configuration

### Auto-deploy on Git Push

Railway automatically redeploys when you push to your main branch.

### Database Options

1. **MongoDB Atlas** (Recommended) - Free 512MB
2. **Railway PostgreSQL** - If you prefer SQL
3. **Railway MongoDB** - Paid add-on

### Custom Start Command

In `railway.json`:

```json
{
  "deploy": {
    "startCommand": "npm start"
  }
}
```

## 🚨 Important Notes

### Keep Your Bot Online 24/7:

- Railway keeps your bot running continuously
- No cold starts like serverless platforms
- Perfect for Discord bots that need real-time responses

### Logs and Monitoring:

- Check Railway dashboard for logs
- Monitor resource usage
- Set up alerts if needed

### Security:

- Never commit `.env` file
- Use Railway environment variables
- Rotate tokens periodically

## 📁 Final Project Structure

```
discord_bot/
├── command/
│   └── vccreate.js       # Voice channel commands
├── event/
│   └── vccreate.js       # Voice state events
├── schema/
│   ├── vccreate.js       # Main schema
│   └── vccreateuser.js   # User schema
├── index.js              # Main bot file
├── deploy-commands.js    # Command deployment
├── railway.json          # Railway configuration
├── package.json          # Dependencies
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
└── README-RAILWAY.md    # This file
```

## 🎉 You're Done!

Your Discord bot is now running 24/7 on Railway with:

- ✅ Real-time voice channel creation
- ✅ Automatic channel cleanup
- ✅ Slash command support
- ✅ MongoDB database integration
- ✅ Auto-deployment from GitHub

## 🆘 Troubleshooting

### Database Connection Error?

**Error**: `MongoNetworkError` or `connection timed out`

**Solution**:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (`0.0.0.0/0`)
4. Wait 2-3 minutes for changes to apply
5. Redeploy your Railway app

### Bot not responding?

- Check Railway logs for errors
- Verify environment variables are set
- Ensure bot has proper Discord permissions

### Voice channels not working?

- Check bot has `Manage Channels` permission
- Verify voice state events are being received in logs
- Ensure MongoDB connection is working

### Commands not showing?

- Run `npm run deploy` to register commands
- Wait a few minutes for Discord to update
- Check bot has `applications.commands` scope
