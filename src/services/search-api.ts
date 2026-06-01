import axios from "axios";

import type {
  ArchiveSearchParams,
  ArchiveSearchResponse,
} from "@/types/search";

const JDS_API_BASE_URL =
  import.meta.env.VITE_JDS_API_BASE_URL || "https://portal.jawafdehi.org/api";

export async function searchArchive(
  params: ArchiveSearchParams,
): Promise<ArchiveSearchResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(name, item));
    } else if (value !== undefined) {
      query.set(name, String(value));
    }
  });
  const suffix = query.toString();
  const response = await axios.get<ArchiveSearchResponse>(
    `${JDS_API_BASE_URL}/search/${suffix ? `?${suffix}` : ""}`,
  );
  return response.data;
}
