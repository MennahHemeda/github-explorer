export interface Note {
  id: string;
  /** GitHub username, lowercase. */
  login: string;
  /** Repository name, or null for a note about the user. */
  repo: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_MAX_LENGTH = 2000;
