import type { WhatsAppConfig } from "../../db/schema/whatsapp-config";

export interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  owner: string;
  qrcode: {
    count: number;
    base64: string;
    interval: number;
  };
  pagestate: string;
  profile: {
      pictureUrl: string | null;
      userid: string | null;
      pushname: string | null;
      wid: string;
  };
  connection: {
      state: string;
      isOnline: boolean;
  };
  number: string | null;
  profilePicUrl: string | null;
  integration: string;
}

export interface EvolutionMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      viewOnce?: boolean;
      jpegThumbnail?: string;
      mediaKey?: string;
      mimetype?: string;
      fileSha256?: string;
      fileLength?: string;
      height?: number;
      width?: number;
      mediaUrl?: string;
      directPath?: string;
    };
    videoMessage?: {
      caption?: string;
      viewOnce?: boolean;
      jpegThumbnail?: string;
      mediaKey?: string;
      mimetype?: string;
      fileSha256?: string;
      fileLength?: string;
      height?: number;
      width?: number;
      seconds?: number;
      mediaUrl?: string;
      directPath?: string;
    };
    documentMessage?: {
      title?: string;
      fileName?: string;
      mediaKey?: string;
      mimetype?: string;
      fileSha256?: string;
      fileLength?: string;
      pageCount?: number;
      mediaUrl?: string;
      directPath?: string;
    };
    audioMessage?: {
      url?: string;
      mimetype?: string;
      fileSha256?: string;
      fileLength?: string;
      seconds?: number;
      directPath?: string;
    };
  };
  messageTimestamp: number;
  pushName: string;
  participant?: string;
  messageType: string;
}

export interface EvolutionWebhookEvent {
  event: string;
  instance: string;
  data: {
    id?: string;
    key?: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    status?: string;
    timestamp?: number;
    message?: EvolutionMessage;
    messageTimestamp?: number;
    pushName?: string;
    messageType?: string;
    text?: string;
    recipientType?: string;
    idMessage?: string;
    statusMessage?: string;
    [key: string]: any;
  };
}

export interface SendTextOptions {
  number: string;
  text: string;
  linkPreview?: boolean;
  quotedMessage?: {
    key: {
      id: string;
      remoteJid: string;
      fromMe: boolean;
    };
    message?: any;
  };
  delay?: number;
  presence?: string;
}

export interface SendMediaOptions {
  number: string;
  mediatype: "image" | "video" | "document" | "audio";
  media: string | Buffer;
  fileName?: string;
  caption?: string;
  quotedMessage?: any;
  delay?: number;
}

export interface TemplateMessage {
  number: string;
  templateName: string;
  templateComponents: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text?: string;
      media?: {
        link: string;
      };
      currency?: {
        fallbackValue: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallbackValue: string;
      };
    }>;
  }>;
}

export class EvolutionService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createInstance(instanceName: string, config: Partial<WhatsAppConfig["config"]> = {}): Promise<EvolutionInstance> {
    const body = {
      instanceName,
      qrcode: true,
      number: null,
      token: config.token || "",
      mobile: false,
      webhook: {
        enabled: config.webhook?.enabled || false,
        url: config.webhook?.url || "",
        events: config.webhook?.events || [],
      },
      chatbot: {
        enabled: config.chatbot?.enabled || false,
        ignoreGroups: config.chatbot?.ignoreGroups || true,
        ignoreBroadcast: config.chatbot?.ignoreBroadcast || true,
      },
    };

