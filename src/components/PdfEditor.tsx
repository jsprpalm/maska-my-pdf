import { useEffect, useRef, useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { Download, Trash2, Undo2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Rect {
  pageIndex: number;
  // In PDF points (bottom-left origin)
  x: number;
  y: number;
  width: number;
  height: number;
  // In canvas pixels (for display)
  canvasX: number;
  canvasY: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface Drawing {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface PageMeta {
  width: number;   // PDF point width
  height: number;  // PDF point height
  scale: number;
}

interface PdfEditorProps {
  file: File;
  onReset: () => void;
}

export default function PdfEditor({ file, onReset }: PdfEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.4);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the PDF
  useEffect(() => {
    const loadPdf = async () => {
      const bytes = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    };
    loadPdf();
  }, [file]);

  // Render the current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      setIsRendering(true);
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      setPageMeta({
        width: page.getViewport({ scale: 1 }).width,
        height: page.getViewport({ scale: 1 }).height,
        scale,
      });

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Size overlay canvas
      const overlay = overlayRef.current!;
      overlay.width = viewport.width;
      overlay.height = viewport.height;

      setIsRendering(false);
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Draw redaction rectangles + current drawing on the overlay canvas
  useEffect(() => {
    if (!overlayRef.current || !pageMeta) return;
    const overlay = overlayRef.current;
    const ctx = overlay.getContext("2d")!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Existing rects for this page
    ctx.fillStyle = "#000000";
    rects
      .filter((r) => r.pageIndex === currentPage)
      .forEach((r) => {
        ctx.fillRect(r.canvasX, r.canvasY, r.canvasWidth, r.canvasHeight);
      });

    // In-progress drawing
    if (drawing) {
      const x = Math.min(drawing.startX, drawing.currentX);
      const y = Math.min(drawing.startY, drawing.currentY);
      const w = Math.abs(drawing.currentX - drawing.startX);
      const h = Math.abs(drawing.currentY - drawing.startY);
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
    }
  }, [rects, drawing, currentPage, pageMeta]);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = overlayRef.current!.getBoundingClientRect();
      const scaleX = overlayRef.current!.width / rect.width;
      const scaleY = overlayRef.current!.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      setDrawing({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
    },
    [getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawing) return;
      const pos = getCanvasPos(e);
      setDrawing((d) => d ? { ...d, currentX: pos.x, currentY: pos.y } : null);
    },
    [drawing, getCanvasPos]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawing || !pageMeta) return;
      const pos = getCanvasPos(e);

      const canvasX = Math.min(drawing.startX, pos.x);
      const canvasY = Math.min(drawing.startY, pos.y);
      const canvasWidth = Math.abs(pos.x - drawing.startX);
      const canvasHeight = Math.abs(pos.y - drawing.startY);

      if (canvasWidth < 4 || canvasHeight < 4) {
        setDrawing(null);
        return;
      }

      // Convert canvas pixels → PDF points
      // Canvas: origin top-left. PDF: origin bottom-left.
      const pdfX = canvasX / pageMeta.scale;
      const pdfY = pageMeta.height - (canvasY + canvasHeight) / pageMeta.scale;
      const pdfWidth = canvasWidth / pageMeta.scale;
      const pdfHeight = canvasHeight / pageMeta.scale;

      const newRect: Rect = {
        pageIndex: currentPage,
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
        canvasX,
        canvasY,
        canvasWidth,
        canvasHeight,
      };

      setRects((prev) => [...prev, newRect]);
      setDrawing(null);
    },
    [drawing, pageMeta, currentPage, getCanvasPos]
  );

  const handleMouseLeave = useCallback(() => {
    setDrawing(null);
  }, []);

  const undoLast = useCallback(() => {
    setRects((prev) => {
      const pageRects = prev.filter((r) => r.pageIndex === currentPage);
      if (pageRects.length === 0) return prev;
      const lastIdx = prev.lastIndexOf(pageRects[pageRects.length - 1]);
      return [...prev.slice(0, lastIdx), ...prev.slice(lastIdx + 1)];
    });
  }, [currentPage]);

  const clearPage = useCallback(() => {
    setRects((prev) => prev.filter((r) => r.pageIndex !== currentPage));
  }, [currentPage]);

  const clearAll = useCallback(() => {
    setRects([]);
  }, []);

  const downloadRedacted = useCallback(async () => {
    if (!pdfDoc) return;
    setIsDownloading(true);
    try {
      const newPdf = await PDFDocument.create();
      const renderScale = 2; // High-res render for quality

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });

        // Render page to an offscreen canvas
        const offscreen = document.createElement("canvas");
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const ctx = offscreen.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Bake in redaction rectangles for this page
        const pageRects = rects.filter((r) => r.pageIndex === pageNum);
        if (pageRects.length > 0) {
          // We need page dimensions in PDF points to recalculate canvas coords at renderScale
          const pointViewport = page.getViewport({ scale: 1 });
          ctx.fillStyle = "#000000";
          for (const r of pageRects) {
            // r coords are in PDF points; convert to renderScale canvas pixels
            // PDF origin is bottom-left; canvas origin is top-left
            const cx = r.x * renderScale;
            const cy = (pointViewport.height - r.y - r.height) * renderScale;
            const cw = r.width * renderScale;
            const ch = r.height * renderScale;
            ctx.fillRect(cx, cy, cw, ch);
          }
        }

        // Export canvas as PNG and embed in new PDF
        const pngDataUrl = offscreen.toDataURL("image/png");
        const pngBytes = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
        const pngImage = await newPdf.embedPng(pngBytes);

        // Add page with same dimensions as original
        const pointViewport = page.getViewport({ scale: 1 });
        const newPage = newPdf.addPage([pointViewport.width, pointViewport.height]);
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pointViewport.width,
          height: pointViewport.height,
        });
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-maskad.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [rects, pdfDoc, totalPages, file]);

  const pageRectCount = rects.filter((r) => r.pageIndex === currentPage).length;
  const totalRectCount = rects.length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Tillbaka"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-semibold leading-tight truncate max-w-[200px] sm:max-w-sm">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {totalRectCount} maskning{totalRectCount !== 1 ? "ar" : ""} totalt
            </p>
          </div>
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium tabular-nums px-1">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Zooma ut"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium px-1 tabular-nums w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.2))}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Zooma in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={undoLast}
            disabled={pageRectCount === 0}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors text-muted-foreground hover:text-foreground"
            title="Ångra senaste"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearPage}
            disabled={pageRectCount === 0}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 transition-colors text-muted-foreground hover:text-foreground"
            title="Rensa denna sida"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Button
            onClick={downloadRedacted}
            disabled={isDownloading || totalRectCount === 0}
            className="bg-stamp text-stamp-foreground hover:opacity-90 transition-opacity gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isDownloading ? "Skapar PDF..." : "Ladda ner"}
            </span>
          </Button>
        </div>
      </header>

      {/* Instructions banner */}
      <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-muted/60 border-b border-border text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-stamp inline-block shrink-0 animate-pulse-ring" />
        Rita svarta rektanglar direkt på PDF:en för att maskera innehåll. Håll och dra för att skapa ett block.
      </div>

      {/* PDF Canvas area */}
      <main className="flex-1 flex items-start justify-center p-6 overflow-auto pdf-scroll bg-canvas">
        <div className="relative shadow-2xl" style={{ display: "inline-block" }}>
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 rounded-sm">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
          <canvas ref={canvasRef} className="block" style={{ display: "block" }} />
          <canvas
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            style={{ display: "block" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      </main>

      {/* Bottom status */}
      {pageRectCount > 0 && (
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-stamp inline-block" />
            {pageRectCount} maskning{pageRectCount !== 1 ? "ar" : ""} på denna sida
            <button
              onClick={clearPage}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
