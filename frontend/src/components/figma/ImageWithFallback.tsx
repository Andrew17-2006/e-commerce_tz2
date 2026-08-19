import { useState, type ImgHTMLAttributes } from "react";

const FALLBACK_IMG_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88' fill='none'%3E%3Crect width='88' height='88' rx='6' fill='%23ECECF0'/%3E%3Cpath d='M29 56l10.5-13 7.5 9 6-7L59 56H29z' fill='%23B4B4BB'/%3E%3Ccircle cx='35' cy='34' r='5' fill='%23B4B4BB'/%3E%3C/svg%3E";

type ImageWithFallbackProps = ImgHTMLAttributes<HTMLImageElement>;

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, ...rest } = props;

  if (didError) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-muted ${className ?? ""}`}
        style={style}
      >
        <img
          src={FALLBACK_IMG_SRC}
          alt={alt ?? "Image failed to load"}
          data-original-url={src}
          className="w-1/3 h-1/3 opacity-70"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}
