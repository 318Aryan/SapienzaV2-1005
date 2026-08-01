"use server";

import { auth, currentUser } from "@clerk/nextjs";

import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { getUserSubscription } from "@/db/queries";

// Same userSubscription table and webhook as the student Pro flow
// (actions/user-subscription.ts) — it's keyed by Clerk userId with no
// concept of role, so a teacher's paid plan and a student's paid plan
// are just two independent rows, no schema change needed.
const returnUrl = absoluteUrl("/teacher/billing");

export const createTeacherStripeUrl = async () => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    throw new Error("Unauthorized");
  }

  const subscription = await getUserSubscription();

  if (subscription && subscription.stripeCustomerId) {
    const stripeSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { data: stripeSession.url };
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user.emailAddresses[0].emailAddress,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "USD",
          product_data: {
            name: "LessonAI Teacher Pro",
            description: "Unlimited classes, assignments, and AI-generated content",
          },
          unit_amount: 2900, // $29.00 USD
          recurring: {
            interval: "month",
          },
        },
      },
    ],
    metadata: {
      userId,
    },
    success_url: returnUrl,
    cancel_url: returnUrl,
  });

  return { data: stripeSession.url };
};
