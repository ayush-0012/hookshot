import type { Request, Response } from "express";

export async function createUserEndpoint(req: Request, res: Response) {
  // one endpoint can have multiple event types, so event type will be an array (must validate)
  const { endpoint, eventTypes } = req.body;

  // db call to create a record in the endpoint table

  // return the endpoint id to the user (to differentiate the endpoint in code level using the id)
}
