import { queryOptions } from "@tanstack/react-query";
import { listLegalDocuments } from "./legal.functions";

export const legalDocumentsQuery = queryOptions({
  queryKey: ["legal", "documents"],
  queryFn: () => listLegalDocuments(),
});
