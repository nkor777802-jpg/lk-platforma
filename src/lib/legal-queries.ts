import { queryOptions } from "@tanstack/react-query";
import { getMyConsentStatus, listLegalDocuments } from "./legal.functions";

export const legalDocumentsQuery = queryOptions({
  queryKey: ["legal", "documents"],
  queryFn: () => listLegalDocuments(),
});

export const myConsentStatusQuery = queryOptions({
  queryKey: ["legal", "my-consent"],
  queryFn: () => getMyConsentStatus(),
});
