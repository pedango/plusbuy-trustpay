export function ProductMedia({
  imageUrl,
  colorHex,
  name,
  className,
  fit = "cover",
}: {
  imageUrl?: string | null;
  colorHex: string;
  name: string;
  className: string;
  fit?: "cover" | "contain";
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${className} ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
    );
  }

  return (
    <div
      className={`${className} border border-black/10`}
      style={{ background: colorHex }}
      role="img"
      aria-label={name}
    />
  );
}
