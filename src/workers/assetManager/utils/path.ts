export const getLegalFileName = (name: string) => name.replace(/[/\\:*?"<>|]/g, '');
