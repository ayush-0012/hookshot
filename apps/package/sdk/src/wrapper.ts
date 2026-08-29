// wrapper class, which will be publishsed as an npm package to interact with the service

export type JsonObject = {
  [key: string]: string | number | boolean | null | JsonObject | JsonObject[];
};

export class Hookshot {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async ingest(
    endpointId: string,
    payloadBody: JsonObject,
    eventType: string[],
  ) {
    const errors: string[] = [];

    if (!endpointId) {
      errors.push("EndpointId is missing");
    }

    if (!eventType) {
      errors.push("Event type is missing");
    }

    if (!payloadBody) {
      errors.push("Payload data is missing");
    }

    if (errors.length > 0) {
      throw new Error(JSON.stringify({ errors }));
    }

    // fetch api call to the ingestion api, becuase this method will be used from someone else's service
    // can't import and invoke the ingestion like that

    try {
      const jobIngestion = await fetch("http://localhost:3000", {
        method: "POST",
        body: JSON.stringify({
          payloadBody,
          eventType,
          endpointId,
          apiKey: this.apiKey, // for validaiton
        }),
      });

      console.log("ingestion method invoked", jobIngestion);

      return jobIngestion;
    } catch (error) {
      throw {
        message: "Failed to ingest your request, please try again",
        error,
      };
    }
  }
}
