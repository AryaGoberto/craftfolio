import React from "react";
import { describe, expect, it } from "vitest";
import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { extractTextFromPdfBuffer } from "@/lib/pdf-text-extractor";

describe("extractTextFromPdfBuffer", () => {
  it("extracts linear text from a 1-page PDF in top-to-bottom reading order", async () => {
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        {
          size: "A4",
          style: { fontFamily: "Helvetica", fontSize: 11, padding: 36 },
        },
        React.createElement(Text, null, "RAKA PRATAMA"),
        React.createElement(Text, null, "EXPERIENCE"),
        React.createElement(
          Text,
          null,
          "Frontend Engineer at PT Teknologi Nusantara"
        )
      )
    );

    const buffer = await renderToBuffer(doc);
    const result = await extractTextFromPdfBuffer(new Uint8Array(buffer));

    expect(result.pageCount).toBe(1);
    expect(result.pages).toHaveLength(1);
    expect(result.fullText).not.toContain("--- HALAMAN 1 ---");

    const nameIdx = result.fullText.indexOf("RAKA PRATAMA");
    const expIdx = result.fullText.indexOf("EXPERIENCE");
    const roleIdx = result.fullText.indexOf(
      "Frontend Engineer at PT Teknologi Nusantara"
    );
    expect(nameIdx).toBeGreaterThan(-1);
    expect(expIdx).toBeGreaterThan(nameIdx);
    expect(roleIdx).toBeGreaterThan(expIdx);
  });

  it("orders multiple items on the same horizontal row from left to right", async () => {
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        {
          size: "A4",
          style: { fontFamily: "Helvetica", fontSize: 11, padding: 36 },
        },
        React.createElement(
          View,
          {
            style: {
              flexDirection: "row",
              justifyContent: "space-between",
            },
          },
          React.createElement(Text, null, "Frontend Engineer"),
          React.createElement(Text, null, "Jan 2023 - Present")
        )
      )
    );

    const buffer = await renderToBuffer(doc);
    const result = await extractTextFromPdfBuffer(new Uint8Array(buffer));

    expect(result.pageCount).toBe(1);
    expect(result.pages[0]).toBe("Frontend Engineer Jan 2023 - Present");
  });

  it("extracts multi-page PDF content with page headers and supports ArrayBuffer input", async () => {
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        {
          size: "A4",
          style: { fontFamily: "Helvetica", fontSize: 11, padding: 36 },
        },
        React.createElement(Text, null, "Page One Heading"),
        React.createElement(Text, null, "First page content line")
      ),
      React.createElement(
        Page,
        {
          size: "A4",
          style: { fontFamily: "Helvetica", fontSize: 11, padding: 36 },
        },
        React.createElement(Text, null, "Page Two Heading"),
        React.createElement(Text, null, "Second page content line")
      )
    );

    const buffer = await renderToBuffer(doc);
    const arrayBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(arrayBuffer).set(buffer);

    const result = await extractTextFromPdfBuffer(arrayBuffer);

    expect(result.pageCount).toBe(2);
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toContain("Page One Heading");
    expect(result.pages[0]).toContain("First page content line");
    expect(result.pages[1]).toContain("Page Two Heading");
    expect(result.pages[1]).toContain("Second page content line");
    expect(result.fullText).toContain("--- HALAMAN 1 ---");
    expect(result.fullText).toContain("--- HALAMAN 2 ---");
  });

  it("rejects cleanly when given invalid or corrupt PDF bytes", async () => {
    const invalidBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    await expect(extractTextFromPdfBuffer(invalidBytes)).rejects.toThrow();
  });
});
