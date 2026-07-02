import { useQuery } from "@tanstack/react-query";
import { loadFeed } from "@/services/loadFeed";

export function useTripFeed() {
  return useQuery({
    queryKey: ["tripFeed"],
    queryFn: loadFeed,
    staleTime: Infinity,
  });
}
