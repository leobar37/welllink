#!/usr/bin/env bun

import { Command } from "commander";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: "",
});

// Helper function to handle local files and URLs
async function processImageInput(input: string): Promise<string> {
  // Check if it's a URL
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  // Check if it's a local file path
  if (existsSync(input)) {
    console.log(`📤 Uploading local file: ${input}`);
    const fileBuffer = await readFile(input);
    const response = await replicate.files.create(fileBuffer);
    console.log(`✅ File uploaded successfully: ${response.urls.get}`);
    return response.urls.get;
  }

  console.log(`❌ File does not exist: ${input}`);
  throw new Error(`File does not exist: ${input}`);
}

const program = new Command();

program
  .name("media")
  .description("CLI for image and video generation using Replicate AI models")
  .version("1.0.0");

// ==================== IMAGE COMMANDS ====================

program
  .command("nano")
  .description("Generate images using Google Nano Banana model")
  .option(
    "-p, --prompt <prompt>",
    "Text prompt for image generation",
    "Make the sheets in the style of the logo. Make the scene natural.",
  )
  .option(
    "-i, --images <images...>",
    "Input image URLs or local file paths (can specify multiple)",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "output.jpg",
  )
  .action(async (options) => {
    try {
      console.log("🚀 Starting image generation...");

      const input: any = {
        prompt: options.prompt,
      };

      // Add image inputs if provided
      if (options.images && options.images.length > 0) {
        console.log(`🔄 Processing ${options.images.length} image input(s)...`);
        input.image_input = await Promise.all(
          options.images.map((img: string) => processImageInput(img)),
        );
      } else {
        input.image_input = [];
      }

      console.log("📸 Input configuration:");
      console.log(`  Prompt: ${input.prompt}`);
      console.log(`  Images: ${input.image_input.length} image(s)`);

      const output = await replicate.run("google/nano-banana", { input });

      console.log("✅ Image generated successfully!");
      console.log(`🌐 Image URL: ${(output as any).url()}`);

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Image saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating image:", error);
      process.exit(1);
    }
  });

program
  .command("flux")
  .description("Generate images using Black Forest Labs Flux Kontext Max model")
  .option(
    "-p, --prompt <prompt>",
    "Text prompt for image generation",
    "Make the letters 3D, floating in space on a city street",
  )
  .option(
    "-i, --input-image <url>",
    "Input image URL or local file path for context",
  )
  .option("-f, --format <format>", "Output format (jpg, png)", "jpg")
  .option(
    "-a, --aspect <ratio>",
    "Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4, etc)",
    "1:1",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "output.jpg",
  )
  .action(async (options) => {
    try {
      console.log("🚀 Starting Flux image generation...");

      const input: any = {
        prompt: options.prompt,
        output_format: options.format,
        aspect_ratio: options.aspect,
      };

      // Only process input image if provided
      if (options.inputImage) {
        console.log(`🔄 Processing input image...`);
        const processedImageUrl = await processImageInput(options.inputImage);
        input.input_image = processedImageUrl;
      } else {
        console.log(
          "ℹ️ No input image provided - generating from text prompt only",
        );
      }

      console.log("📸 Input configuration:");
      console.log(`  Prompt: ${input.prompt}`);
      if (input.input_image) {
        console.log(`  Input Image: ${input.input_image}`);
      }
      console.log(`  Format: ${input.output_format}`);

      const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
        input,
      });

      console.log("✅ Image generated successfully!");
      console.log(`🌐 Image URL: ${(output as any).url()}`);

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Image saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating image:", error);
      process.exit(1);
    }
  });

program
  .command("remove-bg")
  .description("Remove background from an image using Bria AI model")
  .option("-i, --image <path>", "Input image path or URL", "")
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "no-bg.png",
  )
  .action(async (options) => {
    try {
      if (!options.image) {
        console.error(
          "❌ Error: Image path is required. Use -i or --image flag",
        );
        process.exit(1);
      }

      console.log("🚀 Starting background removal...");

      // Process the image input (local file or URL)
      const imageUrl = await processImageInput(options.image);

      const input = {
        image: imageUrl,
      };

      console.log("📸 Processing image...");
      console.log(`  Input: ${options.image}`);

      const output = await replicate.run("bria/remove-background", { input });

      console.log("✅ Background removed successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Image saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error removing background:", error);
      process.exit(1);
    }
  });

