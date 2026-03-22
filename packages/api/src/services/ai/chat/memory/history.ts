import { Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import path from "node:path";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

let cachedMemory: Memory | null = null;

export function getChatMemory(): Memory {
  if (!cachedMemory) {
    const dbPath = path.resolve(process.cwd(), ".voltagent/chat.db");
    const adapter = new LibSQLMemoryAdapter({
      url: `file:${dbPath}`,
    });
    cachedMemory = new Memory({ storage: adapter });
  }
  return cachedMemory;
}

export async function getConversationHistory(
  conversationId: string,
  userId: string = "webchat_user",
): Promise<ConversationMessage[]> {
  try {
    const memory = getChatMemory();

    const messages = await memory.getMessages(userId, conversationId, {
      limit: 50,
    });

    return messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => {
        let content = "";
        if (Array.isArray(msg.parts)) {
          content = msg.parts
            .map((part) => {
              const p = part as unknown as { text?: string };
              if (p.text) {
                return p.text;
              }
              return "";
            })
            .join("");
        } else if (
          typeof msg.parts === "object" &&
          msg.parts &&
          "text" in msg.parts
        ) {
          content = (msg.parts as { text: string }).text;
        }

        return {
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content,
          createdAt: new Date().toISOString(),
        };
      });
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return [];
  }
}
