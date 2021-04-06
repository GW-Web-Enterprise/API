import { firestore } from 'firebase-admin';

export type IFacultyMember = {
    email: string;
    displayName: string;
    photoURL: string | null;
    role: 'student' | 'coordinator';
};

export type IDropbox = {
    facultyId: string;
    repoId: string;
    status: 'pending' | 'approved' | 'rejected';
    size: 0;
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    createdAt: firestore.Timestamp;
    reviewerId: string;
    reviewerName: string;
    reviewerEmail: string;
    feedback: string;
    reviewedAt: firestore.Timestamp;
};
