import { useRef, useState } from "react";
import { AlertCircle, CheckCircle, CloudUpload, Download, FileText, X } from "reicon-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/libs/utils";
import { useUploadOffers } from "@/services/queries/adminQueries";
import {
  checkOfferCsv,
  downloadExampleOfferCsv,
  isOfferCsvValid,
  OFFER_CSV_HEADERS,
  OFFER_CSV_MAX_BYTES,
  type OfferCsvCheck,
} from "./offerCsv";

// How many bad line numbers to spell out before "and N more"
const SHOWN_BAD_ROWS = 8;

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Pick (or drop) an offers CSV, check its columns in the browser, look over the
// first rows, then upload it. The file is only sent once the check passes.
// Shown in the offers page's bulk upload modal, which `onUploaded` closes.
export function OfferUpload({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadOffers = useUploadOffers();
  const [selected, setSelected] = useState<{ file: File; check: OfferCsvCheck } | null>(null);
  const [dragging, setDragging] = useState(false);

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a .csv file.");
      return;
    }
    if (file.size > OFFER_CSV_MAX_BYTES) {
      toast.error(`This file is too large. The limit is ${formatSize(OFFER_CSV_MAX_BYTES)}.`);
      return;
    }
    try {
      setSelected({ file, check: checkOfferCsv(await file.text()) });
    } catch {
      toast.error("Couldn't read this file. Please try again.");
    }
  };

  const clear = () => {
    setSelected(null);
    // So the same file can be picked again after fixing it
    if (inputRef.current) inputRef.current.value = "";
  };

  // Errors are toasted by the API layer
  const upload = () => {
    if (!selected) return;
    uploadOffers.mutate(
      { file: selected.file, rows: selected.check.rows },
      {
        onSuccess: ({ imported }) => {
          toast.success(`${imported.toLocaleString()} offers uploaded`);
          clear();
          onUploaded?.();
        },
      },
    );
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold text-gray-900">Upload Offers File</h2>
        <p className="mt-1 text-sm text-gray-500">
          The file is checked here first; nothing is sent until you press Upload Offers.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        <div className="mt-4">
          {!selected ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFile(event.dataTransfer.files[0]);
              }}
              className={cn(
                "flex flex-wrap items-center gap-4 rounded-xl border border-dashed p-5 transition",
                dragging ? "border-gray-900 bg-gray-100" : "border-gray-300 bg-gray-50",
              )}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200">
                <CloudUpload size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Drag and drop your CSV here</p>
                <p className="text-xs text-gray-500">
                  .csv only, up to {formatSize(OFFER_CSV_MAX_BYTES)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-9 shrink-0 items-center rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Choose File
              </button>
            </div>
          ) : (
            <SelectedFile
              file={selected.file}
              check={selected.check}
              uploading={uploadOffers.isPending}
              onClear={clear}
              onUpload={upload}
            />
          )}
        </div>
      </section>

      {/* What the file must look like; ticks off each column once a file is picked */}
      <aside className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-bold text-gray-900">File Format</h2>
        <p className="mt-1 text-sm text-gray-500">
          One offer per row, with these {OFFER_CSV_HEADERS.length} column headers in the first
          row. The order doesn't matter.
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
          {OFFER_CSV_HEADERS.map((header) => {
            const missing = selected?.check.missingHeaders.includes(header);
            return (
              <li
                key={header}
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  missing ? "font-semibold text-red-700" : "text-gray-700",
                )}
              >
                {!selected ? (
                  <span className="mx-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                ) : missing ? (
                  <X size={14} className="shrink-0" />
                ) : (
                  <CheckCircle size={14} className="shrink-0 text-green-600" />
                )}
                {header}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={downloadExampleOfferCsv}
          className="mt-5 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          <Download size={16} />
          Download Example File
        </button>
      </aside>
    </div>
  );
}

function SelectedFile({
  file,
  check,
  uploading,
  onClear,
  onUpload,
}: {
  file: File;
  check: OfferCsvCheck;
  uploading: boolean;
  onClear: () => void;
  onUpload: () => void;
}) {
  const valid = isOfferCsvValid(check);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <FileText size={28} className="shrink-0 text-gray-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">
            {formatSize(file.size)} · {check.rowCount.toLocaleString()} offers
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={uploading}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <X size={15} />
          Remove
        </button>
        <button
          type="button"
          onClick={onUpload}
          disabled={!valid || uploading}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : <CloudUpload size={16} />}
          {uploading ? "Uploading..." : "Upload Offers"}
        </button>
      </div>

      {valid ? (
        <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          <CheckCircle size={16} className="shrink-0" />
          All required columns found. Ready to upload.
        </p>
      ) : (
        <div className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {check.missingHeaders.length > 0 && (
              <li>Missing columns: {check.missingHeaders.join(", ")}.</li>
            )}
            {check.rowCount === 0 && <li>The file has no offers in it.</li>}
            {check.badRows.length > 0 && (
              <li>
                {check.badRows.length.toLocaleString()} rows have no VIN or the wrong number of
                cells: line {check.badRows.slice(0, SHOWN_BAD_ROWS).join(", ")}
                {check.badRows.length > SHOWN_BAD_ROWS &&
                  ` and ${(check.badRows.length - SHOWN_BAD_ROWS).toLocaleString()} more`}
                .
              </li>
            )}
            <li>Fix the file and choose it again, or download the example to compare.</li>
          </ul>
        </div>
      )}

      {check.preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                {["VIN", "Stock", "Vehicle", "Offer Type", "Payment", "Term", "APR", "Lender"].map(
                  (label) => (
                    <th key={label} className="whitespace-nowrap px-3 py-2">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {check.preview.map((row, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{row.VIN}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row["Stock Number"]}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.Year} {row["Brand Name"]} {row.Model} {row.Trim}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{row["Offer Type"]}</td>
                  <td className="whitespace-nowrap px-3 py-2">${row.Payment}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.Term} mo</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.APR}%</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.Lender}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {check.rowCount > check.preview.length && (
            <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
              Showing the first {check.preview.length} of {check.rowCount.toLocaleString()} offers.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
