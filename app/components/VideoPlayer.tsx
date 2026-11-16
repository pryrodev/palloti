"use client";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#e8e2d9]"
      style={{ boxShadow: "0 4px 24px rgba(58,31,10,0.08)", background: "#1a1410" }}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        style={{ display: "block", width: "100%", maxHeight: "520px" }}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
