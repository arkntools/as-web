export const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const hasSelection = () => {
  const s = window.getSelection();
  return Boolean(s && s.rangeCount > 0 && !s.isCollapsed);
};
