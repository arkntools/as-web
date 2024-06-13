export const showNotingCanBeExportToast = () => {
  ElMessage({
    message: 'Nothing can be exported',
    type: 'info',
    grouping: true,
  });
};
