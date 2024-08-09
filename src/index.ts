import express from "express";
import bodyParser from "body-parser";
import { App } from "@slack/bolt";
import dotenv from "dotenv";
import crypto from "crypto";
import { formatDistanceToNowStrict } from "date-fns";
import { toZonedTime } from "date-fns-tz";

dotenv.config();

const listener = express();
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

function verifyWebhookSignature(
  payload: any,
  receivedSignature: string,
  secret: string
): boolean {
  const computedHmac = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return computedHmac === receivedSignature;
}

function getRelativeTime(utcTimestamp: string): string {
  const date = new Date(utcTimestamp + "Z");
  const zonedDate = toZonedTime(date, "UTC");
  return formatDistanceToNowStrict(zonedDate, { addSuffix: true });
}

function getCurrency(iso: string): string {
  switch (iso) {
    case "USD":
      return "$";
    case "AUD":
      return "A$";
    case "BRL":
      return "R$";
    case "CAD":
      return "CA$";
    case "CNY":
      return "CN¥";
    case "EUR":
      return "€";
    case "HKD":
      return "HK$";
    case "HUF":
      return "HUF ";
    case "INR":
      return "₹";
    case "ILS":
      return "₪";
    case "JPY":
      return "¥";
    case "MXN":
      return "MX$";
    case "TWD":
      return "NT$";
    case "NZD":
      return "NZ$";
    case "GBP":
      return "£";
    case "ZAR":
      return "ZAR ";
    case "KRW":
      return "₩ ";
    default:
      return `${iso} `;
  }
}

listener.use(bodyParser.json());

listener.post("/webhook", async (req, res) => {
  if (req.body.data.session.result !== "cancel") return res.status(200);
  const receivedSignature = req.headers["ck-signature"] as string;

  // if (verifyWebhookSignature(req.body, receivedSignature, secret as string)) {
  try {
    const data = req.body.data;
    const { feedback, followupResponse, surveyResponse } = data.session;
    const { subscription_id, user_email, last_payment, state } = data.customer;
    const plan = data.customer.subscriptions.data[0].plan;
    const isTrial = state === "trialing" ? true : false;

    function slackMessageBody(
      feedback: string | undefined,
      followupResponse: string | undefined
    ) {
      let message = `> *Feedback:*\n> ${surveyResponse}`;
      if (feedback)
        message = `> *Feedback:*\n> ${surveyResponse} — ${feedback}`;
      if (followupResponse)
        message += `\n\n> *What could we have done better?*\n> ${followupResponse}`;
      return message;
    }

    function billingInfo(customer: any) {
      let moneyAmount;
      if (customer.last_payment && customer.last_payment.amount > 0) {
        moneyAmount = `${getCurrency(
          last_payment.currency
        )}${last_payment.amount.toFixed(2)}`;
      } else {
        moneyAmount = `${getCurrency(plan.currency)}${(
          plan.unit_amount / 100
        ).toFixed(2)}`;
      }

      return `${moneyAmount}/${plan.recurring.interval} ${
        isTrial ? "(trial)" : "(charged)"
      }`;
    }

    console.log(slackMessageBody(feedback, followupResponse));

    if (feedback || followupResponse) {
      const paddleCustomerUrl = `https://vendors.paddle.com/subscriptions/customers/manage/${subscription_id}`;
      await app.client.chat.postMessage({
        text: `<${paddleCustomerUrl}|${user_email}> canceled their subscription`,
        channel: process.env.SLACK_CHANNEL_ID!,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `
            <${paddleCustomerUrl}|${user_email}> canceled their subscription\n\n${slackMessageBody(
                feedback,
                followupResponse
              )}`,
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Open in Paddle",
              },
              value: "paddle_customer",
              url: paddleCustomerUrl,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Subscribed ${getRelativeTime(
                  data.customer.signup_date
                )} • ${billingInfo(data.customer)}`,
              },
            ],
          },
        ],
      });
    }
    res.status(200);
    // } else {
    //   res.status(400);
    // }
  } catch {
    return res.status(200);
  }
});

(async () => {
  await app.start(process.env.SLACK_BOT_PORT || 3000);
  listener.listen(process.env.EXPRESS_SERVER_PORT || 3001, () =>
    console.log("Express listener on port 3001")
  );
  console.log("Churnkey Reports Slack app is running!");
})();
