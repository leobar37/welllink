/**
 * Message Aggregator Service
 *
 * Handles debouncing and aggregation of sequential WhatsApp messages
 * from the same user to avoid multiple fragmented AI responses.
 *
 * Strategy:
 * - Buffer messages for a configurable debounce period (default 8s)
 * - After debounce period with no new messages, aggregate all buffered messages
 * - Process once with full context
 * - Prevent duplicate processing with locks
 */

interface MessageBuffer {
  messages: Array<{
    text: string;
    timestamp: number;
  }>;
  firstMessageAt: number;
  lastMessageAt: number;
  count: number;
  timeoutId?: NodeJS.Timeout;
  isProcessing: boolean;
}

interface AggregationResult {
  shouldProcess: boolean;
  aggregatedText: string;
  messageCount: number;
  waitTime: number;
}

export class MessageAggregatorService {
  private buffers: Map<string, MessageBuffer> = new Map();
  private readonly DEBOUNCE_MS: number;
  private readonly MAX_BUFFER_AGE_MS: number;
  private readonly MAX_MESSAGES: number;
  private readonly MAX_CHARS: number;

  constructor(options?: {
    debounceMs?: number;
    maxBufferAgeMs?: number;
    maxMessages?: number;
    maxChars?: number;
  }) {
    this.DEBOUNCE_MS = options?.debounceMs ?? 8000; // 8 seconds default
    this.MAX_BUFFER_AGE_MS = options?.maxBufferAgeMs ?? 45000; // 45 seconds max
    this.MAX_MESSAGES = options?.maxMessages ?? 10;
    this.MAX_CHARS = options?.maxChars ?? 2000;
  }

  /**
   * Generates unique buffer key for phone number
   */
  private getBufferKey(phone: string, profileId: string): string {
    return `${profileId}:${phone}`;
  }

  /**
   * Add message to buffer and determine if should process
   * Returns a promise that resolves when processing should happen
   */
  async addMessage(
    phone: string,
    profileId: string,
    text: string,
    onProcess: (aggregatedText: string, messageCount: number) => Promise<void>,
  ): Promise<AggregationResult> {
    const key = this.getBufferKey(phone, profileId);
    const now = Date.now();

    // Get or create buffer
    let buffer = this.buffers.get(key);

    if (!buffer) {
      buffer = {
        messages: [],
        firstMessageAt: now,
        lastMessageAt: now,
        count: 0,
        isProcessing: false,
      };
      this.buffers.set(key, buffer);
    }

    // If already processing, queue this message for next batch
    if (buffer.isProcessing) {
      buffer.messages.push({ text, timestamp: now });
      buffer.lastMessageAt = now;
      buffer.count++;

      return {
        shouldProcess: false,
        aggregatedText: "",
        messageCount: buffer.count,
        waitTime: this.DEBOUNCE_MS,
      };
    }

    // Add message to buffer
    buffer.messages.push({ text, timestamp: now });
    buffer.lastMessageAt = now;
    buffer.count++;

    // Clear existing timeout
    if (buffer.timeoutId) {
      clearTimeout(buffer.timeoutId);
    }

    // Check if should force process (max age or max messages reached)
    const age = now - buffer.firstMessageAt;
    const shouldForceProcess =
      age > this.MAX_BUFFER_AGE_MS || buffer.count >= this.MAX_MESSAGES;

    if (shouldForceProcess) {
      return await this.processBuffer(key, onProcess);
    }

    // Set new debounce timeout
    return new Promise((resolve) => {
      buffer!.timeoutId = setTimeout(async () => {
        const result = await this.processBuffer(key, onProcess);
        resolve(result);
      }, this.DEBOUNCE_MS);

      // Return immediate response indicating buffer is waiting
      resolve({
        shouldProcess: false,
        aggregatedText: "",
        messageCount: buffer!.count,
        waitTime: this.DEBOUNCE_MS,
      });
    });
  }

  /**
   * Process buffered messages
   */
  private async processBuffer(
    key: string,
    onProcess: (aggregatedText: string, messageCount: number) => Promise<void>,
  ): Promise<AggregationResult> {
    const buffer = this.buffers.get(key);

    if (!buffer || buffer.messages.length === 0) {
      return {
        shouldProcess: false,
        aggregatedText: "",
        messageCount: 0,
        waitTime: 0,
      };
    }

    // Mark as processing to prevent concurrent processing
    buffer.isProcessing = true;

    // Aggregate messages in chronological order
    const aggregatedText = buffer.messages
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((m) => m.text)
      .join("\n")
      .substring(0, this.MAX_CHARS);

    const messageCount = buffer.messages.length;
    const waitTime = Date.now() - buffer.firstMessageAt;

    // Clear buffer
    this.buffers.delete(key);

    // Process aggregated message
    try {
      await onProcess(aggregatedText, messageCount);

      return {
        shouldProcess: true,
        aggregatedText,
        messageCount,
        waitTime,
      };
    } catch (error) {
      console.error("Error processing aggregated messages:", error);
      throw error;
    }
  }

  /**
   * Get current buffer status (for debugging)
   */
  getBufferStatus(phone: string, profileId: string): MessageBuffer | null {
    const key = this.getBufferKey(phone, profileId);
    return this.buffers.get(key) || null;
  }

  /**
   * Clear buffer manually (e.g., on user explicit action)
   */
  clearBuffer(phone: string, profileId: string): void {
    const key = this.getBufferKey(phone, profileId);
    const buffer = this.buffers.get(key);

    if (buffer?.timeoutId) {
      clearTimeout(buffer.timeoutId);
    }

    this.buffers.delete(key);
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    activeBuffers: number;
    totalMessages: number;
  } {
    let totalMessages = 0;

    for (const buffer of this.buffers.values()) {
      totalMessages += buffer.count;
    }

    return {
      activeBuffers: this.buffers.size,
      totalMessages,
    };
  }
}

// Singleton instance
let aggregatorInstance: MessageAggregatorService | null = null;

/**
 * Get or create singleton aggregator instance
 */
export function getMessageAggregator(): MessageAggregatorService {
  if (!aggregatorInstance) {
    aggregatorInstance = new MessageAggregatorService({
      debounceMs: parseInt(process.env.INBOUND_DEBOUNCE_MS || "8000"),
      maxBufferAgeMs: parseInt(process.env.INBOUND_MAX_BUFFER_AGE_MS || "45000"),
      maxMessages: parseInt(process.env.INBOUND_MAX_MESSAGES || "10"),
      maxChars: parseInt(process.env.INBOUND_MAX_CHARS || "2000"),
    });
  }

  return aggregatorInstance;
}
