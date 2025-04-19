import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";

// Define a schema for our announcements
const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: String,
    required: true,
  },
  urgency: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  category: {
    type: String,
    required: true,
  },
});

// Create model or use existing one
let Announcement: mongoose.Model<any>;
try {
  Announcement = mongoose.model("Announcement");
} catch {
  Announcement = mongoose.model("Announcement", AnnouncementSchema);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, urgency } = body;

    if (!title || !content || !category || !urgency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Get user info from session (placeholder - in a real app, get from session)
    const author = "Manager"; // Replace with actual user name from session
    
    const announcement = new Announcement({
      title,
      content,
      category,
      urgency,
      author,
      date: new Date(),
    });

    await announcement.save();

    // Here you would handle email notifications if sendEmail was true
    // if (body.sendEmail) { ... send emails to employees ... }

    return NextResponse.json({
      success: true,
      message: "Announcement posted successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error posting announcement:", error);
    return NextResponse.json(
      { error: "Failed to post announcement" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const announcements = await Announcement.find({})
      .sort({ date: -1 })
      .exec();

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
