export default interface PostDTO {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
