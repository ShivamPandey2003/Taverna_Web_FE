// Columns an offers CSV must have, as they're spelled in the dealership's
// "dynamic payments" export. Order doesn't matter; extra columns are ignored.
export const OFFER_CSV_HEADERS = [
  "VIN",
  "Stock Number",
  "Brand Name",
  "Year",
  "Model",
  "Trim",
  "Condition",
  "Offer Type",
  "Payment",
  "Payment No Tax",
  "Total Rebate",
  "Term",
  "Down Payment",
  "Due At Signing",
  "APR",
  "Lender",
  "Description",
  "Disclaimer",
] as const;

export type OfferCsvHeader = (typeof OFFER_CSV_HEADERS)[number];
export type OfferCsvRow = Record<OfferCsvHeader, string>;

export const OFFER_CSV_MAX_BYTES = 10 * 1024 * 1024;

// Rows of the example file the admin can download to see the expected columns
const EXAMPLE_ROWS: string[][] = [
  [
    "3C6RREFG1T4203471",
    "R203471",
    "Ram",
    "2026",
    "1500",
    "Big Horn",
    "New",
    "First and Fees",
    "249",
    "249",
    "13000",
    "39",
    "0",
    "4908",
    "6.471",
    "CAL",
    "Cal Automotive (5K Low Mileage Vehicle Special) Closed End",
    "*Stock#: R203471, MSRP: $57,585. $249/Mo. for 39 Months. $4,908 total due at signing. See dealer for details. Offer ends 9/7/2026.",
  ],
  [
    "3C6RREFG1T4203471",
    "R203471",
    "Ram",
    "2026",
    "1500",
    "Big Horn",
    "New",
    "Low APR Finance Deal",
    "889",
    "889",
    "0",
    "60",
    "0",
    "0",
    "0.000",
    "SFS",
    "Stellantis Financial Services (Stand-Alone APR Program) Prime Tier 1",
    "*For qualified customers only. 0.00% APR financing for 60 months. $16.67 per $1,000 financed. Must take delivery by 8/31/2026.",
  ],
];

const csvCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export function downloadExampleOfferCsv() {
  const lines = [[...OFFER_CSV_HEADERS], ...EXAMPLE_ROWS].map((row) => row.map(csvCell).join(","));
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "offers_example.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

// Quoted cells can hold commas, doubled quotes and line breaks (the disclaimers do)
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  // Blank lines aren't rows
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

export interface OfferCsvCheck {
  // Required columns the file doesn't have; the file can't be uploaded with any
  missingHeaders: OfferCsvHeader[];
  rowCount: number;
  // Line numbers (the header is 1) of rows with the wrong number of cells or no VIN
  badRows: number[];
  // First few rows, to look over before uploading (none while columns are missing)
  preview: OfferCsvRow[];
}

const PREVIEW_ROWS = 5;

export function checkOfferCsv(text: string): OfferCsvCheck {
  const [headerRow = [], ...rows] = parseCsv(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
  const headers = headerRow.map((header) => header.trim().toLowerCase());
  const indexOf = (header: OfferCsvHeader) => headers.indexOf(header.toLowerCase());
  const missingHeaders = OFFER_CSV_HEADERS.filter((header) => indexOf(header) === -1);

  const vin = indexOf("VIN");
  const badRows = rows.flatMap((cells, index) =>
    cells.length !== headerRow.length || (vin !== -1 && !cells[vin]?.trim()) ? [index + 2] : [],
  );

  const preview = missingHeaders.length
    ? []
    : rows.slice(0, PREVIEW_ROWS).map(
        (cells) =>
          Object.fromEntries(
            OFFER_CSV_HEADERS.map((header) => [header, cells[indexOf(header)]?.trim() ?? ""]),
          ) as OfferCsvRow,
      );

  return {
    missingHeaders,
    rowCount: rows.length,
    badRows,
    preview,
  };
}

export const isOfferCsvValid = (check: OfferCsvCheck) =>
  !check.missingHeaders.length && !check.badRows.length && check.rowCount > 0;
