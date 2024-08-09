# Churnkey-Feedback-Slack-Webhooks

Posts written customer feedback to a Slack channel while ignoring other cancellation webhook events.

## 1. Setup Environment

Rename `example.env` to `.env` and enter your credentials.

```
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SLACK_CHANNEL_ID=your-slack-channel-id
SLACK_BOT_PORT=3000
EXPRESS_SERVER_PORT=3001
CHURNKEY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Here's where you can find each of these keys:

- `SLACK_BOT_TOKEN`: https://api.slack.com/apps/:bot_id/oauth
- `SLACK_SIGNING_SECRET`: https://api.slack.com/apps/:bot_id/general
- `SLACK_CHANNEL_ID`: Right click the channel you want to post to in Slack, click `Copy > Copy link` and extract the channel ID from the URL.
- `CHURNKEY_WEBHOOK_SECRET`: https://app.churnkey.co/settings/integrations (you'll also need to enter the destination URL on your server where these webhook requests should be sent, by default `http://{your_ip}:3001/webhook`).

Open ports `3000` and `3001` for the Slack bot and express server respectively. These are the default values but you can change them to any port.

## 2. Add your bot to Slack

Make sure to add your bot to your company Slack and ping it in the channel you want to use it in to give it permission to write.

## 3. Start the bot

Once done, run:

```
npm i && npm run build && npm run start
```

This will install / update the dependencies, build and start the bot.
