/**
 * Database operations for files table
 */

import { createClient } from "@/lib/supabase";
import { Language } from "@/types/review";
import { DbFile } from "@/types/database";

export async function saveFile(
  name: string,
  content: string,
  language: Language,
  userId: string
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("files")
    .insert({
      user_id: userId,
      name,
      content,
      language,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving file:", error);
    throw new Error(`Failed to save file: ${error.message}`);
  }

  return data.id;
}

export async function getFileById(fileId: string): Promise<DbFile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (error) {
    console.error("Error fetching file:", error);
    return null;
  }

  return data;
}

export async function getFilesByUser(userId: string): Promise<DbFile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching files:", error);
    return [];
  }

  return data || [];
}

export async function updateFile(
  fileId: string,
  updates: Partial<Pick<DbFile, "name" | "content" | "language">>
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("files")
    .update(updates)
    .eq("id", fileId);

  if (error) {
    console.error("Error updating file:", error);
    throw new Error(`Failed to update file: ${error.message}`);
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    console.error("Error deleting file:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
