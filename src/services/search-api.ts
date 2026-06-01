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
  const response = await axios.get<ArchiveSearchResponse>(
    `${JDS_API_BASE_URL}/search/`,
    { params },
  );
  return response.data;
}

