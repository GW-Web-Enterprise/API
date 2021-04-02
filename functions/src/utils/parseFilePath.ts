export const parseFilePath = (filePath: string) => {
    const facultyId = filePath.match(/faculty_(.*)\/repo/)![1];
    const repoId = filePath.match(/\/repo_(.*)\/dropbox/)![1];
    const userId = filePath.match(/\/dropbox_(.*)\//)![1];
    return { facultyId, repoId, userId };
};
