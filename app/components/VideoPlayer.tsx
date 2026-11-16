"use client";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#e8e2d9]"
      style={{ boxShadow: "0 4px 24px rgba(58,31,10,0.08)", background: "#1a1410" }}>
      {title && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-sm font-bold text-white/80 uppercase tracking-wider">{title}</p>
        </div>
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        style={{ display: "block", width: "100%", maxHeight: "520px" }}
        key={src}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
