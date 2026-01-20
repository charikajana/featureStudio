export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  status?: 'new' | 'modified';
}

export interface CreateFeatureRequest {
  folderPath: string;
  featureName: string;
  tags: string[];
}

export interface RepositoryConfig {
  url: string;
  pat: string;
  username: string;
}
