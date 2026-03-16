import { ConversionOperation } from "../types";

export const operations: ConversionOperation[] = [
  {
    id: "pdf-to-docx",
    name: "PDF to DOCX",
    category: "PDF",
    accepts: ["pdf"],
    outputs: ["docx", "txt"],
    options: [
      {
        key: "ocr",
        label: "Enable OCR",
        type: "boolean",
        ariaLabel: "Enable OCR for scanned PDFs",
        defaultValue: true,
      },
      {
        key: "layout",
        label: "Layout mode",
        type: "select",
        ariaLabel: "Choose PDF layout conversion mode",
        choices: ["Flowing", "Preserve"],
        defaultValue: "Preserve",
      },
    ],
  },
  {
    id: "docx-to-pdf",
    name: "DOCX to PDF",
    category: "Office",
    accepts: ["docx"],
    outputs: ["pdf"],
    options: [
      {
        key: "pageSize",
        label: "Page size",
        type: "select",
        ariaLabel: "Select output page size",
        choices: ["A4", "Letter"],
        defaultValue: "A4",
      },
      {
        key: "compress",
        label: "Compress images",
        type: "boolean",
        ariaLabel: "Enable image compression",
        defaultValue: false,
      },
    ],
  },
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    category: "Image",
    accepts: ["png", "webp"],
    outputs: ["jpg", "webp"],
    options: [
      {
        key: "quality",
        label: "Quality",
        type: "number",
        ariaLabel: "Output image quality percentage",
        min: 40,
        max: 100,
        defaultValue: 90,
      },
      {
        key: "stripMetadata",
        label: "Strip metadata",
        type: "boolean",
        ariaLabel: "Remove metadata from image",
        defaultValue: true,
      },
    ],
  },
  {
    id: "mp4-to-mp3",
    name: "MP4 to MP3",
    category: "Media",
    accepts: ["mp4", "mov"],
    outputs: ["mp3", "wav"],
    options: [
      {
        key: "bitrate",
        label: "Bitrate",
        type: "select",
        ariaLabel: "Select audio bitrate",
        choices: ["128k", "192k", "320k"],
        defaultValue: "192k",
      },
    ],
  },
  {
    id: "csv-to-json",
    name: "CSV to JSON",
    category: "Data",
    accepts: ["csv"],
    outputs: ["json"],
    options: [
      {
        key: "delimiter",
        label: "Delimiter",
        type: "select",
        ariaLabel: "Choose CSV delimiter",
        choices: [",", ";", "tab"],
        defaultValue: ",",
      },
      {
        key: "headerRow",
        label: "First row as headers",
        type: "boolean",
        ariaLabel: "Treat first row as header",
        defaultValue: true,
      },
    ],
  },
  {
    id: "zip-to-7z",
    name: "ZIP to 7Z",
    category: "Archive",
    accepts: ["zip"],
    outputs: ["7z", "tar"],
    options: [
      {
        key: "level",
        label: "Compression level",
        type: "number",
        ariaLabel: "Compression level",
        min: 1,
        max: 9,
        defaultValue: 7,
      },
      {
        key: "password",
        label: "Encrypt output",
        type: "boolean",
        ariaLabel: "Password protect output archive",
        defaultValue: false,
      },
    ],
  },
];

export const categoryOrder = ["PDF", "Office", "Image", "Media", "Data", "Archive"] as const;
