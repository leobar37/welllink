const { chromium } = require("playwright");

const TARGET_URL = "http://localhost:5179/maria_wellness";

(async () => {
  console.log("=".repeat(60));
  console.log("CHAT WIDGET AVAILABILITY TEST");
  console.log("=".repeat(60));
  console.log(`Target URL: ${TARGET_URL}`);
  console.log("Testing: Agent response with actual availability slots\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to profile page
    console.log("[STEP 1] Navigating to profile page...");
    await page.goto(TARGET_URL, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    const pageTitle = await page.title();
    console.log(`✅ Page loaded: "${pageTitle}"`);

    await page.screenshot({
      path: ".qamanual/screenshots/01-profile-initial.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: 01-profile-initial.png\n");

    // Step 2: Find and click chat button
    console.log("[STEP 2] Looking for chat button...");

    // Common selectors for chat buttons
    const chatSelectors = [
      '[data-testid="chat-button"]',
      '[data-testid="chat-widget-button"]',
      'button[aria-label*="chat" i]',
      'button:has-text("Chat")',
      'button:has-text("Mensaje")',
      ".chat-button",
      ".chat-widget-button",
      'button svg[data-lucide="message-circle"]',
      'button svg[data-lucide="message-square"]',
      "button:has(svg)",
      "button.fixed", // Fixed position buttons are often chat widgets
      '[role="button"]:has(svg)',
    ];

    let chatButton = null;
    let usedSelector = "";

    for (const selector of chatSelectors) {
      try {
        const button = await page.locator(selector).first();
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
          chatButton = button;
          usedSelector = selector;
          console.log(`✅ Found chat button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!chatButton) {
      // Try to find any floating button that might be the chat
      console.log("Trying to find floating chat button...");
      const allButtons = await page.locator("button").all();
      for (const btn of allButtons) {
        const isVisible = await btn.isVisible().catch(() => false);
        const box = await btn.boundingBox().catch(() => null);
        if (isVisible && box && box.y > 500) {
          // Bottom half of page
          chatButton = btn;
          console.log("✅ Found potential chat button (bottom of page)");
          break;
        }
      }
    }

    if (!chatButton) {
      throw new Error("Chat button not found on page");
    }

    await chatButton.click();
    console.log("✅ Clicked chat button\n");

    // Wait for chat widget to open
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: ".qamanual/screenshots/02-chat-widget-open.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: 02-chat-widget-open.png\n");

    // Step 3: Find input field and type message
    console.log("[STEP 3] Typing availability question...");

    const inputSelectors = [
      '[data-testid="chat-input"]',
      '[data-testid="message-input"]',
      'input[placeholder*="mensaje" i]',
      'input[placeholder*="message" i]',
      'textarea[placeholder*="mensaje" i]',
      'textarea[placeholder*="message" i]',
      'input[type="text"]',
      "textarea",
      '[contenteditable="true"]',
    ];

    let inputField = null;

    for (const selector of inputSelectors) {
      try {
        const field = await page.locator(selector).first();
        const isVisible = await field.isVisible().catch(() => false);
        if (isVisible) {
          inputField = field;
          console.log(`✅ Found input field with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!inputField) {
      throw new Error("Chat input field not found");
    }

    const testMessage = "¿Cuándo tienes disponibilidad?";
    await inputField.fill(testMessage);
    console.log(`✅ Typed message: "${testMessage}"`);

    await page.screenshot({
      path: ".qamanual/screenshots/03-message-typed.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: 03-message-typed.png\n");

    // Step 4: Send message (press Enter or click send button)
    console.log("[STEP 4] Sending message...");

    // Try to find send button
    const sendSelectors = [
      '[data-testid="send-button"]',
      'button[type="submit"]',
      'button:has(svg[data-lucide="send"])',
      'button:has-text("Send")',
      'button:has-text("Enviar")',
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        const btn = await page.locator(selector).first();
        const isVisible = await btn.isVisible().catch(() => false);
        if (isVisible) {
          sendButton = btn;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (sendButton) {
      await sendButton.click();
      console.log("✅ Clicked send button");
    } else {
      await inputField.press("Enter");
      console.log("✅ Pressed Enter to send");
    }

    await page.screenshot({
      path: ".qamanual/screenshots/04-message-sent.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: 04-message-sent.png\n");

    // Step 5: Wait for agent response
    console.log("[STEP 5] Waiting for agent response...");
    console.log("(This may take 10-30 seconds for AI processing)\n");

    // Wait for response (up to 45 seconds)
    await page.waitForTimeout(3000);

    // Look for agent message
    const agentMessageSelectors = [
      '[data-testid="agent-message"]',
      '[data-testid="ai-message"]',
      ".message.agent",
      ".message.ai",
      '[data-role="assistant"]',
      ".chat-message:not(.user)",
    ];

    let agentResponse = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (attempts < maxAttempts && !agentResponse) {
      attempts++;
      console.log(`  Attempt ${attempts}/${maxAttempts}...`);

      for (const selector of agentMessageSelectors) {
        try {
          const messages = await page.locator(selector).all();
          for (const msg of messages) {
            const isVisible = await msg.isVisible().catch(() => false);
            if (isVisible) {
              const text = await msg.textContent();
              if (text && text.length > 10) {
                agentResponse = text;
                console.log(`✅ Found agent response!`);
                break;
              }
            }
          }
          if (agentResponse) break;
        } catch (e) {
          // Continue
        }
      }

      if (!agentResponse) {
        await page.waitForTimeout(3000);
        // Take progress screenshot
        await page.screenshot({
          path: `.qamanual/screenshots/05-waiting-${attempts}.png`,
          fullPage: true,
        });
      }
    }

    if (!agentResponse) {
      // Try to get any message text from the chat
      console.log("Trying to extract messages from chat container...");
      const chatContainer = await page
        .locator('.chat-messages, [class*="messages"], [class*="chat"]')
        .first();
      if (chatContainer) {
        const allText = await chatContainer.textContent();
        console.log("Chat content:", allText);
      }
    }

    await page.screenshot({
      path: ".qamanual/screenshots/05-agent-response.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved: 05-agent-response.png\n");

    // Step 6: Analyze response
    console.log("=".repeat(60));
    console.log("TEST RESULTS");
    console.log("=".repeat(60));

    if (agentResponse) {
      console.log("\n🤖 AGENT RESPONSE:");
      console.log("-".repeat(60));
      console.log(agentResponse);
      console.log("-".repeat(60));

      // Check for time slots in response
      const timePatterns = [
        /\d{1,2}:\d{2}/, // Time format like 14:30, 2:30
        /\d{1,2}\s*(am|pm)/i, // AM/PM format
        /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i, // Spanish days
        /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, // English days
        /disponible/i, // Available
        /horario/i, // Schedule
        /cita/i, // Appointment
        /slot/i, // Slots
      ];

      const hasTimeInfo = timePatterns.some((pattern) =>
        pattern.test(agentResponse),
      );
      const hasGenericPhrases =
        /no tengo|no disponible|no sé|no se|no puedo/i.test(agentResponse);

      console.log("\n📊 ANALYSIS:");
      if (hasTimeInfo) {
        console.log("✅ PASS: Response contains time/date information");
      } else {
        console.log("⚠️ WARNING: Response may not contain specific time slots");
      }

      if (hasGenericPhrases) {
        console.log(
          '❌ FAIL: Response contains generic "I don\'t know" type phrases',
        );
      } else {
        console.log(
          "✅ PASS: Response appears substantive (no generic rejection)",
        );
      }

      // Final verdict
      console.log("\n🏁 FINAL VERDICT:");
      if (hasTimeInfo && !hasGenericPhrases) {
        console.log(
          "✅ SUCCESS: Agent responded with availability information",
        );
      } else if (!hasTimeInfo) {
        console.log("❌ ISSUE: Agent did not provide specific time slots");
      } else {
        console.log("⚠️ PARTIAL: Response received but quality uncertain");
      }
    } else {
      console.log("❌ FAIL: No agent response captured");
      console.log("Possible issues:");
      console.log("  - Chat backend not responding");
      console.log("  - AI service timeout");
      console.log("  - WebSocket connection issue");
    }

    console.log("\n" + "=".repeat(60));
    console.log("Test completed. Screenshots saved in .qamanual/screenshots/");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ TEST ERROR:", error.message);
    console.error(error.stack);

    await page.screenshot({
      path: ".qamanual/screenshots/error-state.png",
      fullPage: true,
    });
    console.log("📸 Error screenshot saved: error-state.png");
  } finally {
    // Keep browser open for a moment to see final state
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
