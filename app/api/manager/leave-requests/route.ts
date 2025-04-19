import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import LeaveRequest from "@/models/LeaveRequest";

export async function GET() {
    try {
        await connectToDatabase();
        const requests = await LeaveRequest.find({})
            .sort({ createdAt: -1 });
        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch leave requests" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, status } = body;

        if (!requestId || !status) {
            return NextResponse.json(
                { error: "Request ID and status are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            requestId,
            { status },
            { new: true }
        );

        if (!updatedRequest) {
            return NextResponse.json(
                { error: "Leave request not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update leave request" },
            { status: 500 }
        );
    }
}
