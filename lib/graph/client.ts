import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";

export function createGraphClient(token: string): Client {
  return Client.init({
    authProvider: (done) => done(null, token),
    defaultVersion: "v1.0",
  });
}
