const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry => entry.isFile;
const isDirectoryEntry = (entry: FileSystemEntry): entry is FileSystemDirectoryEntry => entry.isDirectory;

const getFilesFromFileSystemEntry = (entry: FileSystemEntry) => {
  if (isFileEntry(entry)) {
    return new Promise<File[]>(resolve => {
      entry.file(
        file => resolve([file]),
        e => {
          console.error(e);
          resolve([]);
        },
      );
    });
  }
  if (isDirectoryEntry(entry)) {
    const dirReader = entry.createReader();
    return new Promise<File[]>(resolve => {
      dirReader.readEntries(
        // eslint-disable-next-line ts/no-use-before-define
        entries => resolve(getFilesFromFileSystemEntries(entries)),
        e => {
          console.error(e);
          resolve([]);
        },
      );
    });
  }
  return Promise.resolve([]);
};

const getFilesFromFileSystemEntries = async (entries: FileSystemEntry[]) =>
  (await Promise.all(entries.map(getFilesFromFileSystemEntry))).flat();

export const getFilesFromDataTransferItems = (items: DataTransferItem[]) => {
  const entries = items.flatMap(item => {
    if (item.kind !== 'file') return [];
    const entry = item.webkitGetAsEntry();
    if (!entry) return [];
    return [entry];
  });
  return getFilesFromFileSystemEntries(entries);
};
