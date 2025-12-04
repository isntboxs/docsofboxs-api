export interface BlogType {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  author: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}
