import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
}

export default function DropZone({ onFileSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <label
      htmlFor="pdf-upload"
      className={`
        relative flex flex-col items-center justify-center
        w-full min-h-[340px] rounded-2xl border-2 border-dashed
        cursor-pointer select-none transition-all duration-300
        ${isDragging || isHovering
          ? "border-primary bg-secondary/60 scale-[1.015]"
          : "border-border bg-dropzone"
        }
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={onInputChange}
      />

      {/* Animated ring */}
      <div
        className={`
          absolute inset-4 rounded-xl border border-primary/10 transition-all duration-500
          ${isDragging ? "border-primary/30 scale-[1.02]" : ""}
        `}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        {/* Icon */}
        <div
          className={`
            flex items-center justify-center w-20 h-20 rounded-2xl
            transition-all duration-300
            ${isDragging || isHovering
              ? "bg-primary text-primary-foreground scale-110"
              : "bg-secondary text-muted-foreground"
            }
          `}
        >
          {isDragging ? (
            <FileText className="w-9 h-9" strokeWidth={1.5} />
          ) : (
            <Upload className="w-9 h-9" strokeWidth={1.5} />
          )}
        </div>

        <div>
          <p className="text-xl font-semibold text-foreground">
            {isDragging ? "Släpp PDF:en här" : "Dra & släpp din PDF"}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            eller{" "}
            <span className="underline underline-offset-2 text-foreground font-medium">
              välj fil från din dator
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-stamp inline-block" />
          Endast PDF-filer — allt sker lokalt i din webbläsare
        </div>
      </div>
    </label>
  );
}
