export interface Comment {
  id: string;
  authorId: string;
  blogId: string;
  content: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
