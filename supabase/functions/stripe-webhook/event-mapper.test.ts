import { mapStripeEventToSubscriptionUpdate } from "./event-mapper";

function makeEvent(type: string, object: Record<string, unknown>) {
  return { type, data: { object } };
}

describe("mapStripeEventToSubscriptionUpdate", () => {
  it("maps a customer.subscription.created event", () => {
    const event = makeEvent("customer.subscription.created", {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      current_period_end: 1_893_456_000, // 2030-01-01T00:00:00Z
    });

    expect(mapStripeEventToSubscriptionUpdate(event)).toEqual({
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      status: "active",
      currentPeriodEnd: new Date(1_893_456_000 * 1000).toISOString(),
    });
  });

  it("maps a customer.subscription.updated event, e.g. a trial converting to active", () => {
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: "cus_123",
      status: "trialing",
      current_period_end: 1_893_456_000,
    });

    expect(mapStripeEventToSubscriptionUpdate(event)?.status).toBe("trialing");
  });

  it("forces status to 'canceled' on a deleted event, regardless of the payload's own status field", () => {
    const event = makeEvent("customer.subscription.deleted", {
      id: "sub_123",
      customer: "cus_123",
      status: "incomplete_expired", // Stripe's own value at deletion time can vary
      current_period_end: 1_893_456_000,
    });

    expect(mapStripeEventToSubscriptionUpdate(event)?.status).toBe("canceled");
  });

  it("falls back to the per-line-item current_period_end when the top-level field is absent", () => {
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      items: { data: [{ current_period_end: 1_893_456_000 }] },
    });

    expect(mapStripeEventToSubscriptionUpdate(event)?.currentPeriodEnd).toBe(
      new Date(1_893_456_000 * 1000).toISOString(),
    );
  });

  it("returns currentPeriodEnd: null rather than crashing when neither field is present", () => {
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
    });

    expect(mapStripeEventToSubscriptionUpdate(event)?.currentPeriodEnd).toBeNull();
  });

  it("handles an expanded customer object (id nested, not a bare string)", () => {
    const event = makeEvent("customer.subscription.updated", {
      id: "sub_123",
      customer: { id: "cus_123", email: "test@example.com" },
      status: "active",
    });

    expect(mapStripeEventToSubscriptionUpdate(event)?.stripeCustomerId).toBe("cus_123");
  });

  it("returns null for event types it doesn't handle", () => {
    const event = makeEvent("invoice.paid", { id: "in_123" });
    expect(mapStripeEventToSubscriptionUpdate(event)).toBeNull();
  });

  it("returns null when required ids are missing from the payload", () => {
    expect(mapStripeEventToSubscriptionUpdate(makeEvent("customer.subscription.updated", { status: "active" }))).toBeNull();
  });
});
