import { urls } from "@/adapters/cloudinary/urls";

export const cld = urls(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "vgqybufp");