    return this.makeRequest("/instance/create", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/delete/${instanceName}`, {
      method: "DELETE",
    });
  }

  async getInstance(instanceName: string): Promise<EvolutionInstance> {
    return this.makeRequest(`/instance/find/${instanceName}`);
  }

  async getInstances(): Promise<EvolutionInstance[]> {
    return this.makeRequest("/instance/fetchAll");
  }

  async connectInstance(instanceName: string): Promise<{ qrcode: { base64: string } }> {
    return this.makeRequest(`/instance/connect/${instanceName}`);
  }

  async disconnectInstance(instanceName: string): Promise<{ result: boolean }> {
    return this.makeRequest(`/instance/logout/${instanceName}`, {
      method: "DELETE",
    });
  }

  async sendText(instanceName: string, options: SendTextOptions): Promise<any> {
    return this.makeRequest(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async sendMedia(instanceName: string, options: SendMediaOptions): Promise<any> {
    return this.makeRequest(`/message/sendMedia/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  async sendTemplate(instanceName: string, template: TemplateMessage): Promise<any> {
    return this.makeRequest(`/message/sendTemplate/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(template),
    });
  }

  async uploadMedia(instanceName: string, media: Buffer): Promise<{ url: string; mimetype: string; fileName: string }> {
    const formData = new FormData();
    formData.append("file", new Blob([media], { type: "application/octet-stream" }));

    const response = await fetch(`${this.baseUrl}/upload/file/${instanceName}`, {
      method: "POST",
      headers: {
        "apikey": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Evolution API upload error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateQRCode(instanceName: string): Promise<{ qrcode: { base64: string } }> {
    return this.makeRequest(`/instance/connect/${instanceName}`);
  }

  async checkConnection(instanceName: string): Promise<{ result: boolean; state: string }> {
    return this.makeRequest(`/instance/connectionState/${instanceName}`);
  }

  async getProfilePicture(instanceName: string, number: string): Promise<{ profilePictureUrl: string }> {
    return this.makeRequest(`/chat/profilePicture/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ number }),
    });
  }

  // Template management
  async createTemplate(instanceName: string, template: any): Promise<any> {
    return this.makeRequest(`/template/create/${instanceName}`, {
      method: "POST",
      body: JSON.stringify(template),
    });
  }

  async getTemplates(instanceName: string): Promise<any[]> {
    return this.makeRequest(`/template/fetch/${instanceName}`);
  }

  async deleteTemplate(instanceName: string, templateName: string): Promise<any> {
    return this.makeRequest(`/template/delete/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({ name: templateName }),
    });
  }

  // Utility methods
  formatPhoneNumber(number: string): string {
    // Remove any non-digit characters
    let formatted = number.replace(/\D/g, "");

    // Add country code if missing (assuming Brazil)
    if (formatted.length === 11 && !formatted.startsWith("55")) {
      formatted = `55${formatted}`;
    }

    // Add @c.us suffix
    return `${formatted}@c.us`;
  }

  extractMessageContent(message: EvolutionMessage): {
    text?: string;
    media?: {
      type: "image" | "video" | "document" | "audio";
      url: string;
      mimetype: string;
      caption?: string;
      filename?: string;
    };
  } {
    const content: any = {};

    if (message.message.conversation) {
      content.text = message.message.conversation;
    } else if (message.message.extendedTextMessage?.text) {
      content.text = message.message.extendedTextMessage.text;
    } else if (message.message.imageMessage) {
      content.media = {
        type: "image",
        url: message.message.imageMessage.mediaUrl || "",
        mimetype: message.message.imageMessage.mimetype || "image/jpeg",
        caption: message.message.imageMessage.caption,
      };
    } else if (message.message.videoMessage) {
      content.media = {
        type: "video",
        url: message.message.videoMessage.mediaUrl || "",
        mimetype: message.message.videoMessage.mimetype || "video/mp4",
        caption: message.message.videoMessage.caption,
      };
    } else if (message.message.documentMessage) {
      content.media = {
        type: "document",
        url: message.message.documentMessage.mediaUrl || "",
        mimetype: message.message.documentMessage.mimetype || "application/pdf",
        filename: message.message.documentMessage.fileName,
      };
    } else if (message.message.audioMessage) {
      content.media = {
        type: "audio",
        url: message.message.audioMessage.url || "",
        mimetype: message.message.audioMessage.mimetype || "audio/ogg",
      };
    }

    return content;
  }
}