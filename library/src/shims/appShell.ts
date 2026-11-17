export type ShellOrganisation = {
  slug: string;
  name: string;
  logoUrl: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "COLLABORATOR" | string;
  pendingApprovals: number;
};
export type ShellUser = { name: string | null; email: string | null; image: string | null };
