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

// This function handles HTTP GET requests made to /api/context
export async function GET(request: NextRequest) {
  try {
    // 1. Parse Query Parameters:
    // For GET requests, data is often passed in the URL as query parameters (e.g., /api/context?userId=123).
    // 'new URL(request.url)' creates a URL object from the request's URL string.
    // '.searchParams' gives you access to the query parameters.
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Get the value of the 'userId' query parameter.

    // 2. Validate Input (Check for userId):
    // In this example, we're making 'userId' a required parameter for fetching context snapshots.
    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    // 3. Interact with the Database (Fetch records):
    // 'prisma.contextSnapshot.findMany()' is a Prisma method to retrieve multiple records.
    const contextSnapshots = await prisma.contextSnapshot.findMany({
      // The 'where' option is used to filter the records.
      // Here, we're finding all snapshots where the 'userId' field matches the provided 'userId'.
      where: {
        userId: userId,
      },
      // The 'orderBy' option sorts the results.
      // Here, we're sorting by the 'timestamp' field in descending order (newest first).
      orderBy: {
        timestamp: 'desc',
      },
    });

    // 4. Send a Success Response:
    // Return the array of found context snapshots as a JSON response.
    // The default status code for a successful GET is 200 (OK).
    return NextResponse.json(contextSnapshots);

  } catch (error) {
    // 5. Handle Errors:
    console.error('Error fetching context snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch context snapshots', details: (error as Error).message }, { status: 500 });
  }
}