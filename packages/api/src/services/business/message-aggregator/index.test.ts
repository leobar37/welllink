import { describe, test, expect, beforeEach } from "bun:test";
import { MessageAggregatorService } from "./index";

describe("MessageAggregatorService", () => {
  let aggregator: MessageAggregatorService;
  let processedMessages: Array<{ text: string; count: number }> = [];

  beforeEach(() => {
    processedMessages = [];
    aggregator = new MessageAggregatorService({
      debounceMs: 100,
      maxBufferAgeMs: 500,
      maxMessages: 5,
      maxChars: 1000,
    });
  });

  const mockProcessCallback = async (text: string, count: number) => {
    processedMessages.push({ text, count });
  };

  test("should aggregate multiple messages and process after debounce", async () => {
    const phone = "+1234567890";
    const profileId = "profile-1";

    await aggregator.addMessage(phone, profileId, "Hello", mockProcessCallback);
    await aggregator.addMessage(
      phone,
      profileId,
      "How are you?",
      mockProcessCallback,
    );
    await aggregator.addMessage(
      phone,
      profileId,
      "I need help",
      mockProcessCallback,
    );

    expect(processedMessages.length).toBe(0);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(processedMessages.length).toBe(1);
    expect(processedMessages[0].text).toBe("Hello\nHow are you?\nI need help");
    expect(processedMessages[0].count).toBe(3);
  });

  test("should process immediately when max messages reached", async () => {
    const phone = "+1234567890";
    const profileId = "profile-1";

    for (let i = 1; i <= 5; i++) {
      await aggregator.addMessage(
        phone,
        profileId,
        `Message ${i}`,
        mockProcessCallback,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(processedMessages.length).toBe(1);
    expect(processedMessages[0].count).toBe(5);
  });

  test("should handle multiple users independently", async () => {
    const phone1 = "+1111111111";
    const phone2 = "+2222222222";
    const profileId = "profile-1";

    const messages1: Array<{ text: string; count: number }> = [];
    const messages2: Array<{ text: string; count: number }> = [];

    const callback1 = async (text: string, count: number) => {
      messages1.push({ text, count });
    };

    const callback2 = async (text: string, count: number) => {
      messages2.push({ text, count });
    };

    await aggregator.addMessage(phone1, profileId, "User 1 message", callback1);
    await aggregator.addMessage(phone2, profileId, "User 2 message", callback2);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(messages1.length).toBe(1);
    expect(messages1[0].text).toBe("User 1 message");
    expect(messages2.length).toBe(1);
    expect(messages2[0].text).toBe("User 2 message");
  });

  test("should clear buffer manually", async () => {
    const phone = "+1234567890";
    const profileId = "profile-1";

    await aggregator.addMessage(
      phone,
      profileId,
      "Message 1",
      mockProcessCallback,
    );
    aggregator.clearBuffer(phone, profileId);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(processedMessages.length).toBe(0);
  });

  test("should provide buffer status", async () => {
    const phone = "+1234567890";
    const profileId = "profile-1";

    await aggregator.addMessage(
      phone,
      profileId,
      "Message 1",
      mockProcessCallback,
    );
    await aggregator.addMessage(
      phone,
      profileId,
      "Message 2",
      mockProcessCallback,
    );

    const status = aggregator.getBufferStatus(phone, profileId);

    expect(status).not.toBeNull();
    expect(status?.count).toBe(2);
    expect(status?.messages.length).toBe(2);
  });

  test("should provide aggregation stats", async () => {
    await aggregator.addMessage("+1111", "prof1", "Msg 1", mockProcessCallback);
    await aggregator.addMessage("+2222", "prof1", "Msg 2", mockProcessCallback);

    const stats = aggregator.getStats();

    expect(stats.activeBuffers).toBe(2);
    expect(stats.totalMessages).toBe(2);
  });
});
