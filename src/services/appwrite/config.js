import { Client, Account, Databases, Storage } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Configuration constants
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    resumes: import.meta.env.VITE_APPWRITE_RESUMES_COLLECTION_ID,
    sessions: import.meta.env.VITE_APPWRITE_SESSIONS_COLLECTION_ID,
    interactions: import.meta.env.VITE_APPWRITE_INTERACTIONS_COLLECTION_ID,
  },
  storage: {
    resumesBucket: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
  },
};

export default client;