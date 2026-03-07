import { getServerSession } from "next-auth";
import { spawnSync } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/auth";
import { getPlanConfig } from "@/app/lib/plans";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = [".docx", ".txt"];

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

interface ConversionOptions {
  toc?: boolean;
  tocDepth?: number;
  epubVersion?: "epub3" | "epub2";
  title?: string;
  author?: string;
  language?: string;
  publisher?: string;
  date?: string;
  style?: string;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? name : name.slice(0, i);
}

export async function POST(request: Request) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;
  let coverPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Send a file in the 'file' field." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found. Please sign in again." },
        { status: 401 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "Only DOCX and TXT files are supported for conversion." },
        { status: 400 }
      );
    }

    const planConfig = getPlanConfig(dbUser.plan);
    const limit = planConfig.conversions;
    const startOfMonth = getStartOfMonth(new Date());
    const conversionCount = await prisma.conversion.count({
      where: {
        userId: dbUser.id,
        createdAt: { gte: startOfMonth },
      },
    });

    let useCredit = false;
    if (limit !== Infinity && conversionCount >= limit) {
      if (dbUser.credits > 0) {
        useCredit = true;
      } else {
        return NextResponse.json(
          { error: "Conversion limit reached. Please upgrade your plan or add credits." },
          { status: 403 }
        );
      }
    }

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "epub-"));
    const safeBase = baseName(file.name).replace(/[^a-zA-Z0-9-_]/g, "_") || "document";
    inputPath = path.join(dir, file.name);
    outputPath = path.join(dir, `${safeBase}.epub`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    const cover = formData.get("cover");
    if (cover && cover instanceof File) {
      const coverExt = getExtension(cover.name).toLowerCase() === ".png" ? ".png" : ".jpg";
      coverPath = path.join(dir, `cover${coverExt}`);
      const coverBuffer = Buffer.from(await cover.arrayBuffer());
      await fs.writeFile(coverPath, coverBuffer);
    }

    const optionsRaw = formData.get("options");
    const options: ConversionOptions = typeof optionsRaw === "string"
      ? (JSON.parse(optionsRaw) as ConversionOptions)
      : {};
    const toc = options.toc !== false;
    const tocDepth = Math.min(3, Math.max(1, options.tocDepth ?? 3));
    const title = options.title?.trim() ?? "";
    const author = options.author?.trim() ?? "";
    const language = options.language?.trim() ?? "";
    const publisher = options.publisher?.trim() ?? "";
    const date = options.date?.trim() ?? "";
    const style = options.style || "default";
    const cssPath = path.join(process.cwd(), "styles", `${style}.css`);

    const args: string[] = [inputPath];
    if (toc) {
      args.push("--toc", `--toc-depth=${tocDepth}`);
    }
    if (options.epubVersion) {
      args.push("-t", options.epubVersion);
    }
    if (coverPath) {
      args.push(`--epub-cover-image=${coverPath}`);
    }
    args.push(`--css=${cssPath}`);
    if (title) args.push("--metadata", `title=${JSON.stringify(title)}`);
    if (author) args.push("--metadata", `author=${JSON.stringify(author)}`);
    if (language) args.push("--metadata", `language=${JSON.stringify(language)}`);
    if (publisher) args.push("--metadata", `publisher=${JSON.stringify(publisher)}`);
    if (date) args.push("--metadata", `date=${JSON.stringify(date)}`);
    args.push("-o", outputPath);

    const result = spawnSync("pandoc", args, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(result.stderr || result.error?.message || "Pandoc failed");
    }

    const epubBuffer = await fs.readFile(outputPath);
    const downloadName = `${safeBase}.epub`;

    await prisma.conversion.create({
      data: { userId: dbUser.id },
    });

    if (useCredit) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { credits: { decrement: 1 } },
      });
    }

    return new NextResponse(epubBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": String(epubBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Conversion failed";
    return NextResponse.json(
      { error: message.includes("Pandoc") ? "Pandoc conversion failed. Is Pandoc installed?" : message },
      { status: 500 }
    );
  } finally {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
    if (coverPath) await fs.unlink(coverPath).catch(() => {});
    if (inputPath) {
      const dir = path.dirname(inputPath);
      if (dir.startsWith(os.tmpdir())) await fs.rmdir(dir).catch(() => {});
    }
  }
}
