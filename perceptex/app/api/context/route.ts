import { PrismaClient } from "../../../generated/prisma";
import { NextRequest, NextResponse } from "next/server";

// Create a PrismaClient instances
const prisma = new PrismaClient();

// This function handles HTTP POST requests made to /api/context
export async function POST(request: NextRequest) {
  try {
    // 1. Parse the Request Body:
    // The 'request' object contains the incoming HTTP request.
    // 'request.json()' asynchronously reads the request body and parses it as JSON.
    // We 'await' this because it's an asynchronous operation.
    const body = await request.json();

    // 2. Extract Data from the Body:
    // We expect the JSON body to contain 'userId', 'source', and 'data' fields.
    // This line uses destructuring to pull these values out of the 'body' object.
    const { userId, source, data } = body;

    // 3. Basic Input Validation:
    // Check if all the required fields were actually provided in the request.
    if (!userId || !source || !data) {
      // If any field is missing, return an error response.
      // NextResponse.json() creates a JSON response.
      // '{ status: 400 }' sets the HTTP status code to 400 (Bad Request).
      return NextResponse.json({ error: 'Missing required fields: userId, source, data' }, { status: 400 });
    }

    // 4. Create the Context Snapshot:
    // Use Prisma to create a new context snapshot in the database.
    // The 'create' method is used to insert a new record into the 'ContextSnapshot' table.
    // The 'data' parameter specifies the values to insert.
    const newContextSnapshot = await prisma.contextSnapshot.create({
      data: {
        userId,
        source,
        data,
      },
    });

    // 5. Return the Created Context Snapshot:
    // Return the newly created context snapshot as a JSON response.
    // '{ status: 201 }' sets the HTTP status code to 201 (Created).
    return NextResponse.json(newContextSnapshot, { status: 201 });
  } catch (error) {
    console.error('Error creating context snapshot:', error);
    // Consider more specific error logging or handling
    return NextResponse.json({ error: 'Failed to create context snapshot', details: (error as Error).message }, { status: 500 });
  }
}