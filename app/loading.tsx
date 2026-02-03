export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-24 h-24"
      >
        <source src="/gif/loading.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
