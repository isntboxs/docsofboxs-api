export interface Comment {
  id: string;
  authorId: string;
  blogId: string;
  content: string;
  parentId: string | null;
  depth: number;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
