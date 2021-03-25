export type IFacultyMember = {
    email: string;
    displayName: string;
    photoURL: string | null;
    role: 'student' | 'coordinator';
};
