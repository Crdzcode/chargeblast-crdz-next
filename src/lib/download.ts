/** Triggers a client-side download of a text file through a temporary object URL. */
export function downloadTextFile(
  filename: string,
  content: string,
  type = 'text/csv;charset=utf-8',
): void {
  const url = URL.createObjectURL(new Blob([content], { type }));

  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke on the next tick so the browser has started the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