program
  .command("enhance")
  .description("Enhance image quality and increase resolution using Bria AI")
  .option("-i, --image <path>", "Input image path or URL", "")
  .option(
    "-s, --scale <number>",
    "Desired resolution increase factor (2, 4, or 8)",
    "4",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "enhanced.png",
  )
  .action(async (options) => {
    try {
      if (!options.image) {
        console.error(
          "❌ Error: Image path is required. Use -i or --image flag",
        );
        process.exit(1);
      }

      const scale = parseInt(options.scale);
      if (![2, 4, 8].includes(scale)) {
        console.error("❌ Error: Scale must be 2, 4, or 8");
        process.exit(1);
      }

      console.log("🚀 Starting image quality enhancement...");
      console.log(`  Scale factor: ${scale}x`);

      // Process the image input (local file or URL)
      const imageUrl = await processImageInput(options.image);

      const input = {
        image: imageUrl,
        desired_increase: scale,
      };

      console.log("📸 Processing image...");
      console.log(`  Input: ${options.image}`);
      console.log(`  Resolution increase: ${scale}x`);

      const output = await replicate.run("bria/increase-resolution", { input });

      console.log("✅ Image enhanced successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Enhanced image saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error enhancing image:", error);
      process.exit(1);
    }
  });

// ==================== VIDEO COMMANDS ====================

program
  .command("hailuo")
  .description(
    "Generate videos using MiniMax Hailuo 2.3 (latest, high quality)",
  )
  .option("-p, --prompt <prompt>", "Text prompt for video generation", "")
  .option("-i, --image <path>", "Input image path or URL for image-to-video")
  .option("-d, --duration <duration>", "Video duration (6s, 10s)", "6s")
  .option(
    "-q, --quality <quality>",
    "Video quality: standard (768p) or pro (1080p)",
    "standard",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "video.mp4",
  )
  .action(async (options) => {
    try {
      if (!options.prompt && !options.image) {
        console.error("❌ Error: Either --prompt or --image is required");
        process.exit(1);
      }

      console.log("🎬 Starting Hailuo 2.3 video generation...");

      const input: any = {
        duration: options.duration,
        quality: options.quality,
      };

      // Add prompt if provided
      if (options.prompt) {
        input.prompt = options.prompt;
      }

      // Add image if provided (image-to-video)
      if (options.image) {
        console.log(`🔄 Processing input image...`);
        input.image = await processImageInput(options.image);
      }

      console.log("🎥 Input configuration:");
      if (input.prompt) console.log(`  Prompt: ${input.prompt}`);
      if (input.image) console.log(`  Image: ${options.image}`);
      console.log(`  Duration: ${input.duration}`);
      console.log(`  Quality: ${input.quality}`);

      const output = await replicate.run("minimax/hailuo-2.3", { input });

      console.log("✅ Video generated successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Video saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating video:", error);
      process.exit(1);
    }
  });

program
  .command("hailuo2")
  .description("Generate videos using MiniMax Hailuo 02 (excellent physics)")
  .option("-p, --prompt <prompt>", "Text prompt for video generation", "")
  .option("-i, --image <path>", "Input image path or URL for image-to-video")
  .option("-d, --duration <duration>", "Video duration (6s, 10s)", "6s")
  .option(
    "-q, --quality <quality>",
    "Video quality: standard (768p) or pro (1080p)",
    "standard",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "video.mp4",
  )
  .action(async (options) => {
    try {
      if (!options.prompt && !options.image) {
        console.error("❌ Error: Either --prompt or --image is required");
        process.exit(1);
      }

      console.log("🎬 Starting Hailuo 02 video generation...");

      const input: any = {
        duration: options.duration,
        quality: options.quality,
      };

      // Add prompt if provided
      if (options.prompt) {
        input.prompt = options.prompt;
      }

      // Add image if provided (image-to-video)
      if (options.image) {
        console.log(`🔄 Processing input image...`);
        input.image = await processImageInput(options.image);
      }

      console.log("🎥 Input configuration:");
      if (input.prompt) console.log(`  Prompt: ${input.prompt}`);
      if (input.image) console.log(`  Image: ${options.image}`);
      console.log(`  Duration: ${input.duration}`);
      console.log(`  Quality: ${input.quality}`);

      const output = await replicate.run("minimax/hailuo-02", { input });

      console.log("✅ Video generated successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Video saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating video:", error);
      process.exit(1);
    }
  });

