"use server";

import { auth } from "@clerk/nextjs";

import { getStudentProfileForTeacher } from "@/db/queries";
import { generateStudentInsight, type StudentInsight } from "@/lib/ai";

// getStudentProfileForTeacher already gates on the requesting teacher sharing
// a class with this student — returning null for both "doesn't exist" and
// "not yours to see", so there's no separate authorization check to write here.
export const generateInsightForStudent = async (studentId: string): Promise<StudentInsight> => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const student = await getStudentProfileForTeacher(studentId);

  if (!student) {
    throw new Error("Student not found");
  }

  if (student.conceptMastery.length === 0 && student.assignmentHistory.length === 0) {
    throw new Error("Not enough activity yet to analyze this student.");
  }

  return generateStudentInsight({
    studentName: student.userName,
    points: student.points,
    currentStreak: student.currentStreak,
    conceptMastery: student.conceptMastery.map((c) => ({
      title: c.title,
      masteryPct: c.masteryPct,
      totalCount: c.totalCount,
    })),
    assignmentHistory: student.assignmentHistory.map((a) => ({
      title: a.title,
      status: a.status,
      score: a.score,
      totalPoints: a.totalPoints,
    })),
  });
};
