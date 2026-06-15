"use client";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-4 text-center text-ink">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-hot-soft text-2xl">⚠️</div>
      <div>
        <h1 className="text-lg font-semibold">Không thể tải dữ liệu</h1>
        <p className="mt-1 max-w-sm text-sm text-faint">
          Đã có lỗi xảy ra khi tải dòng tin. Vui lòng thử lại sau ít phút.
        </p>
        {error.digest && <p className="mt-1 text-xs text-faint">Mã lỗi: {error.digest}</p>}
      </div>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-canvas-2 transition-opacity hover:opacity-90"
      >
        Thử lại
      </button>
    </div>
  );
}
