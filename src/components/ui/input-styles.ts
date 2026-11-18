/**
 * Shared look for text inputs and selects. Add the width at the call site.
 * Phones get 16px text because iOS zooms into smaller inputs on focus.
 */
export const inputStyles =
  'h-7 rounded-control border border-line-strong bg-canvas px-2 text-[16px] sm:text-[14px] text-fg shadow-control placeholder:text-fg-disabled focus-visible:border-primary';