program
  .command("hailuo-fast")
  .description("Generate videos using MiniMax Hailuo 02 Fast (low cost, 512p)")
  .option("-p, --prompt <prompt>", "Text prompt for video generation", "")
  .option("-i, --image <path>", "Input image path or URL for image-to-video")
  .option("-d, --duration <duration>", "Video duration (6s, 10s)", "6s")
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "video.mp4",
  )
  .action(async (options) => {
    try {
      if (!options.prompt && !options.image) {
        console.error("❌ Error: Either --prompt or --image is required");
        process.exit(1);
      }

      console.log("🎬 Starting Hailuo Fast video generation...");

      const input: any = {
        duration: options.duration,
      };

      // Add prompt if provided
      if (options.prompt) {
        input.prompt = options.prompt;
      }

      // Add image if provided (image-to-video)
      if (options.image) {
        console.log(`🔄 Processing input image...`);
        input.image = await processImageInput(options.image);
      }

      console.log("🎥 Input configuration:");
      if (input.prompt) console.log(`  Prompt: ${input.prompt}`);
      if (input.image) console.log(`  Image: ${options.image}`);
      console.log(`  Duration: ${input.duration}`);
      console.log(`  Quality: 512p (fast)`);

      const output = await replicate.run("minimax/hailuo-02-fast", { input });

      console.log("✅ Video generated successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Video saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating video:", error);
      process.exit(1);
    }
  });

program
  .command("director")
  .description(
    "Generate videos with specific camera movements using MiniMax Video-01 Director",
  )
  .option("-p, --prompt <prompt>", "Text prompt for video generation", "")
  .option("-i, --image <path>", "Input image path or URL")
  .option(
    "-c, --camera <movement>",
    "Camera movement (e.g., pan-left, zoom-in, orbit)",
    "",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "video.mp4",
  )
  .action(async (options) => {
    try {
      if (!options.prompt && !options.image) {
        console.error("❌ Error: Either --prompt or --image is required");
        process.exit(1);
      }

      console.log("🎬 Starting Director video generation...");

      const input: any = {};

      // Add prompt if provided
      if (options.prompt) {
        input.prompt = options.prompt;
      }

      // Add image if provided
      if (options.image) {
        console.log(`🔄 Processing input image...`);
        input.image = await processImageInput(options.image);
      }

      // Add camera movement if specified
      if (options.camera) {
        input.camera_movement = options.camera;
      }

      console.log("🎥 Input configuration:");
      if (input.prompt) console.log(`  Prompt: ${input.prompt}`);
      if (input.image) console.log(`  Image: ${options.image}`);
      if (input.camera_movement)
        console.log(`  Camera: ${input.camera_movement}`);

      const output = await replicate.run("minimax/video-01-director", {
        input,
      });

      console.log("✅ Video generated successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Video saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating video:", error);
      process.exit(1);
    }
  });

program
  .command("live")
  .description(
    "Generate animated videos from images using MiniMax Video-01 Live (optimized for Live2D and animation)",
  )
  .option("-i, --image <path>", "Input image path or URL (required)", "")
  .option(
    "-p, --prompt <prompt>",
    "Optional text prompt for animation style",
    "",
  )
  .option(
    "-o, --output <filename>",
    "Output filename (will be saved to public directory)",
    "video.mp4",
  )
  .action(async (options) => {
    try {
      if (!options.image) {
        console.error("❌ Error: --image is required for Live animation");
        process.exit(1);
      }

      console.log("🎬 Starting Live animation video generation...");

      const input: any = {};

      // Process input image (required)
      console.log(`🔄 Processing input image...`);
      input.image = await processImageInput(options.image);

      // Add optional prompt
      if (options.prompt) {
        input.prompt = options.prompt;
      }

      console.log("🎥 Input configuration:");
      console.log(`  Image: ${options.image}`);
      if (input.prompt) console.log(`  Prompt: ${input.prompt}`);

      const output = await replicate.run("minimax/video-01-live", { input });

      console.log("✅ Animated video generated successfully!");

      // Create full path to public directory
      const publicPath = join(process.cwd(), "public", options.output);

      // Write the file to public directory
      await writeFile(publicPath, output as any);
      console.log(`💾 Video saved to: ${publicPath}`);
    } catch (error) {
      console.error("❌ Error generating animated video:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
